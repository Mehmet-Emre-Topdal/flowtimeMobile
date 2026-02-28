import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NaturalFlowWindowResult } from '../../../types/analytics';
import { Section } from './Section';

interface Props {
    data: NaturalFlowWindowResult;
    t: any;
}

export function NaturalFlowWindow({ data, t }: Props) {
    const maxCount = Math.max(...data.buckets.map(b => b.count), 1);
    return (
        <Section title={t('analytics.flowWindow.title')} noData={!data.hasEnoughData} t={t}>
            <Text style={styles.infoLine}>
                {t('analytics.flowWindow.windowText', { start: data.dominantWindowStart, end: data.dominantWindowEnd })}
            </Text>
            <Text style={styles.dimText}>{t('analytics.flowWindow.medianText', { median: data.median })}</Text>
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

const styles = StyleSheet.create({
    infoLine: { color: '#ccc', fontSize: 13, marginBottom: 6 },
    dimText: { color: '#555', fontSize: 12 },
    barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    barCol: { flex: 1, alignItems: 'center' },
    barWrapper: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    bar: { width: '60%', backgroundColor: '#2a2a6a', borderRadius: 3 },
    barToday: { backgroundColor: '#6366f1' },
    barLabel: { color: '#555', fontSize: 10, marginTop: 4 },
});
