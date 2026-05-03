import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://127.0.0.1:5000/api/' }),
  tagTypes: ['Journal'],
  endpoints: (builder) => ({
    getJournals: builder.query({
      query: (studentId) => `journal/${studentId}`,
      providesTags: ['Journal'],
    }),
    getDashboardStats: builder.query({
      query: () => `dashboard/stats`,
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
      invalidatesTags: ['Journal'],
    }),
  }),
});

export const { useGetJournalsQuery, useGetDashboardStatsQuery, useGetActiveGoalQuery, useAddJournalMutation } = apiSlice;
