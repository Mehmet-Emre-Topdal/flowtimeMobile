export function fmtMin(min: number, t: any): string {
    if (min < 60) return `${Math.round(min)} ${t('tasks.focused')}`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0
        ? `${h}${t('analytics.weeklyWorkTime.h')} ${m}${t('tasks.focused')}`
        : `${h}${t('analytics.weeklyWorkTime.h')}`;
}
