import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LanguageSelector() {
    const { t, i18n } = useTranslation();

    return (
        <View>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            <Text style={styles.sectionDesc}>{t('settings.languageDesc')}</Text>
            <View style={styles.langRow}>
                <TouchableOpacity
                    style={[styles.langBtn, i18n.language === 'tr' && styles.langBtnActive]}
                    onPress={() => i18n.changeLanguage('tr')}
                >
                    <Text style={[styles.langBtnText, i18n.language === 'tr' && styles.langBtnTextActive]}>
                        Türkçe
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}
                    onPress={() => i18n.changeLanguage('en')}
                >
                    <Text style={[styles.langBtnText, i18n.language === 'en' && styles.langBtnTextActive]}>
                        English
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 20, marginBottom: 4 },
    sectionDesc: { color: '#555', fontSize: 13, marginBottom: 16, lineHeight: 18 },
    langRow: { flexDirection: 'row', gap: 10 },
    langBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 8,
        borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center',
    },
    langBtnActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
    langBtnText: { color: '#888', fontSize: 14, fontWeight: '500' },
    langBtnTextActive: { color: '#6366f1', fontWeight: '600' },
});
