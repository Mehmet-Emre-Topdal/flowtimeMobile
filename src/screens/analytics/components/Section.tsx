import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SectionProps {
    title: string;
    children: ReactNode;
    noData?: boolean;
    t: any;
}

export function Section({ title, children, noData, t }: SectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionBody}>
                {noData
                    ? <Text style={styles.noData}>{t('analytics.notEnoughData')}</Text>
                    : children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginTop: 8 },
    sectionTitle: {
        color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 8,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    sectionBody: {
        backgroundColor: '#1a1a1a', borderRadius: 10,
        padding: 14, borderWidth: 1, borderColor: '#2a2a2a',
    },
    noData: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
