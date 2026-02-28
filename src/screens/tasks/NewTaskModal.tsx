import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal,
    ActivityIndicator, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
    visible: boolean;
    onClose: () => void;
    onCreate: (title: string, desc: string) => Promise<void>;
}

export function NewTaskModal({ visible, onClose, onCreate }: Props) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!title.trim()) return;
        setIsCreating(true);
        setError(null);
        try {
            await onCreate(title.trim(), desc.trim());
            setTitle('');
            setDesc('');
        } catch {
            setError(t('common.saveError', 'Görev oluşturulamadı, tekrar deneyin.'));
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDesc('');
        setError(null);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>{t('tasks.newTask')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('tasks.titleLabel')}
                        placeholderTextColor="#888"
                        value={title}
                        onChangeText={v => { setTitle(v); setError(null); }}
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
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, !title.trim() && styles.confirmBtnDisabled]}
                            onPress={handleCreate}
                            disabled={!title.trim() || isCreating}
                        >
                            {isCreating
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.confirmBtnText}>{t('common.create')}</Text>
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
    errorText: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
});
