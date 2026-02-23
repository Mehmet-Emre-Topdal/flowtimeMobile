import { baseApi } from '../../../store/api/baseApi';
import { ChatMessage } from '../../../types/assistant';

export interface ChatHistoryPayload {
    messages: ChatMessage[];
    summary: string | null;
}

export const chatHistoryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getChatHistory: builder.query<ChatHistoryPayload, void>({
            query: () => 'chat-history',
            providesTags: ['ChatHistory'],
        }),
        saveChatHistory: builder.mutation<{ success: boolean }, ChatHistoryPayload>({
            query: (body) => ({
                url: 'chat-history',
                method: 'PUT',
                body,
            }),
        }),
        clearChatHistory: builder.mutation<{ success: boolean }, void>({
            query: () => ({
                url: 'chat-history',
                method: 'DELETE',
            }),
            invalidatesTags: ['ChatHistory'],
        }),
    }),
});

export const {
    useGetChatHistoryQuery,
    useSaveChatHistoryMutation,
    useClearChatHistoryMutation,
} = chatHistoryApi;
