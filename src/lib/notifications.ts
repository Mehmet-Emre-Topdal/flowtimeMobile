import { Platform } from 'react-native';

// Gracefully handle expo-notifications being unavailable
let Notifications: any;
try {
    Notifications = require('expo-notifications');
} catch {
    // Provide mock implementation if expo-notifications is not available
    Notifications = {
        getPermissionsAsync: async () => ({ status: 'granted' }),
        requestPermissionsAsync: async () => ({ status: 'granted' }),
        dismissNotificationAsync: async () => { },
        scheduleNotificationAsync: async () => { },
        cancelScheduledNotificationAsync: async () => { },
        getLastNotificationResponseAsync: async () => null,
        setNotificationCategoryAsync: async () => { },
        DEFAULT_ACTION_IDENTIFIER: 'DEFAULT_ACTION_IDENTIFIER',
        SchedulableTriggerInputTypes: { TIME_INTERVAL: 'time-interval' },
    };
}

const TIMER_NOTIFICATION_ID = 'flowtime_timer';

export type NotificationAction =
    | 'pause'
    | 'resume'
    | 'stop_focus'
    | 'end_break'
    | 'close_app';

// Bildirim kategorilerini (aksiyon butonları) OS'a kaydet
async function registerNotificationCategories(): Promise<void> {
    try {
        // Odaklanma — aktif
        await Notifications.setNotificationCategoryAsync('timer_focus', [
            {
                identifier: 'pause',
                buttonTitle: '⏸ Duraklat',
                options: { isDestructive: false, isAuthenticationRequired: false },
            },
            {
                identifier: 'stop_focus',
                buttonTitle: '☕ Molaya Geç',
                options: { isDestructive: false, isAuthenticationRequired: false },
            },
            {
                identifier: 'close_app',
                buttonTitle: '✕ Kapat',
                options: { isDestructive: true, isAuthenticationRequired: false },
            },
        ]);

        // Odaklanma — duraklatılmış
        await Notifications.setNotificationCategoryAsync('timer_focus_paused', [
            {
                identifier: 'resume',
                buttonTitle: '▶ Devam Et',
                options: { isDestructive: false, isAuthenticationRequired: false },
            },
            {
                identifier: 'stop_focus',
                buttonTitle: '☕ Molaya Geç',
                options: { isDestructive: false, isAuthenticationRequired: false },
            },
            {
                identifier: 'close_app',
                buttonTitle: '✕ Kapat',
                options: { isDestructive: true, isAuthenticationRequired: false },
            },
        ]);

        // Mola — aktif
        await Notifications.setNotificationCategoryAsync('timer_break', [
            {
                identifier: 'pause',
                buttonTitle: '⏸ Duraklat',
                options: { isDestructive: false, isAuthenticationRequired: false },
            },
            {
                identifier: 'end_break',
                buttonTitle: '✓ Molayı Bitir',
                options: { isDestructive: false, isAuthenticationRequired: false },
            },
            {
                identifier: 'close_app',
                buttonTitle: '✕ Kapat',
                options: { isDestructive: true, isAuthenticationRequired: false },
            },
        ]);

        // Mola — duraklatılmış
        await Notifications.setNotificationCategoryAsync('timer_break_paused', [
            {
                identifier: 'resume',
                buttonTitle: '▶ Devam Et',
                options: { isDestructive: false, isAuthenticationRequired: false },
            },
            {
                identifier: 'end_break',
                buttonTitle: '✓ Molayı Bitir',
                options: { isDestructive: false, isAuthenticationRequired: false },
            },
            {
                identifier: 'close_app',
                buttonTitle: '✕ Kapat',
                options: { isDestructive: true, isAuthenticationRequired: false },
            },
        ]);
    } catch {
        // Kategori kaydı başarısız olursa bildirimler butonlar olmadan çalışmaya devam eder
    }
}

// İzin iste ve kategorileri kaydet
export async function setupNotifications(): Promise<boolean> {
    try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus === 'granted') {
            await registerNotificationCategories();
        }

        return finalStatus === 'granted';
    } catch {
        return true; // plugin olmadan da çalışsın
    }
}

function formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getCategoryIdentifier(phase: 'focus' | 'break', isPaused: boolean): string {
    if (phase === 'focus') return isPaused ? 'timer_focus_paused' : 'timer_focus';
    return isPaused ? 'timer_break_paused' : 'timer_break';
}

// Mevcut timer bildirimini güncelle / oluştur
export async function updateTimerNotification(
    phase: 'focus' | 'break',
    seconds: number,
    isPaused: boolean,
): Promise<void> {
    try {
        await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);
    } catch {
        // ignore
    }

    let title: string;
    let body: string;

    if (phase === 'focus') {
        title = isPaused ? '⏸ Odaklanma Duraklatıldı' : '🎯 Odaklanma Oturumu';
        body = `⏱ ${formatTime(seconds)} geçti`;
    } else {
        title = isPaused ? '⏸ Mola Duraklatıldı' : '☕ Mola Zamanı';
        body = `⏳ ${formatTime(seconds)} kaldı`;
    }

    const categoryIdentifier = getCategoryIdentifier(phase, isPaused);

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: TIMER_NOTIFICATION_ID,
            content: {
                title,
                body,
                sticky: true,
                autoDismiss: false,
                categoryIdentifier,
                ...(Platform.OS === 'android' && {
                    priority: 'high',
                    ongoing: true,
                }),
            },
            trigger: null, // hemen göster
        });
    } catch {
        console.log(`Timer: ${title} - ${body}`);
    }
}

// Break bitişi için zamanlanmış bildirim
export async function scheduleBreakEndNotification(breakSeconds: number): Promise<void> {
    try {
        await Notifications.cancelScheduledNotificationAsync('flowtime_break_end');
    } catch {
        // ignore
    }

    if (breakSeconds <= 0) return;

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: 'flowtime_break_end',
            content: {
                title: '🎯 Mola Bitti!',
                body: 'Tekrar odaklanmaya hazır mısın?',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: breakSeconds,
                repeats: false
            },
        });
    } catch {
        console.log(`Break end notification scheduled for ${breakSeconds}s`);
    }
}

// Tüm timer bildirimlerini temizle
export async function cancelTimerNotifications(): Promise<void> {
    try {
        await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);
    } catch {
        // ignore
    }
    try {
        await Notifications.cancelScheduledNotificationAsync('flowtime_break_end');
    } catch {
        // ignore
    }
}

// Soğuk başlangıçta son bildirim aksiyonunu kontrol et
export async function getLastNotificationAction(): Promise<NotificationAction | null> {
    try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (!response) return null;
        const actionId = response.actionIdentifier;
        if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
        return actionId as NotificationAction;
    } catch {
        return null;
    }
}

// Bildirim response listener — expo-notifications'ı direkt import etmeden kullan
export function addNotificationResponseListener(
    callback: (action: NotificationAction) => void,
): { remove: () => void } {
    try {
        const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
            const action = response.actionIdentifier as NotificationAction;
            if (action && action !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
                callback(action);
            }
        });
        return sub;
    } catch {
        return { remove: () => {} };
    }
}

// Bildirim aksiyonlarını uygula
export function handleNotificationAction(
    action: NotificationAction,
    handlers: {
        pause: () => void;
        resume: () => void;
        stopFocus: () => void;
        endBreak: () => void;
        closeApp: () => void;
    },
) {
    switch (action) {
        case 'pause': handlers.pause(); break;
        case 'resume': handlers.resume(); break;
        case 'stop_focus': handlers.stopFocus(); break;
        case 'end_break': handlers.endBreak(); break;
        case 'close_app': handlers.closeApp(); break;
    }
}
