import { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/storeHooks';
import { useGetUserConfigQuery, useUpdateUserConfigMutation } from '../features/timer/api/timerApi';
import { DEFAULT_CONFIG, FlowtimeInterval, UserConfig } from '../types/config';
import { IntervalEditor } from './settings/IntervalEditor';
import { LanguageSelector } from './settings/LanguageSelector';

interface Props {
    onClose: () => void;
}

export default function SettingsScreen({ onClose }: Props) {
    const { t } = useTranslation();
    const { user } = useAppSelector(state => state.auth);
    const uid = user?.uid ?? '';

    const { data: config, isLoading } = useGetUserConfigQuery(uid, { skip: !uid });
    const [updateConfig, { isLoading: isSaving }] = useUpdateUserConfigMutation();

    const effectiveConfig = config ?? DEFAULT_CONFIG;
    const [intervals, setIntervals] = useState<FlowtimeInterval[]>(effectiveConfig.intervals);

    const handleSave = async () => {
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
        try {
            await updateConfig({ uid, config: newConfig });
            onClose();
        } catch {
            Alert.alert(
                t('common.error', 'Hata'),
                t('settings.saveError', 'Ayarlar kaydedilemedi, tekrar deneyin.')
            );
        }
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
                <IntervalEditor intervals={intervals} onIntervalsChange={setIntervals} />
                <LanguageSelector />
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
});
