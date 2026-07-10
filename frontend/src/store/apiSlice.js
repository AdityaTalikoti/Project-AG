import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/',
    credentials: 'include'
  }),
  tagTypes: ['Journal', 'DashboardStats'],
  endpoints: (builder) => ({
    getJournals: builder.query({
      query: (studentId) => `journal/${studentId}`,
      providesTags: ['Journal'],
    }),
    getDashboardStats: builder.query({
      query: () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return `dashboard/stats?timezone=${encodeURIComponent(timezone)}`;
      },
      providesTags: ['DashboardStats'],
    }),
    getActiveGoal: builder.query({
      query: () => `goals/active`,
    }),
    addJournal: builder.mutation({
      query: (journalData) => ({
        url: 'journal',
        method: 'POST',
        body: journalData,
      }),
      invalidatesTags: ['Journal', 'DashboardStats'],
    }),
    addFocusSession: builder.mutation({
      query: (sessionData) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return {
          url: 'focus-session',
          method: 'POST',
          body: { ...sessionData, timezone },
        };
      },
      invalidatesTags: ['DashboardStats'],
    }),
    updateDailyTarget: builder.mutation({
      query: (targetData) => ({
        url: 'auth/daily-target',
        method: 'PUT',
        body: targetData,
      }),
      invalidatesTags: ['DashboardStats'],
    }),
  }),
});

export const { 
  useGetJournalsQuery, 
  useGetDashboardStatsQuery, 
  useGetActiveGoalQuery, 
  useAddJournalMutation,
  useAddFocusSessionMutation,
  useUpdateDailyTargetMutation
} = apiSlice;
