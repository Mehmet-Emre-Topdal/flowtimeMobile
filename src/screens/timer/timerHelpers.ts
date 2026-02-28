import { UserConfig } from '../../types/config';

export function getBreakMinutes(focusSeconds: number, config: UserConfig): number {
    const focusMinutes = focusSeconds / 60;
    const interval = config.intervals.find(
        i => focusMinutes >= i.min && focusMinutes < i.max
    ) ?? config.intervals[config.intervals.length - 1];
    return interval.break;
}

export function formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
