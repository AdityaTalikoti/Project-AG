import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/',
    credentials: 'include'
  }),
  tagTypes: ['Journal', 'DashboardStats', 'Event'],
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

    // --- Calendar Events ---
    getEvents: builder.query({
      query: ({ start, end } = {}) => {
        let url = 'events';
        const params = [];
        if (start) params.push(`start=${encodeURIComponent(start)}`);
        if (end) params.push(`end=${encodeURIComponent(end)}`);
        if (params.length) url += `?${params.join('&')}`;
        return url;
      },
      providesTags: ['Event'],
    }),
    getEventById: builder.query({
      query: (id) => `events/${id}`,
      providesTags: (result, error, id) => [{ type: 'Event', id }],
    }),
    getTodayEvents: builder.query({
      query: () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return `events/today?timezone=${encodeURIComponent(timezone)}`;
      },
      providesTags: ['Event'],
    }),
    getUpcomingEvents: builder.query({
      query: () => 'events/upcoming',
      providesTags: ['Event'],
    }),
    getDashboardEvents: builder.query({
      query: () => 'events/dashboard',
      providesTags: ['Event'],
    }),
    createEvent: builder.mutation({
      query: (eventData) => ({
        url: 'events',
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: ['Event', 'DashboardStats'],
    }),
    updateEvent: builder.mutation({
      query: ({ id, ...eventData }) => ({
        url: `events/${id}`,
        method: 'PUT',
        body: eventData,
      }),
      invalidatesTags: ['Event', 'DashboardStats'],
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({
        url: `events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event', 'DashboardStats'],
    }),
  }),
});

export const { 
  useGetJournalsQuery, 
  useGetDashboardStatsQuery, 
  useGetActiveGoalQuery, 
  useAddJournalMutation,
  useAddFocusSessionMutation,
  useUpdateDailyTargetMutation,
  
  // Calendar Hooks
  useGetEventsQuery,
  useGetEventByIdQuery,
  useGetTodayEventsQuery,
  useGetUpcomingEventsQuery,
  useGetDashboardEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation
} = apiSlice;
