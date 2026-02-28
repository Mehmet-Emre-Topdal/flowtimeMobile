import { View, Text, StyleSheet } from 'react-native';
import { TaskFlowHarmonyResult } from '../../../types/analytics';
import { Section } from './Section';
import { fmtMin } from '../helpers';

interface Props {
    data: TaskFlowHarmonyResult;
    t: any;
}

export function TaskFlowHarmony({ data, t }: Props) {
    const maxMin = data.items[0]?.totalFocusMinutes ?? 1;
    return (
        <Section title={t('analytics.taskHarmony.title')} noData={!data.hasEnoughData} t={t}>
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
                                {fmtMin(item.totalFocusMinutes, t)} · {item.sessionCount} {t('analytics.taskHarmony.sessions')}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </Section>
    );
}

const styles = StyleSheet.create({
    taskRow: { marginBottom: 10 },
    taskBarBg: { height: 5, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
    taskBarFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
    taskRowLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    taskRowTitle: { color: '#ccc', fontSize: 13, flex: 1 },
    taskRowMin: { color: '#6366f1', fontSize: 11, fontWeight: '600' },
});
