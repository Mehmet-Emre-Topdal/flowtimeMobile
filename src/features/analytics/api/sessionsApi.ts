import { baseApi } from '../../../store/api/baseApi';
import { FlowSession, FlowSessionCreateInput } from '../../../types/session';

export const sessionsApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({

        createSession: builder.mutation<{ success: boolean; id: string }, FlowSessionCreateInput>({
            query: (input) => ({
                url: 'sessions',
                method: 'POST',
                body: input,
            }),
            invalidatesTags: ['Analytics'],
        }),

        getSessions: builder.query<FlowSession[], string>({
            query: () => 'sessions',
            transformResponse: (response: { sessions: FlowSession[] }) => response.sessions,
            providesTags: ['Analytics'],
        }),
    }),
});

export const {
    useCreateSessionMutation,
    useGetSessionsQuery,
} = sessionsApi;
