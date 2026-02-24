import { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/storeHooks';
import { useGetUserConfigQuery, useUpdateUserConfigMutation } from '../features/timer/api/timerApi';
import { DEFAULT_CONFIG, FlowtimeInterval, UserConfig } from '../types/config';

interface Props {
    onClose: () => void;
}

export default function SettingsScreen({ onClose }: Props) {
    const { t, i18n } = useTranslation();
    const { user } = useAppSelector(state => state.auth);
    const uid = user?.uid ?? '';

    const { data: config, isLoading } = useGetUserConfigQuery(uid, { skip: !uid });
    const [updateConfig, { isLoading: isSaving }] = useUpdateUserConfigMutation();

    const effectiveConfig = config ?? DEFAULT_CONFIG;
    const [intervals, setIntervals] = useState<FlowtimeInterval[]>(effectiveConfig.intervals);

    // max değişince bir sonraki aralığın min'i otomatik güncellenir (web ile aynı mantık)
    const handleBoundaryChange = (index: number, value: string) => {
        const num = parseInt(value, 10);
        if (value !== '' && (isNaN(num) || num < 0)) return;
        const parsed = value === '' ? 0 : num;
        // Bir sonraki aralığın max'ına eşit veya fazla olamaz
        if (index + 1 < intervals.length && parsed >= intervals[index + 1].max) return;
        const newIntervals = [...intervals];
        newIntervals[index] = { ...newIntervals[index], max: parsed };
        if (index + 1 < newIntervals.length) {
            newIntervals[index + 1] = { ...newIntervals[index + 1], min: parsed };
        }
        setIntervals(newIntervals);
    };

    const handleBreakChange = (index: number, value: string) => {
        const num = parseInt(value, 10);
        if (value !== '' && (isNaN(num) || num < 0)) return;
        setIntervals(prev =>
            prev.map((iv, i) => i === index ? { ...iv, break: value === '' ? 0 : num } : iv)
        );
    };

    const handleAdd = () => {
        const newIntervals = [...intervals];
        const lastInterval = newIntervals[newIntervals.length - 1];
        const splitPoint = lastInterval.min + 10;
        newIntervals[newIntervals.length - 1] = { ...lastInterval, max: splitPoint };
        newIntervals.push({ min: splitPoint, max: 999, break: lastInterval.break + 5 });
        setIntervals(newIntervals);
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
        setIntervals(newIntervals);
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const handleSave = async () => {
        // Son aralık hariç tüm aralıklarda max > min olmalı
        const hasInvalidInterval = intervals.some((iv, i) =>
            i < intervals.length - 1 && iv.max <= iv.min
        );
        if (hasInvalidInterval) {
            Alert.alert(
                t('settings.invalidIntervalsTitle', 'Geçersiz Aralık'),
                t('settings.invalidIntervalsDesc', 'Her aralığın son değeri başlangıç değerinden büyük olmalıdır.')
            );
            return;
        }
        const newConfig: UserConfig = { intervals };
        await updateConfig({ uid, config: newConfig });
        onClose();
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#6366f1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('settings.title')}</Text>
                <TouchableOpacity onPress={onClose}>
                    <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
                <Text style={styles.sectionTitle}>{t('settings.flowIntervals')}</Text>
                <Text style={styles.sectionDesc}>
                    {t('settings.flowIntervalsDesc')}
                </Text>

                <View style={styles.tableHeader}>
                    <Text style={[styles.colLabel, styles.colRange]}>{t('settings.focusRange')}</Text>
                    <Text style={[styles.colLabel, styles.colBreak]}>{t('settings.breakDuration')}</Text>
                    <View style={styles.colAction} />
                </View>

                {intervals.map((iv, index) => (
                    <View key={index} style={styles.row}>
                        {/* Odaklanma aralığı: min (sabit) – max (düzenlenebilir) */}
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

                        {/* Mola süresi: düzenlenebilir */}
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

                <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
                <Text style={styles.sectionDesc}>
                    {t('settings.languageDesc')}
                </Text>

                <View style={styles.langRow}>
                    <TouchableOpacity
                        style={[styles.langBtn, i18n.language === 'tr' && styles.langBtnActive]}
                        onPress={() => changeLanguage('tr')}
                    >
                        <Text style={[styles.langBtnText, i18n.language === 'tr' && styles.langBtnTextActive]}>
                            Türkçe
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}
                        onPress={() => changeLanguage('en')}
                    >
                        <Text style={[styles.langBtnText, i18n.language === 'en' && styles.langBtnTextActive]}>
                            English
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                    {isSaving
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f0f' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    },
    heading: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    closeBtn: { color: '#555', fontSize: 20, paddingHorizontal: 4 },
    scroll: { flex: 1, paddingHorizontal: 16 },
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
    row: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 8, gap: 8,
    },
    rangeCell: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1a1a1a', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: '#2a2a2a', gap: 4,
    },
    rangeStaticText: { color: '#9a9a9a', fontSize: 14, minWidth: 24, textAlign: 'center' },
    rangeDash: { color: '#3a3a3a', fontSize: 14 },
    rangeInput: {
        flex: 1, color: '#fff', fontSize: 14,
        textAlign: 'center', paddingVertical: 6,
    },
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
    footer: {
        flexDirection: 'row', gap: 10, padding: 16,
        borderTopWidth: 1, borderTopColor: '#1a1a1a',
    },
    cancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 10,
        borderWidth: 1, borderColor: '#333', alignItems: 'center',
    },
    cancelBtnText: { color: '#888', fontWeight: '600' },
    saveBtn: {
        flex: 2, paddingVertical: 14, borderRadius: 10,
        backgroundColor: '#6366f1', alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    langRow: { flexDirection: 'row', gap: 10 },
    langBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 8,
        borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center',
    },
    langBtnActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
    langBtnText: { color: '#888', fontSize: 14, fontWeight: '500' },
    langBtnTextActive: { color: '#6366f1', fontWeight: '600' },
});
