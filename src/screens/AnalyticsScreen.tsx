import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/storeHooks';
import { useGetAnalyticsQuery } from '../features/analytics/api/analyticsApi';
import { fmtMin } from './analytics/helpers';
import { styles } from './analytics/analyticsStyles';
import { DailyFlowWaves } from './analytics/components/DailyFlowWaves';
import { WeeklyWorkTime } from './analytics/components/WeeklyWorkTime';
import { FocusDensity } from './analytics/components/FocusDensity';
import { ResistancePoint } from './analytics/components/ResistancePoint';
import { NaturalFlowWindow } from './analytics/components/NaturalFlowWindow';
import { FlowStreak } from './analytics/components/FlowStreak';
import { TaskFlowHarmony } from './analytics/components/TaskFlowHarmony';
import { WarmupPhase } from './analytics/components/WarmupPhase';

export default function AnalyticsScreen() {
    const { t } = useTranslation();
    const { user } = useAppSelector(state => state.auth);
    const uid = user?.uid ?? '';

    const [weekOffset, setWeekOffset] = useState(0);

    const { data, isLoading, isFetching } = useGetAnalyticsQuery(
        { weekOffset },
        { skip: !uid },
    );

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#6366f1" />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.center}>
                <Text style={styles.noData}>{t('analytics.loadingSessions')}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <View style={styles.headingRow}>
                <Text style={styles.heading}>{t('analytics.title')}</Text>
                {isFetching && <ActivityIndicator color="#6366f1" size="small" />}
            </View>

            <View style={styles.cardRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{fmtMin(data.summary.allTimeMinutes, t)}</Text>
                    <Text style={styles.statLabel}>{t('analytics.weeklyWorkTime.workTime')}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{data.summary.totalSessions}</Text>
                    <Text style={styles.statLabel}>{t('analytics.taskHarmony.sessions')}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{data.flowStreak.currentStreak}</Text>
                    <Text style={styles.statLabel}>{t('analytics.flowStreak.title')} 🔥</Text>
                </View>
            </View>

            <WeeklyWorkTime
                data={data.weeklyWorkTime}
                weekOffset={weekOffset}
                onPrev={() => setWeekOffset(w => w - 1)}
                onNext={() => setWeekOffset(w => Math.min(w + 1, 0))}
                t={t}
            />
            <FocusDensity data={data.focusDensity} t={t} />
            <FlowStreak data={data.flowStreak} t={t} />
            <DailyFlowWaves data={data.dailyFlowWaves} t={t} />
            <ResistancePoint data={data.resistancePoint} t={t} />
            <NaturalFlowWindow data={data.naturalFlowWindow} t={t} />
            <TaskFlowHarmony data={data.taskFlowHarmony} t={t} />
            <WarmupPhase data={data.warmupPhase} t={t} />
        </ScrollView>
    );
}
