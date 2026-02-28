import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TaskDto } from '../../types/task';

interface Props {
    task: TaskDto | null;
    onClose: () => void;
    onSelect: (status: 'todo' | 'inprogress' | 'done') => void;
}

export function StatusPickerModal({ task, onClose, onSelect }: Props) {
    const { t } = useTranslation();

    return (
        <Modal visible={!!task} transparent animationType="fade">
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.sheet}>
                    <Text style={styles.title}>{t('tasks.changeStatus', 'Durum Seç')}</Text>
                    {([
                        { value: 'todo', label: t('tasks.toDoShort'), color: '#888' },
                        { value: 'inprogress', label: t('tasks.inProgressShort'), color: '#6366f1' },
                        { value: 'done', label: t('tasks.doneShort'), color: '#22c55e' },
                    ] as const).map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.option, task?.status === opt.value && styles.optionActive]}
                            onPress={() => onSelect(opt.value)}
                        >
                            <View style={[styles.dot, { backgroundColor: opt.color }]} />
                            <Text style={[
                                styles.optionText,
                                task?.status === opt.value && { color: '#fff' },
                            ]}>
                                {opt.label}
                            </Text>
                            {task?.status === opt.value && (
                                <Text style={styles.check}>✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
    },
    sheet: {
        backgroundColor: '#1a1a1a', borderRadius: 14,
        paddingVertical: 8, width: 240,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    title: {
        color: '#555', fontSize: 12, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.8,
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#222',
    },
    option: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 13, gap: 10,
    },
    optionActive: { backgroundColor: 'rgba(99,102,241,0.1)' },
    dot: { width: 8, height: 8, borderRadius: 4 },
    optionText: { color: '#aaa', fontSize: 15, flex: 1 },
    check: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
});
