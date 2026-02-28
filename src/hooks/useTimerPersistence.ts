import { useEffect, MutableRefObject } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { loadTimerState } from '../lib/timerStorage';

type Phase = 'idle' | 'focus' | 'break';

interface Params {
    persistState: (phase: Phase, isPaused: boolean) => void;
    startTick: () => void;
    phaseRef: MutableRefObject<Phase>;
    isPausedRef: MutableRefObject<boolean>;
    phaseStartTimeRef: MutableRefObject<number>;
    breakDurationRef: MutableRefObject<number>;
    focusStartTimeRef: MutableRefObject<number>;
    pausedAtRef: MutableRefObject<number | null>;
    setPhase: (phase: Phase) => void;
    setIsPaused: (v: boolean) => void;
}

export function useTimerPersistence({
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
}: Params) {
    useEffect(() => {
        const onAppStateChange = async (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                const saved = await loadTimerState();
                if (!saved || saved.phase === 'idle') return;

                phaseStartTimeRef.current = saved.phaseStartTime;
                breakDurationRef.current = saved.breakDuration;
                focusStartTimeRef.current = saved.focusStartTime;
                pausedAtRef.current = saved.pausedAt;

                setPhase(saved.phase);
                setIsPaused(saved.isPaused);

                if (!saved.isPaused) startTick();
            } else if (nextState === 'background' || nextState === 'inactive') {
                persistState(phaseRef.current, isPausedRef.current);
            }
        };

        const sub = AppState.addEventListener('change', onAppStateChange);
        return () => sub.remove();
    }, [persistState, startTick]);
}
