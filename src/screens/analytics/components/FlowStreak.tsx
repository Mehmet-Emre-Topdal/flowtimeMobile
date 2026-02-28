import { View, Text, StyleSheet } from 'react-native';
import { FlowStreakResult } from '../../../types/analytics';
import { Section } from './Section';

interface Props {
    data: FlowStreakResult;
    t: any;
}

export function FlowStreak({ data, t }: Props) {
    return (
        <Section title={t('analytics.flowStreak.title')} noData={!data.hasEnoughData} t={t}>
            <View style={styles.streakNumbers}>
                <View style={styles.streakItem}>
                    <Text style={styles.bigStat}>{data.currentStreak}</Text>
                    <Text style={styles.dimText}>{t('analytics.flowStreak.current')}</Text>
                </View>
                <View style={styles.streakItem}>
                    <Text style={[styles.bigStat, { color: '#f59e0b' }]}>{data.recordStreak}</Text>
                    <Text style={styles.dimText}>{t('analytics.flowStreak.record')}</Text>
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

const styles = StyleSheet.create({
    streakNumbers: { flexDirection: 'row', gap: 32, marginBottom: 12 },
    streakItem: { alignItems: 'center' },
    bigStat: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    dimText: { color: '#555', fontSize: 12 },
    streakGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    streakDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#2a2a2a' },
    streakDotFilled: { backgroundColor: '#6366f1' },
});
