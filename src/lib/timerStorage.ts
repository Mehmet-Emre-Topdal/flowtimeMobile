import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'flowtime_timer_state';

export interface PersistedTimerState {
    phase: 'idle' | 'focus' | 'break';
    phaseStartTime: number;   // Date.now() — mevcut faz ne zaman başladı
    breakDuration: number;    // saniye, sadece break fazında anlamlı
    isPaused: boolean;
    pausedAt: number | null;  // pause anında Date.now(), duraklatılmamışsa null
    focusStartTime: number;   // Date.now() — focus fazı ne zaman başladı (session kayıt için)
}

export async function saveTimerState(state: PersistedTimerState): Promise<void> {
    try {
        await AsyncStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
        console.warn('[timerStorage] saveTimerState failed:', err);
    }
}

export async function loadTimerState(): Promise<PersistedTimerState | null> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return null;
        return JSON.parse(raw) as PersistedTimerState;
    } catch (err) {
        console.warn('[timerStorage] loadTimerState failed:', err);
        return null;
    }
}

export async function clearTimerState(): Promise<void> {
    try {
        await AsyncStorage.removeItem(KEY);
    } catch (err) {
        console.warn('[timerStorage] clearTimerState failed:', err);
    }
}
