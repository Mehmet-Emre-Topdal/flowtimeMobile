import { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
    Vibration, AppState, AppStateStatus, BackHandler, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/storeHooks';
import { useGetUserConfigQuery } from '../features/timer/api/timerApi';
import { useCreateSessionMutation } from '../features/analytics/api/sessionsApi';
import { useUpdateTaskFocusTimeMutation } from '../features/kanban/api/tasksApi';
import { TaskDto } from '../types/task';
import { DEFAULT_CONFIG, UserConfig } from '../types/config';
import {
    saveTimerState, loadTimerState, clearTimerState,
} from '../lib/timerStorage';
import {
    updateTimerNotification, cancelTimerNotifications,
    scheduleBreakEndNotification, handleNotificationAction,
    addNotificationResponseListener, NotificationAction,
} from '../lib/notifications';

interface Props {
    selectedTask: TaskDto | null;
}

function getBreakMinutes(focusSeconds: number, config: UserConfig): number {
    const focusMinutes = focusSeconds / 60;
    const interval = config.intervals.find(
        i => focusMinutes >= i.min && focusMinutes < i.max
    ) ?? config.intervals[config.intervals.length - 1];
    return interval.break;
}

function formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TimerScreen({ selectedTask }: Props) {
    const { t } = useTranslation();
    const { user } = useAppSelector(state => state.auth);
    const uid = user?.uid ?? '';

    const { data: config, isLoading: configLoading } = useGetUserConfigQuery(uid, { skip: !uid });
    const [createSession] = useCreateSessionMutation();
    const [updateFocusTime] = useUpdateTaskFocusTimeMutation();

    const effectiveConfig = config ?? DEFAULT_CONFIG;

    // --- Saat bazlı timer state ---
    const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle');
    const [isPaused, setIsPaused] = useState(false);
    const [, forceUpdate] = useState(0); // sadece re-render için

    // Ref'ler — render tetiklemez, hesaplama için kullanılır
    const phaseStartTimeRef = useRef<number>(0);     // mevcut faz ne zaman başladı
    const pausedAtRef = useRef<number | null>(null);  // pause anında Date.now()
    const pausedDurationRef = useRef<number>(0);      // toplam pause süresi (ms)
    const breakDurationRef = useRef<number>(0);       // break fazının toplam süresi (s)
    const focusStartTimeRef = useRef<number>(0);      // focus başlangıcı (session kaydı için)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const phaseRef = useRef<'idle' | 'focus' | 'break'>('idle');
    const isPausedRef = useRef(false);

    // Ref'leri state ile senkron tut
    phaseRef.current = phase;
    isPausedRef.current = isPaused;

    // Geçen süreyi hesapla (saniye)
    const getElapsedSeconds = useCallback((): number => {
        if (phaseRef.current === 'idle') return 0;
        const pauseOffset = pausedAtRef.current
            ? Date.now() - pausedAtRef.current + pausedDurationRef.current
            : pausedDurationRef.current;
        const elapsed = (Date.now() - phaseStartTimeRef.current - pauseOffset) / 1000;
        return Math.max(0, elapsed);
    }, []);

    // Break kalan süresini hesapla (saniye)
    const getBreakRemaining = useCallback((): number => {
        return Math.max(0, breakDurationRef.current - getElapsedSeconds());
    }, [getElapsedSeconds]);

    // --- setInterval: sadece re-render + bildirim güncelle ---
    const startTick = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            forceUpdate(n => n + 1);

            const currentPhase = phaseRef.current;
            const paused = isPausedRef.current;

            if (currentPhase === 'idle' || paused) return;

            // Bildirimi güncelle
            if (currentPhase === 'focus') {
                updateTimerNotification('focus', getElapsedSeconds(), false);
            } else if (currentPhase === 'break') {
                const remaining = getBreakRemaining();
                updateTimerNotification('break', remaining, false);
                // Break bitti mi?
                if (remaining <= 0) {
                    clearInterval(intervalRef.current!);
                    intervalRef.current = null;
                    Vibration.vibrate([0, 300, 150, 300]);
                }
            }
        }, 1000);
    }, [getElapsedSeconds, getBreakRemaining]);

    const stopTick = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // --- Session kaydet ---
    const saveCurrentSession = useCallback(async (focusSec: number) => {
        if (focusSec < 60 || !uid || !focusStartTimeRef.current) return;
        const startedAt = new Date(focusStartTimeRef.current).toISOString();
        const endedAt = new Date().toISOString();
        await createSession({
            userId: uid,
            startedAt,
            endedAt,
            durationSeconds: Math.round(focusSec),
            breakDurationSeconds: 0,
            taskId: selectedTask?.id ?? null,
            taskTitle: selectedTask?.title ?? null,
        });
        if (selectedTask) {
            await updateFocusTime({
                taskId: selectedTask.id,
                additionalMinutes: Math.round(focusSec / 60),
            });
        }
    }, [uid, selectedTask, createSession, updateFocusTime]);

    // --- State'i AsyncStorage'a kaydet ---
    const persistState = useCallback((
        currentPhase: 'idle' | 'focus' | 'break',
        currentIsPaused: boolean,
    ) => {
        if (currentPhase === 'idle') {
            clearTimerState();
            return;
        }
        saveTimerState({
            phase: currentPhase,
            phaseStartTime: phaseStartTimeRef.current,
            breakDuration: breakDurationRef.current,
            isPaused: currentIsPaused,
            pausedAt: pausedAtRef.current,
            focusStartTime: focusStartTimeRef.current,
        });
    }, []);

    // --- Handlers ---
    const handleStart = useCallback(() => {
        const now = Date.now();
        phaseStartTimeRef.current = now;
        focusStartTimeRef.current = now;
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;
        breakDurationRef.current = 0;

        setPhase('focus');
        setIsPaused(false);
        startTick();
        updateTimerNotification('focus', 0, false);
        saveTimerState({
            phase: 'focus',
            phaseStartTime: now,
            breakDuration: 0,
            isPaused: false,
            pausedAt: null,
            focusStartTime: now,
        });
    }, [startTick]);

    const handlePause = useCallback(() => {
        pausedAtRef.current = Date.now();
        setIsPaused(true);
        stopTick();
        const sec = phaseRef.current === 'focus' ? getElapsedSeconds() : getBreakRemaining();
        updateTimerNotification(phaseRef.current as 'focus' | 'break', sec, true);
        persistState(phaseRef.current, true);
    }, [stopTick, getElapsedSeconds, getBreakRemaining, persistState]);

    const handleResume = useCallback(() => {
        if (pausedAtRef.current) {
            pausedDurationRef.current += Date.now() - pausedAtRef.current;
            pausedAtRef.current = null;
        }
        setIsPaused(false);
        startTick();
        const sec = phaseRef.current === 'focus' ? getElapsedSeconds() : getBreakRemaining();
        updateTimerNotification(phaseRef.current as 'focus' | 'break', sec, false);
        persistState(phaseRef.current, false);
    }, [startTick, getElapsedSeconds, getBreakRemaining, persistState]);

    const handleStopFocus = useCallback(async () => {
        stopTick();
        const focusSec = getElapsedSeconds();
        await saveCurrentSession(focusSec);

        const breakSec = getBreakMinutes(focusSec, effectiveConfig) * 60;
        breakDurationRef.current = breakSec;
        phaseStartTimeRef.current = Date.now();
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;

        setPhase('break');
        setIsPaused(false);
        startTick();
        updateTimerNotification('break', breakSec, false);
        scheduleBreakEndNotification(breakSec);
        saveTimerState({
            phase: 'break',
            phaseStartTime: phaseStartTimeRef.current,
            breakDuration: breakSec,
            isPaused: false,
            pausedAt: null,
            focusStartTime: focusStartTimeRef.current,
        });
    }, [stopTick, getElapsedSeconds, saveCurrentSession, effectiveConfig, startTick]);

    const handleStopBreak = useCallback(() => {
        stopTick();
        setPhase('idle');
        setIsPaused(false);
        phaseStartTimeRef.current = 0;
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;
        breakDurationRef.current = 0;
        cancelTimerNotifications();
        clearTimerState();
    }, [stopTick]);

    const handleNewSession = useCallback(() => {
        stopTick();
        cancelTimerNotifications();
        handleStart();
    }, [stopTick, handleStart]);

    const handleReset = useCallback(async () => {
        stopTick();
        if (phaseRef.current === 'focus') {
            const focusSec = getElapsedSeconds();
            if (focusSec >= 60) await saveCurrentSession(focusSec);
        }
        setPhase('idle');
        setIsPaused(false);
        phaseStartTimeRef.current = 0;
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;
        breakDurationRef.current = 0;
        cancelTimerNotifications();
        clearTimerState();
    }, [stopTick, getElapsedSeconds, saveCurrentSession]);

    const handleCloseApp = useCallback(() => {
        handleReset().then(() => {
            if (Platform.OS === 'android') {
                BackHandler.exitApp();
            }
        });
    }, [handleReset]);

    // --- Bildirim aksiyonları ---
    const notificationHandlers = {
        pause: handlePause,
        resume: handleResume,
        stopFocus: handleStopFocus,
        endBreak: handleStopBreak,
        closeApp: handleCloseApp,
    };

    // --- AppState: arka plandan ön plana dönünce timer'ı senkronize et ---
    useEffect(() => {
        const onAppStateChange = async (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                // Ön plana döndü — AsyncStorage'dan state yükle ve recalculate
                const saved = await loadTimerState();
                if (!saved || saved.phase === 'idle') return;

                phaseStartTimeRef.current = saved.phaseStartTime;
                breakDurationRef.current = saved.breakDuration;
                focusStartTimeRef.current = saved.focusStartTime;
                pausedAtRef.current = saved.pausedAt;
                pausedDurationRef.current = 0;

                setPhase(saved.phase);
                setIsPaused(saved.isPaused);

                if (!saved.isPaused) {
                    startTick();
                }
            } else if (nextState === 'background' || nextState === 'inactive') {
                persistState(phaseRef.current, isPausedRef.current);
            }
        };

        const sub = AppState.addEventListener('change', onAppStateChange);
        return () => sub.remove();
    }, [startTick, persistState]);

    // --- Bildirim response listener (buton tıklamaları) ---
    useEffect(() => {
        const sub = addNotificationResponseListener(action => {
            handleNotificationAction(action, notificationHandlers);
        });
        return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handlePause, handleResume, handleStopFocus, handleStopBreak, handleCloseApp]);

    // --- Cleanup ---
    useEffect(() => {
        return () => { stopTick(); };
    }, [stopTick]);

    if (configLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#6366f1" />
            </View>
        );
    }

    // UI için anlık değerleri hesapla
    const elapsedSeconds = phase === 'focus' ? getElapsedSeconds() : 0;
    const breakRemaining = phase === 'break' ? getBreakRemaining() : 0;
    const breakMinutes = getBreakMinutes(elapsedSeconds, effectiveConfig);

    return (
        <View style={styles.container}>
            {selectedTask ? (
                <View style={styles.taskBanner}>
                    <Text style={styles.taskBannerLabel}>{t('timer.workingOn')}</Text>
                    <Text style={styles.taskBannerTitle} numberOfLines={1}>{selectedTask.title}</Text>
                </View>
            ) : (
                <View style={styles.taskBanner}>
                    <Text style={styles.taskBannerEmpty}>{t('tasks.noTasks')}</Text>
                </View>
            )}

            <View style={styles.timerArea}>
                {phase === 'idle' && (
                    <>
                        <Text style={styles.timerLabel}>{t('timer.readyToFocus')}</Text>
                        <Text style={styles.timerDisplay}>00:00</Text>
                    </>
                )}
                {phase === 'focus' && (
                    <>
                        <Text style={styles.timerLabel}>
                            {isPaused ? t('timer.paused') : t('tasks.focusing')}
                        </Text>
                        <Text style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</Text>
                        <Text style={styles.timerHint}>
                            {t('settings.focusRange')}: {breakMinutes} {t('tasks.focused')}
                        </Text>
                    </>
                )}
                {phase === 'break' && (
                    <>
                        <Text style={[styles.timerLabel, { color: '#22c55e' }]}>
                            {breakRemaining === 0 ? t('timer.rechargingFocus') : t('timer.breakTime')}
                        </Text>
                        <Text style={[styles.timerDisplay, { color: '#22c55e' }]}>
                            {formatTime(breakRemaining)}
                        </Text>
                    </>
                )}
            </View>

            <View style={styles.buttonArea}>
                {phase === 'idle' && (
                    <TouchableOpacity style={styles.mainBtn} onPress={handleStart}>
                        <Text style={styles.mainBtnText}>{t('timer.start')}</Text>
                    </TouchableOpacity>
                )}
                {phase === 'focus' && (
                    <View style={styles.focusButtons}>
                        <TouchableOpacity
                            style={[styles.mainBtn, styles.pauseBtn, { flex: 1 }]}
                            onPress={isPaused ? handleResume : handlePause}
                        >
                            <Text style={styles.mainBtnText}>
                                {isPaused ? t('common.resume') : t('common.pause')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.mainBtn, styles.stopBtn, { flex: 1 }]}
                            onPress={handleStopFocus}
                            disabled={isPaused}
                        >
                            <Text style={[styles.mainBtnText, isPaused && { opacity: 0.4 }]}>
                                {t('timer.break')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                {phase === 'break' && (
                    <View style={styles.breakButtonsWrapper}>
                        {breakRemaining > 0 && (
                            <TouchableOpacity
                                style={[styles.mainBtn, styles.pauseBtn]}
                                onPress={isPaused ? handleResume : handlePause}
                            >
                                <Text style={styles.mainBtnText}>
                                    {isPaused ? t('common.resume') : t('common.pause')}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.breakButtons}>
                            <TouchableOpacity
                                style={[styles.mainBtn, { flex: 1 }]}
                                onPress={handleNewSession}
                                disabled={isPaused}
                            >
                                <Text style={[styles.mainBtnText, isPaused && { opacity: 0.4 }]}>
                                    {t('timer.newSession')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.endBtn}
                                onPress={handleStopBreak}
                                disabled={isPaused}
                            >
                                <Text style={[styles.endBtnText, isPaused && { opacity: 0.4 }]}>
                                    {t('common.finish')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {phase !== 'idle' && (
                    <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                        <Text style={styles.resetBtnText}>{t('common.clear', 'Sıfırla')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.stats}>
                <Text style={styles.statsText}>
                    {t('tasks.focused')}: {Math.round((selectedTask?.totalFocusedTime ?? 0))} {t('tasks.focused')}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f0f', paddingHorizontal: 24 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
    taskBanner: {
        backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14,
        marginTop: 16, borderWidth: 1, borderColor: '#2a2a2a',
    },
    taskBannerLabel: { color: '#555', fontSize: 12, marginBottom: 2 },
    taskBannerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
    taskBannerEmpty: { color: '#555', fontSize: 14, textAlign: 'center' },
    timerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    timerLabel: { color: '#888', fontSize: 16, marginBottom: 12 },
    timerDisplay: { color: '#fff', fontSize: 72, fontWeight: '200', letterSpacing: 2 },
    timerHint: { color: '#555', fontSize: 14, marginTop: 12 },
    buttonArea: { paddingBottom: 24, gap: 10 },
    mainBtn: {
        backgroundColor: '#6366f1', paddingVertical: 16,
        borderRadius: 12, alignItems: 'center',
    },
    focusButtons: { flexDirection: 'row', gap: 10 },
    stopBtn: { backgroundColor: '#f59e0b' },
    pauseBtn: { backgroundColor: '#3b82f6' },
    mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    breakButtonsWrapper: { gap: 10 },
    breakButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    endBtn: { paddingVertical: 16, paddingHorizontal: 14 },
    endBtnText: { color: '#555', fontSize: 15 },
    resetBtn: { alignItems: 'center', paddingVertical: 10 },
    resetBtnText: { color: '#444', fontSize: 14 },
    stats: { paddingBottom: 12, alignItems: 'center' },
    statsText: { color: '#333', fontSize: 13 },
});
