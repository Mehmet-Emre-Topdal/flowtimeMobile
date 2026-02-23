import { useState } from 'react';
import {
    View, Text, ScrollView, ActivityIndicator, StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useAppSelector } from '../hooks/storeHooks';
import { useGetAnalyticsQuery } from '../features/analytics/api/analyticsApi';
import {
    DailyFlowWavesResult,
    WeeklyWorkTimeResult,
    FocusDensityResult,
    ResistancePointResult,
    NaturalFlowWindowResult,
    FlowStreakResult,
    TaskFlowHarmonyResult,
    WarmupPhaseResult,
} from '../types/analytics';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMin(min: number): string {
    if (min < 60) return `${Math.round(min)} dk`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h}s ${m}dk` : `${h}s`;
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children, noData }: { title: string; children: React.ReactNode; noData?: boolean }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionBody}>
                {noData
                    ? <Text style={styles.noData}>Yeterli veri yok</Text>
                    : children}
            </View>
        </View>
    );
}

// ── 1. Daily Flow Waves ───────────────────────────────────────────────────────

function DailyFlowWaves({ data }: { data: DailyFlowWavesResult }) {
    const active = data.slots.filter(s => s.totalMinutes > 0);
    const max = Math.max(...active.map(s => s.totalMinutes), 1);
    return (
        <Section title="Günlük Akış Dalgaları" noData={!data.hasEnoughData}>
            {data.peakHour !== null && (
                <Text style={styles.infoLine}>
                    Zirve: <Text style={styles.accent}>{data.peakHour}:00</Text>
                    {data.troughHour !== null && (
                        <>  {'  '}Dip: <Text style={styles.dimText}>{data.troughHour}:00</Text></>
                    )}
                </Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.waveChart}>
                    {data.slots.filter(s => s.totalMinutes > 0 || s.label === 'peak').map(slot => (
                        <View key={slot.hour} style={styles.waveCol}>
                            <View style={styles.waveBarWrapper}>
                                <View
                                    style={[
                                        styles.waveBar,
                                        { height: Math.max((slot.totalMinutes / max) * 60, slot.totalMinutes > 0 ? 3 : 0) },
                                        slot.label === 'peak' && styles.waveBarPeak,
                                        slot.label === 'trough' && styles.waveBarTrough,
                                    ]}
                                />
                            </View>
                            <Text style={styles.waveLabel}>{slot.hour}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </Section>
    );
}

// ── 2. Weekly Work Time ───────────────────────────────────────────────────────

function WeeklyWorkTime({ data, weekOffset, onPrev, onNext }: {
    data: WeeklyWorkTimeResult;
    weekOffset: number;
    onPrev: () => void;
    onNext: () => void;
}) {
    const max = Math.max(...data.days.map(d => d.totalMinutes), 1);
    const dayLabels: Record<string, string> = {
        mon: 'Pzt', tue: 'Sal', wed: 'Çar', thu: 'Per', fri: 'Cum', sat: 'Cmt', sun: 'Paz',
    };
    return (
        <Section title="Haftalık Çalışma Süresi">
            <View style={styles.weekNav}>
                <TouchableOpacity onPress={onPrev} style={styles.navBtn}>
                    <Text style={styles.navBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.weekLabel}>{data.weekLabel}</Text>
                <TouchableOpacity onPress={onNext} style={styles.navBtn} disabled={weekOffset === 0}>
                    <Text style={[styles.navBtnText, weekOffset === 0 && styles.navBtnDisabled]}>›</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.weekTotal}>Toplam: {fmtMin(data.weekTotalMinutes)}</Text>
            <View style={styles.barChart}>
                {data.days.map((d, i) => (
                    <View key={i} style={styles.barCol}>
                        <View style={styles.barWrapper}>
                            <View
                                style={[
                                    styles.bar,
                                    { height: Math.max((d.totalMinutes / max) * 80, d.totalMinutes > 0 ? 4 : 0) },
                                ]}
                            />
                        </View>
                        <Text style={styles.barLabel}>{dayLabels[d.dayLabel] ?? d.dayLabel}</Text>
                        {d.totalMinutes > 0 && (
                            <Text style={styles.barMin}>{Math.round(d.totalMinutes)}dk</Text>
                        )}
                    </View>
                ))}
            </View>
        </Section>
    );
}

// ── 3. Focus Density ──────────────────────────────────────────────────────────

const densityLabels: Record<string, string> = {
    sharp: 'Keskin Odak',
    good: 'İyi Odak',
    scattered_start: 'Dağınık Başlangıç',
    scattered_mind: 'Dağınık Zihin',
};

function FocusDensity({ data }: { data: FocusDensityResult }) {
    const color = data.percentage >= 80 ? '#6366f1' : data.percentage >= 60 ? '#22c55e' : '#f59e0b';
    return (
        <Section title="Odak Yoğunluğu (Bugün)" noData={!data.hasEnoughData}>
            <View style={styles.densityRow}>
                <View style={styles.densityCircle}>
                    <Text style={[styles.densityPct, { color }]}>{data.percentage}%</Text>
                </View>
                <Text style={[styles.densityLabel, { color }]}>
                    {densityLabels[data.label]}
                </Text>
            </View>
            <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${data.percentage}%`, backgroundColor: color }]} />
            </View>
        </Section>
    );
}

// ── 4. Resistance Point ───────────────────────────────────────────────────────

function ResistancePoint({ data }: { data: ResistancePointResult }) {
    return (
        <Section title="Direnç Noktası" noData={!data.hasEnoughData}>
            <Text style={styles.bigStat}>{data.resistanceMinute} dk</Text>
            <Text style={styles.dimText}>Çoğunlukla bu noktada duruyorsun</Text>
            {data.last7DaysSessions.length > 0 && (
                <View style={styles.dotRow}>
                    {data.last7DaysSessions.slice(0, 10).map((s, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                s.durationMinutes > data.resistanceMinute && styles.dotOver,
                            ]}
                        />
                    ))}
                </View>
            )}
        </Section>
    );
}

// ── 6. Natural Flow Window ────────────────────────────────────────────────────

function NaturalFlowWindow({ data }: { data: NaturalFlowWindowResult }) {
    const maxCount = Math.max(...data.buckets.map(b => b.count), 1);
    return (
        <Section title="Doğal Akış Penceresi" noData={!data.hasEnoughData}>
            <Text style={styles.infoLine}>
                Çoğunlukla <Text style={styles.accent}>{data.dominantWindowStart}–{data.dominantWindowEnd} dk</Text> arası odaklanıyorsun
            </Text>
            <Text style={styles.dimText}>Medyan: {data.median} dk</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                <View style={styles.barChart}>
                    {data.buckets.map((b, i) => (
                        <View key={i} style={[styles.barCol, { minWidth: 32 }]}>
                            <View style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        { height: Math.max((b.count / maxCount) * 80, b.count > 0 ? 4 : 0) },
                                        b.isDominant && styles.barToday,
                                    ]}
                                />
                            </View>
                            <Text style={styles.barLabel}>{b.rangeStart}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </Section>
    );
}

// ── 7. Flow Streak ────────────────────────────────────────────────────────────

function FlowStreak({ data }: { data: FlowStreakResult }) {
    return (
        <Section title="Akış Serisi" noData={!data.hasEnoughData}>
            <View style={styles.streakNumbers}>
                <View style={styles.streakItem}>
                    <Text style={styles.bigStat}>{data.currentStreak}</Text>
                    <Text style={styles.dimText}>Günlük seri</Text>
                </View>
                <View style={styles.streakItem}>
                    <Text style={[styles.bigStat, { color: '#f59e0b' }]}>{data.recordStreak}</Text>
                    <Text style={styles.dimText}>Rekor</Text>
                </View>
            </View>
            <View style={styles.streakGrid}>
                {data.last30Days.map((d, i) => (
                    <View
                        key={i}
                        style={[styles.streakDot, d.filled && styles.streakDotFilled]}
                    />
                ))}
            </View>
        </Section>
    );
}

// ── 8. Task-Flow Harmony ──────────────────────────────────────────────────────

function TaskFlowHarmony({ data }: { data: TaskFlowHarmonyResult }) {
    const maxMin = data.items[0]?.totalFocusMinutes ?? 1;
    return (
        <Section title="Görev-Akış Uyumu" noData={!data.hasEnoughData}>
            {data.items.map((item, i) => {
                const pct = maxMin > 0 ? item.totalFocusMinutes / maxMin : 0;
                return (
                    <View key={i} style={styles.taskRow}>
                        <View style={styles.taskBarBg}>
                            <View style={[styles.taskBarFill, { width: `${pct * 100}%` }]} />
                        </View>
                        <View style={styles.taskRowLabels}>
                            <Text style={styles.taskRowTitle} numberOfLines={1}>{item.taskTitle}</Text>
                            <Text style={styles.taskRowMin}>
                                {fmtMin(item.totalFocusMinutes)} · {item.sessionCount} oturum
                            </Text>
                        </View>
                    </View>
                );
            })}
        </Section>
    );
}

// ── 9. Warmup Phase ───────────────────────────────────────────────────────────

function WarmupPhase({ data }: { data: WarmupPhaseResult }) {
    return (
        <Section title="Isınma Fazı" noData={!data.hasEnoughData}>
            <Text style={styles.bigStat}>{data.avgWarmupMinutes} dk</Text>
            <Text style={styles.dimText}>Ortalama ısınma süresi</Text>
            {data.prevMonthWarmup !== null && data.changeMinutes !== null && (
                <Text style={[styles.infoLine, { marginTop: 6 }]}>
                    Geçen ay: {data.prevMonthWarmup} dk
                    {'  '}
                    <Text style={{ color: data.changeMinutes <= 0 ? '#22c55e' : '#f59e0b' }}>
                        {data.changeMinutes > 0 ? '+' : ''}{data.changeMinutes} dk
                    </Text>
                </Text>
            )}
        </Section>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
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
                <Text style={styles.noData}>Veri yüklenemedi</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <View style={styles.headingRow}>
                <Text style={styles.heading}>İstatistikler</Text>
                {isFetching && <ActivityIndicator color="#6366f1" size="small" />}
            </View>

            {/* Summary */}
            <View style={styles.cardRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{fmtMin(data.summary.allTimeMinutes)}</Text>
                    <Text style={styles.statLabel}>Toplam Odak</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{data.summary.totalSessions}</Text>
                    <Text style={styles.statLabel}>Oturum</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{data.flowStreak.currentStreak}</Text>
                    <Text style={styles.statLabel}>Seri 🔥</Text>
                </View>
            </View>

            <WeeklyWorkTime
                data={data.weeklyWorkTime}
                weekOffset={weekOffset}
                onPrev={() => setWeekOffset(w => w - 1)}
                onNext={() => setWeekOffset(w => Math.min(w + 1, 0))}
            />

            <FocusDensity data={data.focusDensity} />
            <FlowStreak data={data.flowStreak} />
            <DailyFlowWaves data={data.dailyFlowWaves} />
            <ResistancePoint data={data.resistancePoint} />
            <NaturalFlowWindow data={data.naturalFlowWindow} />
            <TaskFlowHarmony data={data.taskFlowHarmony} />
            <WarmupPhase data={data.warmupPhase} />

        </ScrollView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f0f' },
    scroll: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
    headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    heading: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    cardRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    statCard: {
        flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10,
        padding: 12, borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 8,
        alignItems: 'center',
    },
    statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    statLabel: { color: '#555', fontSize: 11, marginTop: 4, textAlign: 'center' },

    section: { marginTop: 8 },
    sectionTitle: {
        color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 8,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    sectionBody: {
        backgroundColor: '#1a1a1a', borderRadius: 10,
        padding: 14, borderWidth: 1, borderColor: '#2a2a2a',
    },
    noData: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
    infoLine: { color: '#ccc', fontSize: 13, marginBottom: 6 },
    accent: { color: '#6366f1', fontWeight: '600' },
    dimText: { color: '#555', fontSize: 12 },
    bigStat: { color: '#fff', fontSize: 28, fontWeight: 'bold' },

    // Weekly nav
    weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    navBtn: { padding: 6 },
    navBtnText: { color: '#6366f1', fontSize: 22, fontWeight: 'bold' },
    navBtnDisabled: { color: '#333' },
    weekLabel: { color: '#aaa', fontSize: 13 },
    weekTotal: { color: '#666', fontSize: 12, marginBottom: 10 },

    // Bar chart
    barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    barCol: { flex: 1, alignItems: 'center' },
    barWrapper: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    bar: { width: '60%', backgroundColor: '#2a2a6a', borderRadius: 3 },
    barToday: { backgroundColor: '#6366f1' },
    barLabel: { color: '#555', fontSize: 10, marginTop: 4 },
    barMin: { color: '#444', fontSize: 9, marginTop: 1 },

    // Wave chart
    waveChart: { flexDirection: 'row', alignItems: 'flex-end', paddingVertical: 4 },
    waveCol: { alignItems: 'center', marginHorizontal: 2, width: 28 },
    waveBarWrapper: { height: 60, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
    waveBar: { width: 18, backgroundColor: '#2a2a6a', borderRadius: 3 },
    waveBarPeak: { backgroundColor: '#6366f1' },
    waveBarTrough: { backgroundColor: '#3a3a3a' },
    waveLabel: { color: '#444', fontSize: 9, marginTop: 3 },

    // Focus density
    densityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 16 },
    densityCircle: {
        width: 64, height: 64, borderRadius: 32,
        borderWidth: 2, borderColor: '#2a2a2a',
        justifyContent: 'center', alignItems: 'center',
    },
    densityPct: { fontSize: 16, fontWeight: 'bold' },
    densityLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
    progressBg: { height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },

    // Resistance point
    dotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2a2a2a' },
    dotOver: { backgroundColor: '#6366f1' },

    // Earned freedom
    freedomRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    freedomItem: { alignItems: 'center' },
    freedomValue: { color: '#6366f1', fontSize: 18, fontWeight: 'bold' },

    // Flow streak
    streakNumbers: { flexDirection: 'row', gap: 32, marginBottom: 12 },
    streakItem: { alignItems: 'center' },
    streakGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    streakDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#2a2a2a' },
    streakDotFilled: { backgroundColor: '#6366f1' },

    // Task flow harmony
    taskRow: { marginBottom: 10 },
    taskBarBg: { height: 5, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
    taskBarFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
    taskRowLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    taskRowTitle: { color: '#ccc', fontSize: 13, flex: 1 },
    taskRowMin: { color: '#6366f1', fontSize: 11, fontWeight: '600' },
});
