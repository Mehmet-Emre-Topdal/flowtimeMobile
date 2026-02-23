import { baseApi } from '../../../store/api/baseApi';
import { ChatRequest, ChatResponse } from '../../../types/assistant';

export const assistantApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        sendMessage: builder.mutation<ChatResponse, ChatRequest>({
            query: (body) => ({
                url: 'assistant/chat',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const { useSendMessageMutation } = assistantApi;
