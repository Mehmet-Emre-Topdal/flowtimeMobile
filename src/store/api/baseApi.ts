import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { auth } from '../../lib/firebase';

const getBaseUrl = (): string => {
    return process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';
};

export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: fetchBaseQuery({
        baseUrl: getBaseUrl(),
        prepareHeaders: async (headers) => {
            const token = await auth.currentUser?.getIdToken();
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Task', 'Analytics', 'TimerConfig', 'ChatHistory'],
    endpoints: () => ({}),
});
