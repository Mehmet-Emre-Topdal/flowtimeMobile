import { useCallback } from 'react';
import { useCreateSessionMutation } from '../features/analytics/api/sessionsApi';
import { useUpdateTaskFocusTimeMutation } from '../features/kanban/api/tasksApi';
import { TaskDto } from '../types/task';

export function useSessionSaver(uid: string, selectedTask: TaskDto | null) {
    const [createSession] = useCreateSessionMutation();
    const [updateFocusTime] = useUpdateTaskFocusTimeMutation();

    const saveCurrentSession = useCallback(async (focusSec: number, focusStartTime: number) => {
        if (focusSec < 60 || !uid || !focusStartTime) return;

        await createSession({
            userId: uid,
            startedAt: new Date(focusStartTime).toISOString(),
            endedAt: new Date().toISOString(),
            durationSeconds: Math.round(focusSec),
            breakDurationSeconds: 0,
            taskId: selectedTask?.id ?? null,
            taskTitle: selectedTask?.title ?? null,
        });

        if (selectedTask) {
            await updateFocusTime({
                taskId: selectedTask.id,
                additionalMinutes: Math.round(focusSec / 60),
            });
        }
    }, [uid, selectedTask, createSession, updateFocusTime]);

    return { saveCurrentSession };
}
