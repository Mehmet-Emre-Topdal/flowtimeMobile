import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../hooks/storeHooks';
import { useLogoutMutation } from '../features/auth/authApi';
import { TaskDto } from '../types/task';
import TasksScreen from './TasksScreen';
import TimerScreen from './TimerScreen';
import AnalyticsScreen from './AnalyticsScreen';
import AssistantScreen from './AssistantScreen';
import SettingsScreen from './SettingsScreen';

type Tab = 'tasks' | 'timer' | 'analytics' | 'assistant';

export default function MainScreen() {
    const { t } = useTranslation();
    const { user } = useAppSelector(state => state.auth);
    const [logout] = useLogoutMutation();
    const [activeTab, setActiveTab] = useState<Tab>('tasks');
    const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const insets = useSafeAreaInsets();

    const handleSelectTask = (task: TaskDto | null) => {
        setSelectedTask(task);
        if (task) setActiveTab('timer');
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <View style={styles.topBar}>
                <Text style={styles.appName}>Flowtime</Text>
                <View style={styles.topRight}>
                    <Text style={styles.userEmail} numberOfLines={1}>
                        {user?.displayName ?? user?.email ?? ''}
                    </Text>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>⚙</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                {activeTab === 'tasks' && (
                    <TasksScreen
                        selectedTaskId={selectedTask?.id ?? null}
                        onSelectTask={handleSelectTask}
                    />
                )}
                {/* TimerScreen her zaman mount'ta kalır; tab değişince sadece gizlenir.
                    Bu sayede timer state (refs) tab geçişlerinde sıfırlanmaz. */}
                <View style={{ display: activeTab === 'timer' ? 'flex' : 'none', flex: 1 }}>
                    <TimerScreen selectedTask={selectedTask} />
                </View>
                {activeTab === 'analytics' && (
                    <AnalyticsScreen />
                )}
                {activeTab === 'assistant' && (
                    <AssistantScreen />
                )}
            </View>

            <Modal visible={showSettings} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }}>
                    <SettingsScreen onClose={() => setShowSettings(false)} />
                </SafeAreaView>
            </Modal>

            <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'tasks' && styles.tabItemActive]}
                    onPress={() => setActiveTab('tasks')}
                >
                    <Text style={[styles.tabIcon, activeTab === 'tasks' && styles.tabIconActive]}>☰</Text>
                    <Text style={[styles.tabLabel, activeTab === 'tasks' && styles.tabLabelActive]}>{t('tabs.tasks')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'timer' && styles.tabItemActive]}
                    onPress={() => setActiveTab('timer')}
                >
                    {selectedTask && <View style={styles.taskDot} />}
                    <Text style={[styles.tabIcon, activeTab === 'timer' && styles.tabIconActive]}>◷</Text>
                    <Text style={[styles.tabLabel, activeTab === 'timer' && styles.tabLabelActive]}>{t('tabs.timer')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'analytics' && styles.tabItemActive]}
                    onPress={() => setActiveTab('analytics')}
                >
                    <Text style={[styles.tabIcon, activeTab === 'analytics' && styles.tabIconActive]}>📊</Text>
                    <Text style={[styles.tabLabel, activeTab === 'analytics' && styles.tabLabelActive]}>{t('tabs.analytics')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'assistant' && styles.tabItemActive]}
                    onPress={() => setActiveTab('assistant')}
                >
                    <Text style={[styles.tabIcon, activeTab === 'assistant' && styles.tabIconActive]}>✦</Text>
                    <Text style={[styles.tabLabel, activeTab === 'assistant' && styles.tabLabelActive]}>{t('tabs.assistant')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0f0f0f' },
    topBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    },
    appName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' },
    userEmail: { color: '#555', fontSize: 13, maxWidth: 160 },
    logoutBtn: { paddingVertical: 4, paddingHorizontal: 10 },
    logoutText: { color: '#555', fontSize: 13 },
    content: { flex: 1 },
    tabBar: {
        flexDirection: 'row',
        borderTopWidth: 1, borderTopColor: '#1a1a1a',
        backgroundColor: '#0f0f0f',
    },
    tabItem: {
        flex: 1, alignItems: 'center', paddingVertical: 10,
        position: 'relative',
    },
    tabItemActive: {},
    tabIcon: { fontSize: 22, color: '#444' },
    tabIconActive: { color: '#6366f1' },
    tabLabel: { fontSize: 11, color: '#444', marginTop: 2 },
    tabLabelActive: { color: '#6366f1' },
    taskDot: {
        position: 'absolute', top: 8, right: '30%',
        width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366f1',
    },
});
