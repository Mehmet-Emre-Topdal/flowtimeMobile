import { baseApi } from '../../../store/api/baseApi';
import {
    DailyFlowWavesResult,
    WeeklyWorkTimeResult,
    FocusDensityResult,
    ResistancePointResult,
    EarnedFreedomResult,
    NaturalFlowWindowResult,
    FlowStreakResult,
    TaskFlowHarmonyResult,
    WarmupPhaseResult,
} from '../../../types/analytics';

export interface AnalyticsResult {
    dailyFlowWaves: DailyFlowWavesResult;
    weeklyWorkTime: WeeklyWorkTimeResult;
    focusDensity: FocusDensityResult;
    resistancePoint: ResistancePointResult;
    earnedFreedom: EarnedFreedomResult;
    naturalFlowWindow: NaturalFlowWindowResult;
    flowStreak: FlowStreakResult;
    taskFlowHarmony: TaskFlowHarmonyResult;
    warmupPhase: WarmupPhaseResult;
    summary: {
        totalSessions: number;
        allTimeMinutes: number;
    };
}

export const analyticsApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({

        getAnalytics: builder.query<AnalyticsResult, { weekOffset?: number }>({
            query: ({ weekOffset = 0 }) => `analytics?weekOffset=${weekOffset}`,
            providesTags: ['Analytics'],
        }),

    }),
});

export const { useGetAnalyticsQuery } = analyticsApi;
