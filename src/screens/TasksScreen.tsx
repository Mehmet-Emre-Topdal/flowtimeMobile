import { useState } from 'react';
import {
    View, Text, TouchableOpacity, FlatList,
    ActivityIndicator, StyleSheet, Alert,
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
import { NewTaskModal } from './tasks/NewTaskModal';
import { EditTaskModal } from './tasks/EditTaskModal';
import { StatusPickerModal } from './tasks/StatusPickerModal';

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
    const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
    const [statusPickerTask, setStatusPickerTask] = useState<TaskDto | null>(null);

    const statusPriority: Record<string, number> = { inprogress: 0, todo: 1, done: 2 };
    const sortedTasks = [...tasks].sort(
        (a, b) => (statusPriority[a.status] ?? 1) - (statusPriority[b.status] ?? 1)
    );

    const handleCreate = async (title: string, desc: string) => {
        await createTask({
            userId: uid,
            task: { title, description: desc, status: 'todo' },
            order: tasks.length,
        });
        setShowNewTask(false);
    };

    const handleSaveEdit = async (title: string, desc: string) => {
        if (!editingTask) return;
        await updateTask({
            taskId: editingTask.id,
            updates: { title, description: desc },
        });
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
                    try {
                        await deleteTask({ taskId: task.id });
                    } catch {
                        Alert.alert(
                            t('common.error', 'Hata'),
                            t('tasks.deleteError', 'Görev silinirken bir hata oluştu.')
                        );
                    }
                },
            },
        ]);
    };

    const handleArchive = (task: TaskDto) => {
        Alert.alert(t('tasks.archiveHeader'), `"${task.title}" ${t('tasks.archiveConfirm')}`, [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.archive'), style: 'destructive',
                onPress: async () => {
                    if (selectedTaskId === task.id) onSelectTask(null);
                    try {
                        await archiveTask({ taskId: task.id });
                    } catch {
                        Alert.alert(
                            t('common.error', 'Hata'),
                            t('tasks.archiveError', 'Görev arşivlenirken bir hata oluştu.')
                        );
                    }
                },
            },
        ]);
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
                        onPress={() => setStatusPickerTask(item)}
                    >
                        <Text style={styles.statusText}>{statusLabel(item.status)}</Text>
                    </TouchableOpacity>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={() => setEditingTask(item)} style={styles.iconBtn}>
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
                    keyExtractor={(task) => task.id}
                    renderItem={renderTask}
                    contentContainerStyle={{ paddingBottom: 16 }}
                />
            )}

            <NewTaskModal
                visible={showNewTask}
                onClose={() => setShowNewTask(false)}
                onCreate={handleCreate}
            />
            <EditTaskModal
                task={editingTask}
                onClose={() => setEditingTask(null)}
                onSave={handleSaveEdit}
                onDelete={handleDelete}
            />
            <StatusPickerModal
                task={statusPickerTask}
                onClose={() => setStatusPickerTask(null)}
                onSelect={handleStatusSelect}
            />
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
});
