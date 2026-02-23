import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Vibration } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/storeHooks';
import { useGetUserConfigQuery } from '../features/timer/api/timerApi';
import { useCreateSessionMutation } from '../features/analytics/api/sessionsApi';
import { useUpdateTaskFocusTimeMutation } from '../features/kanban/api/tasksApi';
import { TaskDto } from '../types/task';
import { DEFAULT_CONFIG, UserConfig } from '../types/config';

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
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerScreen({ selectedTask }: Props) {
    const { t } = useTranslation();
    const { user } = useAppSelector(state => state.auth);
    const uid = user?.uid ?? '';

    const { data: config, isLoading: configLoading } = useGetUserConfigQuery(uid, { skip: !uid });
    const [createSession] = useCreateSessionMutation();
    const [updateFocusTime] = useUpdateTaskFocusTimeMutation();

    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle');
    const [breakSeconds, setBreakSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<Date | null>(null);

    const effectiveConfig = config ?? DEFAULT_CONFIG;

    useEffect(() => {
        if (isRunning && !isPaused && phase === 'focus') {
            intervalRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else if (isRunning && !isPaused && phase === 'break') {
            intervalRef.current = setInterval(() => {
                setBreakSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        intervalRef.current = null;
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, isPaused, phase]);

    // Vibrate when break countdown reaches 0
    useEffect(() => {
        if (phase === 'break' && breakSeconds === 0 && isRunning) {
            setIsRunning(false);
            Vibration.vibrate([0, 300, 150, 300]);
        }
    }, [breakSeconds, phase, isRunning]);

    const saveCurrentSession = async (focusSec: number, endTime: Date) => {
        if (focusSec < 60 || !uid || !startTimeRef.current) return;
        await createSession({
            userId: uid,
            startedAt: startTimeRef.current.toISOString(),
            endedAt: endTime.toISOString(),
            durationSeconds: focusSec,
            breakDurationSeconds: 0,
            taskId: selectedTask?.id ?? null,
            taskTitle: selectedTask?.title ?? null,
        });
        if (selectedTask) {
            await updateFocusTime({ taskId: selectedTask.id, additionalMinutes: Math.round(focusSec / 60) });
        }
    };

    const handleStart = () => {
        startTimeRef.current = new Date();
        setElapsedSeconds(0);
        setBreakSeconds(0);
        setIsRunning(true);
        setIsPaused(false);
        setPhase('focus');
    };

    const handlePause = () => setIsPaused(true);
    const handleResume = () => setIsPaused(false);

    const handleStopFocus = async () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const endTime = new Date();
        const focusSec = elapsedSeconds;
        const breakSec = getBreakMinutes(focusSec, effectiveConfig) * 60;

        // Save session immediately at break start (web approach)
        await saveCurrentSession(focusSec, endTime);

        setBreakSeconds(breakSec);
        setPhase('break');
        setIsRunning(true);
        setIsPaused(false);
    };

    const handleStopBreak = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setIsPaused(false);
        setPhase('idle');
        setElapsedSeconds(0);
        setBreakSeconds(0);
    };

    const handleNewSession = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleStart();
    };

    const handleReset = async () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (phase === 'focus' && elapsedSeconds >= 60) {
            await saveCurrentSession(elapsedSeconds, new Date());
        }
        setIsRunning(false);
        setIsPaused(false);
        setPhase('idle');
        setElapsedSeconds(0);
        setBreakSeconds(0);
        startTimeRef.current = null;
    };

    if (configLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#6366f1" />
            </View>
        );
    }

    const breakMinutes = getBreakMinutes(elapsedSeconds, effectiveConfig);
    const breakDisplay = Math.max(0, breakSeconds);

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
                            {breakSeconds === 0 ? t('timer.rechargingFocus') : t('timer.breakTime')}
                        </Text>
                        <Text style={[styles.timerDisplay, { color: '#22c55e' }]}>
                            {formatTime(breakDisplay)}
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
                        {isRunning && (
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
