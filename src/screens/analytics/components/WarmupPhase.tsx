import { Text, StyleSheet } from 'react-native';
import { WarmupPhaseResult } from '../../../types/analytics';
import { Section } from './Section';

interface Props {
    data: WarmupPhaseResult;
    t: any;
}

export function WarmupPhase({ data, t }: Props) {
    return (
        <Section title={t('analytics.warmup.title')} noData={!data.hasEnoughData} t={t}>
            <Text style={styles.bigStat}>{data.avgWarmupMinutes} {t('tasks.focused')}</Text>
            <Text style={styles.dimText}>{t('analytics.warmup.tooltip').split('.')[0]}</Text>
            {data.prevMonthWarmup !== null && data.changeMinutes !== null && (
                <Text style={[styles.infoLine, { marginTop: 6 }]}>
                    {t('analytics.warmup.avgText', { minutes: data.avgWarmupMinutes })}
                    {'  '}
                    <Text style={{ color: data.changeMinutes <= 0 ? '#22c55e' : '#f59e0b' }}>
                        {data.changeMinutes > 0
                            ? t('analytics.warmup.worsened', { minutes: data.changeMinutes })
                            : t('analytics.warmup.improved', { minutes: Math.abs(data.changeMinutes) })}
                    </Text>
                </Text>
            )}
        </Section>
    );
}

const styles = StyleSheet.create({
    bigStat: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    dimText: { color: '#555', fontSize: 12 },
    infoLine: { color: '#ccc', fontSize: 13, marginBottom: 6 },
});
