import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, StyleSheet, Alert, Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/storeHooks';
import {
    useGetTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useUpdateTaskStatusMutation,
    useArchiveTaskMutation,
    useDeleteTaskMutation,
} from '../features/kanban/api/tasksApi';
import { TaskDto } from '../types/task';

interface Props {
    selectedTaskId: string | null;
    onSelectTask: (task: TaskDto | null) => void;
}

export default function TasksScreen({ selectedTaskId, onSelectTask }: Props) {
    const { t } = useTranslation();
    const { user } = useAppSelector(state => state.auth);
    const uid = user?.uid ?? '';

    const { data: tasks = [], isLoading } = useGetTasksQuery(uid, { skip: !uid });
    const [createTask] = useCreateTaskMutation();
    const [updateTask] = useUpdateTaskMutation();
    const [updateStatus] = useUpdateTaskStatusMutation();
    const [archiveTask] = useArchiveTaskMutation();
    const [deleteTask] = useDeleteTaskMutation();

    const [showNewTask, setShowNewTask] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [statusPickerTask, setStatusPickerTask] = useState<TaskDto | null>(null);

    const statusPriority: Record<string, number> = { inprogress: 0, todo: 1, done: 2 };
    const sortedTasks = [...tasks].sort(
        (a, b) => (statusPriority[a.status] ?? 1) - (statusPriority[b.status] ?? 1)
    );

    const handleCreate = async () => {
        if (!newTitle.trim() || !uid) return;
        setIsCreating(true);
        await createTask({
            userId: uid,
            task: { title: newTitle.trim(), description: newDesc.trim(), status: 'todo' },
            order: tasks.length,
        });
        setNewTitle('');
        setNewDesc('');
        setIsCreating(false);
        setShowNewTask(false);
    };

    const handleOpenEdit = (task: TaskDto) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDesc(task.description ?? '');
    };

    const handleSaveEdit = async () => {
        if (!editingTask || !editTitle.trim()) return;
        setIsSaving(true);
        await updateTask({
            taskId: editingTask.id,
            updates: { title: editTitle.trim(), description: editDesc.trim() },
        });
        setIsSaving(false);
        setEditingTask(null);
    };

    const handleDelete = (task: TaskDto) => {
        Alert.alert(t('tasks.deleteHeader'), `"${task.title}" ${t('tasks.deleteConfirm')}`, [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'), style: 'destructive',
                onPress: async () => {
                    if (selectedTaskId === task.id) onSelectTask(null);
                    setEditingTask(null);
                    await deleteTask({ taskId: task.id });
                },
            },
        ]);
    };

    const handleArchive = (task: TaskDto) => {
        Alert.alert(t('tasks.archiveHeader'), `"${task.title}" ${t('tasks.archiveConfirm')}`, [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.archive'), style: 'destructive',
                onPress: () => {
                    if (selectedTaskId === task.id) onSelectTask(null);
                    archiveTask({ taskId: task.id });
                },
            },
        ]);
    };

    const handleStatusPress = (task: TaskDto) => {
        setStatusPickerTask(task);
    };

    const handleStatusSelect = (status: 'todo' | 'inprogress' | 'done') => {
        if (statusPickerTask) {
            updateStatus({ taskId: statusPickerTask.id, status });
        }
        setStatusPickerTask(null);
    };

    const statusColor = (status: string) => {
        if (status === 'todo') return '#3a3a3a';
        if (status === 'inprogress') return '#6366f1';
        return '#166534';
    };

    const statusLabel = (status: string) => {
        if (status === 'todo') return t('tasks.toDoShort');
        if (status === 'inprogress') return t('tasks.inProgressShort');
        return t('tasks.doneShort');
    };

    const renderTask = ({ item }: { item: TaskDto }) => {
        const isSelected = item.id === selectedTaskId;
        const isDone = item.status === 'done';
        return (
            <View style={[styles.taskCard, isSelected && styles.taskCardSelected, isDone && styles.taskCardDone]}>
                <TouchableOpacity style={styles.taskMain} onPress={() => onSelectTask(isSelected ? null : item)}>
                    <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>{item.title}</Text>
                    {item.description ? (
                        <Text style={styles.taskDesc} numberOfLines={1}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.taskFocus}>
                        {t('tasks.focusing')}: {Math.round(item.totalFocusedTime)} {t('tasks.focused')}
                    </Text>
                </TouchableOpacity>
                <View style={styles.taskActions}>
                    <TouchableOpacity
                        style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}
                        onPress={() => handleStatusPress(item)}
                    >
                        <Text style={styles.statusText}>{statusLabel(item.status)}</Text>
                    </TouchableOpacity>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={() => handleOpenEdit(item)} style={styles.iconBtn}>
                            <Text style={styles.iconBtnText}>✎</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleArchive(item)} style={styles.iconBtn}>
                            <Text style={styles.iconBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('tasks.tasks')}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewTask(true)}>
                    <Text style={styles.addBtnText}>+ {t('common.create')}</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
            ) : sortedTasks.length === 0 ? (
                <Text style={styles.empty}>{t('tasks.noTasks')}</Text>
            ) : (
                <FlatList
                    data={sortedTasks}
                    keyExtractor={t => t.id}
                    renderItem={renderTask}
                    contentContainerStyle={{ paddingBottom: 16 }}
                />
            )}

            {/* Yeni Görev Modal */}
            <Modal visible={showNewTask} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('tasks.newTask')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('tasks.titleLabel')}
                            placeholderTextColor="#888"
                            value={newTitle}
                            onChangeText={setNewTitle}
                            autoFocus
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={`${t('tasks.descriptionLabel')} (${t('common.chars', 'isteğe bağlı')})`}
                            placeholderTextColor="#888"
                            value={newDesc}
                            onChangeText={setNewDesc}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => { setShowNewTask(false); setNewTitle(''); setNewDesc(''); }}
                            >
                                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, !newTitle.trim() && styles.confirmBtnDisabled]}
                                onPress={handleCreate}
                                disabled={!newTitle.trim() || isCreating}
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

            {/* Düzenleme Modal */}
            <Modal visible={!!editingTask} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('tasks.editTask')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('tasks.titleLabel')}
                            placeholderTextColor="#888"
                            value={editTitle}
                            onChangeText={setEditTitle}
                            autoFocus
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={`${t('tasks.descriptionLabel')} (${t('common.chars', 'isteğe bağlı')})`}
                            placeholderTextColor="#888"
                            value={editDesc}
                            onChangeText={setEditDesc}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => editingTask && handleDelete(editingTask)}
                            >
                                <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setEditingTask(null)}
                            >
                                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, !editTitle.trim() && styles.confirmBtnDisabled]}
                                onPress={handleSaveEdit}
                                disabled={!editTitle.trim() || isSaving}
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

            {/* Durum Seçici */}
            <Modal visible={!!statusPickerTask} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setStatusPickerTask(null)}
                >
                    <View style={styles.pickerSheet}>
                        <Text style={styles.pickerTitle}>{t('tasks.changeStatus', 'Durum Seç')}</Text>
                        {([
                            { value: 'todo', label: t('tasks.toDoShort'), color: '#888' },
                            { value: 'inprogress', label: t('tasks.inProgressShort'), color: '#6366f1' },
                            { value: 'done', label: t('tasks.doneShort'), color: '#22c55e' },
                        ] as const).map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.pickerOption,
                                    statusPickerTask?.status === opt.value && styles.pickerOptionActive,
                                ]}
                                onPress={() => handleStatusSelect(opt.value)}
                            >
                                <View style={[styles.pickerDot, { backgroundColor: opt.color }]} />
                                <Text style={[
                                    styles.pickerOptionText,
                                    statusPickerTask?.status === opt.value && { color: '#fff' },
                                ]}>
                                    {opt.label}
                                </Text>
                                {statusPickerTask?.status === opt.value && (
                                    <Text style={styles.pickerCheck}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f0f' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },
    heading: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    taskCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1a1a1a', marginHorizontal: 16, marginBottom: 8,
        borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#2a2a2a',
    },
    taskCardSelected: { borderColor: '#6366f1' },
    taskCardDone: { opacity: 0.5 },
    taskTitleDone: { textDecorationLine: 'line-through', color: '#666' },
    taskMain: { flex: 1, marginRight: 8 },
    taskTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
    taskDesc: { color: '#888', fontSize: 13, marginTop: 2 },
    taskFocus: { color: '#555', fontSize: 12, marginTop: 4 },
    taskActions: { alignItems: 'flex-end', gap: 6 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    actionButtons: { flexDirection: 'row', gap: 4 },
    iconBtn: { padding: 4 },
    iconBtnText: { color: '#555', fontSize: 16 },
    empty: { color: '#555', textAlign: 'center', marginTop: 60, fontSize: 15 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a', borderTopLeftRadius: 16, borderTopRightRadius: 16,
        padding: 24, paddingBottom: 40,
    },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    input: {
        backgroundColor: '#0f0f0f', color: '#fff', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
        fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a',
    },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
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
    pickerOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
    },
    pickerSheet: {
        backgroundColor: '#1a1a1a', borderRadius: 14,
        paddingVertical: 8, width: 240,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    pickerTitle: {
        color: '#555', fontSize: 12, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.8,
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#222',
    },
    pickerOption: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 13, gap: 10,
    },
    pickerOptionActive: { backgroundColor: 'rgba(99,102,241,0.1)' },
    pickerDot: { width: 8, height: 8, borderRadius: 4 },
    pickerOptionText: { color: '#aaa', fontSize: 15, flex: 1 },
    pickerCheck: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
});
