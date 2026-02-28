import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/storeHooks';
import { useGetUserConfigQuery } from '../features/timer/api/timerApi';
import { TaskDto } from '../types/task';
import { DEFAULT_CONFIG } from '../types/config';
import { useTimer } from '../hooks/useTimer';
import { formatTime } from './timer/timerHelpers';

interface Props {
    selectedTask: TaskDto | null;
}

export default function TimerScreen({ selectedTask }: Props) {
    const { t } = useTranslation();
    const { user } = useAppSelector(state => state.auth);
    const uid = user?.uid ?? '';

    const { data: config, isLoading: configLoading } = useGetUserConfigQuery(uid, { skip: !uid });
    const effectiveConfig = config ?? DEFAULT_CONFIG;

    const {
        phase, isPaused, elapsedSeconds, breakRemaining, breakMinutes,
        handleStart, handlePause, handleResume,
        handleStopFocus, handleStopBreak, handleNewSession, handleReset,
    } = useTimer(effectiveConfig, uid, selectedTask);

    if (configLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#6366f1" />
            </View>
        );
    }

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
