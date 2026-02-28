import { View, Text, StyleSheet } from 'react-native';
import { ResistancePointResult } from '../../../types/analytics';
import { Section } from './Section';

interface Props {
    data: ResistancePointResult;
    t: any;
}

export function ResistancePoint({ data, t }: Props) {
    return (
        <Section title={t('analytics.resistancePoint.title')} noData={!data.hasEnoughData} t={t}>
            <Text style={styles.bigStat}>{data.resistanceMinute} {t('tasks.focused')}</Text>
            <Text style={styles.dimText}>{t('analytics.resistancePoint.tooltip').split('.')[0]}</Text>
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

const styles = StyleSheet.create({
    bigStat: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    dimText: { color: '#555', fontSize: 12 },
    dotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2a2a2a' },
    dotOver: { backgroundColor: '#6366f1' },
});
