import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { DailyFlowWavesResult } from '../../../types/analytics';
import { Section } from './Section';

interface Props {
    data: DailyFlowWavesResult;
    t: any;
}

export function DailyFlowWaves({ data, t }: Props) {
    const active = data.slots.filter(s => s.totalMinutes > 0);
    const max = Math.max(...active.map(s => s.totalMinutes), 1);
    return (
        <Section title={t('analytics.flowWaves.title')} noData={!data.hasEnoughData} t={t}>
            {data.peakHour !== null && (
                <Text style={styles.infoLine}>
                    {t('analytics.flowWaves.peak')}: <Text style={styles.accent}>{data.peakHour}:00</Text>
                    {data.troughHour !== null && (
                        <>  {'  '}{t('analytics.flowWaves.trough')}: <Text style={styles.dimText}>{data.troughHour}:00</Text></>
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

const styles = StyleSheet.create({
    infoLine: { color: '#ccc', fontSize: 13, marginBottom: 6 },
    accent: { color: '#6366f1', fontWeight: '600' },
    dimText: { color: '#555', fontSize: 12 },
    waveChart: { flexDirection: 'row', alignItems: 'flex-end', paddingVertical: 4 },
    waveCol: { alignItems: 'center', marginHorizontal: 2, width: 28 },
    waveBarWrapper: { height: 60, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
    waveBar: { width: 18, backgroundColor: '#2a2a6a', borderRadius: 3 },
    waveBarPeak: { backgroundColor: '#6366f1' },
    waveBarTrough: { backgroundColor: '#3a3a3a' },
    waveLabel: { color: '#444', fontSize: 9, marginTop: 3 },
});
