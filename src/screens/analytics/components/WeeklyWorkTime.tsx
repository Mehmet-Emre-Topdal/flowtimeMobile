import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WeeklyWorkTimeResult } from '../../../types/analytics';
import { Section } from './Section';
import { fmtMin } from '../helpers';

interface Props {
    data: WeeklyWorkTimeResult;
    weekOffset: number;
    onPrev: () => void;
    onNext: () => void;
    t: any;
}

export function WeeklyWorkTime({ data, weekOffset, onPrev, onNext, t }: Props) {
    const max = Math.max(...data.days.map(d => d.totalMinutes), 1);
    const dayLabels: Record<string, string> = {
        mon: t('analytics.weeklyWorkTime.days.mon'),
        tue: t('analytics.weeklyWorkTime.days.tue'),
        wed: t('analytics.weeklyWorkTime.days.wed'),
        thu: t('analytics.weeklyWorkTime.days.thu'),
        fri: t('analytics.weeklyWorkTime.days.fri'),
        sat: t('analytics.weeklyWorkTime.days.sat'),
        sun: t('analytics.weeklyWorkTime.days.sun'),
    };
    return (
        <Section title={t('analytics.weeklyWorkTime.title')} t={t}>
            <View style={styles.weekNav}>
                <TouchableOpacity onPress={onPrev} style={styles.navBtn}>
                    <Text style={styles.navBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.weekLabel}>{data.weekLabel}</Text>
                <TouchableOpacity onPress={onNext} style={styles.navBtn} disabled={weekOffset === 0}>
                    <Text style={[styles.navBtnText, weekOffset === 0 && styles.navBtnDisabled]}>›</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.weekTotal}>{t('analytics.weeklyWorkTime.weekTotal')}: {fmtMin(data.weekTotalMinutes, t)}</Text>
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
                            <Text style={styles.barMin}>{Math.round(d.totalMinutes)}{t('analytics.weeklyWorkTime.min')}</Text>
                        )}
                    </View>
                ))}
            </View>
        </Section>
    );
}

const styles = StyleSheet.create({
    weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    navBtn: { padding: 6 },
    navBtnText: { color: '#6366f1', fontSize: 22, fontWeight: 'bold' },
    navBtnDisabled: { color: '#333' },
    weekLabel: { color: '#aaa', fontSize: 13 },
    weekTotal: { color: '#666', fontSize: 12, marginBottom: 10 },
    barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    barCol: { flex: 1, alignItems: 'center' },
    barWrapper: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    bar: { width: '60%', backgroundColor: '#2a2a6a', borderRadius: 3 },
    barLabel: { color: '#555', fontSize: 10, marginTop: 4 },
    barMin: { color: '#444', fontSize: 9, marginTop: 1 },
});
