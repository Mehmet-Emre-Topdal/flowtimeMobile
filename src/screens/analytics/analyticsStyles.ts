import { StyleSheet } from 'react-native';

// Styles used directly by AnalyticsScreen
export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f0f' },
    scroll: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
    headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    heading: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    cardRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    statCard: {
        flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10,
        padding: 12, borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 8,
        alignItems: 'center',
    },
    statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    statLabel: { color: '#555', fontSize: 11, marginTop: 4, textAlign: 'center' },
    noData: { color: '#555', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
