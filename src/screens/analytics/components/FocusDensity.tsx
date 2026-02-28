import { View, Text, StyleSheet } from 'react-native';
import { FocusDensityResult } from '../../../types/analytics';
import { Section } from './Section';

interface Props {
    data: FocusDensityResult;
    t: any;
}

export function FocusDensity({ data, t }: Props) {
    const color = data.percentage >= 80 ? '#6366f1' : data.percentage >= 60 ? '#22c55e' : '#f59e0b';
    const labelMapping: Record<string, string> = {
        sharp: t('analytics.focusDensity.sharp'),
        good: t('analytics.focusDensity.good'),
        scattered_start: t('analytics.focusDensity.scattered_start'),
        scattered_mind: t('analytics.focusDensity.scattered_mind'),
    };
    return (
        <Section title={t('analytics.focusDensity.title')} noData={!data.hasEnoughData} t={t}>
            <View style={styles.densityRow}>
                <View style={styles.densityCircle}>
                    <Text style={[styles.densityPct, { color }]}>{data.percentage}%</Text>
                </View>
                <Text style={[styles.densityLabel, { color }]}>
                    {labelMapping[data.label]}
                </Text>
            </View>
            <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${data.percentage}%`, backgroundColor: color }]} />
            </View>
        </Section>
    );
}

const styles = StyleSheet.create({
    densityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 16 },
    densityCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
    densityPct: { fontSize: 16, fontWeight: 'bold' },
    densityLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
    progressBg: { height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
});
