import * as Notifications from 'expo-notifications';
import { Platform, BackHandler } from 'react-native';

const TIMER_NOTIFICATION_ID = 'flowtime_timer';

export type NotificationAction =
    | 'pause'
    | 'resume'
    | 'stop_focus'
    | 'end_break'
    | 'close_app';

// İzin iste (plugin olmadan, sadece local API kullan)
export async function setupNotifications(): Promise<boolean> {
    try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
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

// Mevcut timer bildirimini güncelle / oluştur (local API, plugin gerektirmez)
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
        title = isPaused ? 'Focus Paused' : 'Focus Session';
        body = `⏱ ${formatTime(seconds)} elapsed`;
    } else {
        title = isPaused ? 'Break Paused' : 'Break Time ☕';
        body = `⏳ ${formatTime(seconds)} remaining`;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: TIMER_NOTIFICATION_ID,
            content: {
                title,
                body,
                sticky: true,
                autoDismiss: false,
            },
            trigger: null, // hemen göster
        });
    } catch {
        // notification görüntülemeyerse, en azından log'a yaz
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
                title: 'Break Over! 🎯',
                body: 'Ready to focus again?',
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
