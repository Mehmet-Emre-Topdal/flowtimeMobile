import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlowtimeInterval } from '../../types/config';

interface Props {
    intervals: FlowtimeInterval[];
    onIntervalsChange: (intervals: FlowtimeInterval[]) => void;
}

export function IntervalEditor({ intervals, onIntervalsChange }: Props) {
    const { t } = useTranslation();

    const handleBoundaryChange = (index: number, value: string) => {
        const num = parseInt(value, 10);
        if (value !== '' && (isNaN(num) || num < 0)) return;
        const parsed = value === '' ? 0 : num;
        if (index + 1 < intervals.length && parsed >= intervals[index + 1].max) return;
        const newIntervals = [...intervals];
        newIntervals[index] = { ...newIntervals[index], max: parsed };
        if (index + 1 < newIntervals.length) {
            newIntervals[index + 1] = { ...newIntervals[index + 1], min: parsed };
        }
        onIntervalsChange(newIntervals);
    };

    const handleBreakChange = (index: number, value: string) => {
        const num = parseInt(value, 10);
        if (value !== '' && (isNaN(num) || num < 0)) return;
        onIntervalsChange(
            intervals.map((iv, i) => i === index ? { ...iv, break: value === '' ? 0 : num } : iv)
        );
    };

    const handleAdd = () => {
        const newIntervals = [...intervals];
        const lastInterval = newIntervals[newIntervals.length - 1];
        const splitPoint = lastInterval.min + 10;
        newIntervals[newIntervals.length - 1] = { ...lastInterval, max: splitPoint };
        newIntervals.push({ min: splitPoint, max: 999, break: lastInterval.break + 5 });
        onIntervalsChange(newIntervals);
    };

    const handleRemove = (index: number) => {
        if (intervals.length <= 2) {
            Alert.alert(t('settings.removeIntervalError', 'En az 2 aralık gerekli'));
            return;
        }
        const newIntervals = [...intervals];
        if (index === 0) {
            newIntervals[1] = { ...newIntervals[1], min: 0 };
        } else if (index === newIntervals.length - 1) {
            newIntervals[index - 1] = { ...newIntervals[index - 1], max: 999 };
        } else {
            newIntervals[index - 1] = { ...newIntervals[index - 1], max: newIntervals[index + 1].min };
        }
        newIntervals.splice(index, 1);
        onIntervalsChange(newIntervals);
    };

    return (
        <View>
            <Text style={styles.sectionTitle}>{t('settings.flowIntervals')}</Text>
            <Text style={styles.sectionDesc}>{t('settings.flowIntervalsDesc')}</Text>

            <View style={styles.tableHeader}>
                <Text style={[styles.colLabel, styles.colRange]}>{t('settings.focusRange')}</Text>
                <Text style={[styles.colLabel, styles.colBreak]}>{t('settings.breakDuration')}</Text>
                <View style={styles.colAction} />
            </View>

            {intervals.map((iv, index) => (
                <View key={index} style={styles.row}>
                    <View style={[styles.rangeCell, styles.colRange]}>
                        <Text style={styles.rangeStaticText}>
                            {index === 0 ? '0' : iv.min}
                        </Text>
                        <Text style={styles.rangeDash}>–</Text>
                        {index === intervals.length - 1 ? (
                            <Text style={styles.rangeStaticText}>∞</Text>
                        ) : (
                            <TextInput
                                style={styles.rangeInput}
                                value={String(iv.max)}
                                onChangeText={v => handleBoundaryChange(index, v)}
                                keyboardType="numeric"
                                placeholderTextColor="#555"
                            />
                        )}
                    </View>

                    <View style={[styles.breakCell, styles.colBreak]}>
                        <TextInput
                            style={styles.breakInput}
                            value={String(iv.break)}
                            onChangeText={v => handleBreakChange(index, v)}
                            keyboardType="numeric"
                            placeholder="5"
                            placeholderTextColor="#4f51a0"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.colAction, styles.removeBtn]}
                        onPress={() => handleRemove(index)}
                    >
                        <Text style={styles.removeBtnText}>−</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>+ {t('settings.addInterval')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 20, marginBottom: 4 },
    sectionDesc: { color: '#555', fontSize: 13, marginBottom: 16, lineHeight: 18 },
    tableHeader: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 6, paddingHorizontal: 2,
    },
    colLabel: { color: '#666', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    colRange: { flex: 3 },
    colBreak: { flex: 2 },
    colAction: { flex: 1, alignItems: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    rangeCell: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1a1a1a', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: '#2a2a2a', gap: 4,
    },
    rangeStaticText: { color: '#9a9a9a', fontSize: 14, minWidth: 24, textAlign: 'center' },
    rangeDash: { color: '#3a3a3a', fontSize: 14 },
    rangeInput: { flex: 1, color: '#fff', fontSize: 14, textAlign: 'center', paddingVertical: 6 },
    breakCell: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)',
        alignItems: 'center',
    },
    breakInput: {
        color: '#6366f1', fontSize: 14, fontWeight: '600',
        textAlign: 'center', paddingVertical: 6, width: '100%',
    },
    removeBtn: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
    removeBtnText: { color: '#ef4444', fontSize: 20, fontWeight: '600' },
    addBtn: {
        marginTop: 8, paddingVertical: 12, borderRadius: 8,
        borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center',
        borderStyle: 'dashed',
    },
    addBtnText: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
});
