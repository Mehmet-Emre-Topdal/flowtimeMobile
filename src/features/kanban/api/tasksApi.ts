import { baseApi } from '../../../store/api/baseApi';
import { TaskDto, TaskCreateInput, TaskUpdateInput } from '../../../types/task';

export const tasksApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({

        getTasks: builder.query<TaskDto[], string>({
            query: () => 'tasks',
            transformResponse: (response: { tasks: TaskDto[] }) => response.tasks,
            providesTags: ['Task'],
        }),

        createTask: builder.mutation<{ success: boolean; id: string }, { userId: string; task: TaskCreateInput; order: number }>({
            query: ({ task, order }) => ({
                url: 'tasks',
                method: 'POST',
                body: { task, order },
            }),
            invalidatesTags: ['Task'],
        }),

        updateTask: builder.mutation<{ success: boolean }, { taskId: string; updates: TaskUpdateInput }>({
            query: ({ taskId, updates }) => ({
                url: `tasks/${taskId}`,
                method: 'PUT',
                body: updates,
            }),
            invalidatesTags: ['Task'],
        }),

        updateTaskStatus: builder.mutation<{ success: boolean }, { taskId: string; status: string }>({
            query: ({ taskId, status }) => ({
                url: `tasks/${taskId}`,
                method: 'PUT',
                body: { status },
            }),
            invalidatesTags: ['Task'],
        }),

        updateTaskFocusTime: builder.mutation<{ success: boolean }, { taskId: string; additionalMinutes: number }>({
            query: ({ taskId, additionalMinutes }) => ({
                url: `tasks/${taskId}`,
                method: 'PUT',
                body: { additionalMinutes },
            }),
            invalidatesTags: ['Task'],
        }),

        archiveTask: builder.mutation<{ success: boolean }, { taskId: string }>({
            query: ({ taskId }) => ({
                url: `tasks/${taskId}/archive`,
                method: 'POST',
            }),
            invalidatesTags: ['Task'],
        }),

        deleteTask: builder.mutation<{ success: boolean }, { taskId: string }>({
            query: ({ taskId }) => ({
                url: `tasks/${taskId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Task'],
        }),
    }),
});

export const {
    useGetTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useUpdateTaskStatusMutation,
    useUpdateTaskFocusTimeMutation,
    useArchiveTaskMutation,
    useDeleteTaskMutation,
} = tasksApi;
