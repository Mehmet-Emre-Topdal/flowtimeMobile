import { useState, useCallback, useRef, useEffect } from 'react';
import { Vibration } from 'react-native';
import { UserConfig } from '../types/config';
import { TaskDto } from '../types/task';
import { saveTimerState, clearTimerState } from '../lib/timerStorage';
import { getBreakMinutes } from '../screens/timer/timerHelpers';
import { useSessionSaver } from './useSessionSaver';
import { useTimerPersistence } from './useTimerPersistence';

type Phase = 'idle' | 'focus' | 'break';

export function useTimer(effectiveConfig: UserConfig, uid: string, selectedTask: TaskDto | null) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [isPaused, setIsPaused] = useState(false);
    // Saniyede bir interval tarafından güncellenir — sadece timer display'ini yeniden render eder
    const [displaySeconds, setDisplaySeconds] = useState(0);

    const phaseStartTimeRef = useRef<number>(0);
    const pausedAtRef = useRef<number | null>(null);
    const pausedDurationRef = useRef<number>(0);
    const breakDurationRef = useRef<number>(0);
    const focusStartTimeRef = useRef<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const phaseRef = useRef<Phase>('idle');
    const isPausedRef = useRef(false);

    // Keep refs in sync with state for use inside intervals/callbacks
    phaseRef.current = phase;
    isPausedRef.current = isPaused;

    const { saveCurrentSession } = useSessionSaver(uid, selectedTask);

    const getElapsedSeconds = useCallback((): number => {
        if (phaseRef.current === 'idle') return 0;
        const pauseOffset = pausedAtRef.current
            ? Date.now() - pausedAtRef.current + pausedDurationRef.current
            : pausedDurationRef.current;
        return Math.max(0, (Date.now() - phaseStartTimeRef.current - pauseOffset) / 1000);
    }, []);

    const startTick = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (phaseRef.current === 'idle' || isPausedRef.current) return;
            const elapsed = getElapsedSeconds();
            setDisplaySeconds(elapsed);
            if (phaseRef.current === 'break' && breakDurationRef.current - elapsed <= 0) {
                clearInterval(intervalRef.current!);
                intervalRef.current = null;
                Vibration.vibrate([0, 300, 150, 300]);
            }
        }, 1000);
    }, [getElapsedSeconds]);

    const stopTick = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const persistState = useCallback((currentPhase: Phase, currentIsPaused: boolean) => {
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

    useTimerPersistence({
        persistState,
        startTick,
        phaseRef,
        isPausedRef,
        phaseStartTimeRef,
        breakDurationRef,
        focusStartTimeRef,
        pausedAtRef,
        setPhase,
        setIsPaused,
    });

    useEffect(() => () => stopTick(), [stopTick]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleStart = useCallback(() => {
        const now = Date.now();
        phaseStartTimeRef.current = now;
        focusStartTimeRef.current = now;
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;
        breakDurationRef.current = 0;
        setPhase('focus');
        setIsPaused(false);
        setDisplaySeconds(0);
        startTick();
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
        persistState(phaseRef.current, true);
    }, [stopTick, persistState]);

    const handleResume = useCallback(() => {
        if (pausedAtRef.current) {
            pausedDurationRef.current += Date.now() - pausedAtRef.current;
            pausedAtRef.current = null;
        }
        setIsPaused(false);
        startTick();
        persistState(phaseRef.current, false);
    }, [startTick, persistState]);

    const handleStopFocus = useCallback(async () => {
        stopTick();
        const focusSec = getElapsedSeconds();
        await saveCurrentSession(focusSec, focusStartTimeRef.current);

        const breakSec = getBreakMinutes(focusSec, effectiveConfig) * 60;
        breakDurationRef.current = breakSec;
        phaseStartTimeRef.current = Date.now();
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;
        setPhase('break');
        setIsPaused(false);
        setDisplaySeconds(0);
        startTick();
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
        setDisplaySeconds(0);
        phaseStartTimeRef.current = 0;
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;
        breakDurationRef.current = 0;
        clearTimerState();
    }, [stopTick]);

    const handleNewSession = useCallback(() => {
        stopTick();
        handleStart();
    }, [stopTick, handleStart]);

    const handleReset = useCallback(async () => {
        stopTick();
        if (phaseRef.current === 'focus') {
            const focusSec = getElapsedSeconds();
            if (focusSec >= 60) await saveCurrentSession(focusSec, focusStartTimeRef.current);
        }
        setPhase('idle');
        setIsPaused(false);
        setDisplaySeconds(0);
        phaseStartTimeRef.current = 0;
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;
        breakDurationRef.current = 0;
        clearTimerState();
    }, [stopTick, getElapsedSeconds, saveCurrentSession]);

    // ── Computed display values ───────────────────────────────────────────────

    const elapsedSeconds = phase === 'focus' ? displaySeconds : 0;
    const breakRemaining = phase === 'break' ? Math.max(0, breakDurationRef.current - displaySeconds) : 0;
    const breakMinutes = getBreakMinutes(elapsedSeconds, effectiveConfig);

    return {
        phase,
        isPaused,
        elapsedSeconds,
        breakRemaining,
        breakMinutes,
        handleStart,
        handlePause,
        handleResume,
        handleStopFocus,
        handleStopBreak,
        handleNewSession,
        handleReset,
    };
}
