import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal,
    ActivityIndicator, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { TaskDto } from '../../types/task';

interface Props {
    task: TaskDto | null;
    onClose: () => void;
    onSave: (title: string, desc: string) => Promise<void>;
    onDelete: (task: TaskDto) => void;
}

export function EditTaskModal({ task, onClose, onSave, onDelete }: Props) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDesc(task.description ?? '');
            setError(null);
        }
    }, [task]);

    const handleSave = async () => {
        if (!title.trim()) return;
        setIsSaving(true);
        setError(null);
        try {
            await onSave(title.trim(), desc.trim());
        } catch {
            setError(t('common.saveError', 'Değişiklikler kaydedilemedi, tekrar deneyin.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={!!task} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>{t('tasks.editTask')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('tasks.titleLabel')}
                        placeholderTextColor="#888"
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={`${t('tasks.descriptionLabel')} (${t('common.chars', 'isteğe bağlı')})`}
                        placeholderTextColor="#888"
                        value={desc}
                        onChangeText={setDesc}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => task && onDelete(task)}
                        >
                            <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, !title.trim() && styles.confirmBtnDisabled]}
                            onPress={handleSave}
                            disabled={!title.trim() || isSaving}
                        >
                            {isSaving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.confirmBtnText}>{t('common.save')}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    content: {
        backgroundColor: '#1a1a1a', borderTopLeftRadius: 16, borderTopRightRadius: 16,
        padding: 24, paddingBottom: 40,
    },
    title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    input: {
        backgroundColor: '#0f0f0f', color: '#fff', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
        fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a',
    },
    actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
    cancelBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 8,
        borderWidth: 1, borderColor: '#333', alignItems: 'center',
    },
    cancelBtnText: { color: '#888', fontWeight: '600' },
    confirmBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 8,
        backgroundColor: '#6366f1', alignItems: 'center',
    },
    confirmBtnDisabled: { backgroundColor: '#333' },
    confirmBtnText: { color: '#fff', fontWeight: '600' },
    deleteBtn: {
        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8,
        backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    },
    deleteBtnText: { color: '#ef4444', fontWeight: '600' },
    errorText: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
});
