import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${import.meta.env.VITE_API_URL || ''}/api/`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('X-Requested-With', 'XMLHttpRequest');
      const match = document.cookie.match(/(?:^|; )_csrf=([^;]*)/);
      if (match && match[1]) {
        headers.set('X-CSRF-Token', decodeURIComponent(match[1]));
      }
      return headers;
    },
  }),
  tagTypes: ['Journal', 'DashboardStats', 'Event', 'StudyPlan', 'Task', 'TaskSubmission'],
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
    getDashboardInsight: builder.query({
      query: () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return `ai/dashboard-insight?timezone=${encodeURIComponent(timezone)}`;
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
    getRoadmapSyncStatus: builder.query({
      query: (roadmapId) => `roadmaps/${roadmapId}/sync-status`,
      providesTags: ['Event'],
    }),
    syncRoadmap: builder.mutation({
      query: (roadmapId) => ({
        url: `roadmaps/${roadmapId}/sync`,
        method: 'POST',
      }),
      invalidatesTags: ['Event'],
    }),
    deleteActiveRoadmap: builder.mutation({
      query: () => ({
        url: 'roadmaps/active',
        method: 'DELETE',
      }),
      invalidatesTags: ['Event', 'DashboardStats'],
    }),
    archiveActiveRoadmap: builder.mutation({
      query: () => ({
        url: 'roadmaps/archive',
        method: 'POST',
      }),
      invalidatesTags: ['Event', 'DashboardStats'],
    }),
    generateRoadmap: builder.mutation({
      query: (roadmapData) => ({
        url: 'roadmaps/generate',
        method: 'POST',
        body: roadmapData,
      }),
    }),
    analyzeSuggestions: builder.mutation({
      query: (editData) => ({
        url: 'roadmaps/analyze-suggestions',
        method: 'POST',
        body: editData,
      }),
    }),
    saveRoadmap: builder.mutation({
      query: (customRoadmap) => ({
        url: 'roadmaps/save',
        method: 'POST',
        body: customRoadmap,
      }),
      invalidatesTags: ['Event', 'DashboardStats'],
    }),
    getStudyPlan: builder.query({
      query: (date) => date ? `ai/study-plan?date=${date}` : 'ai/study-plan',
      providesTags: ['StudyPlan'],
    }),
    regenerateStudyPlan: builder.mutation({
      query: () => ({
        url: 'ai/regenerate-study-plan',
        method: 'POST',
      }),
      invalidatesTags: ['StudyPlan'],
    }),
    toggleStudyPlanTask: builder.mutation({
      query: (taskData) => ({
        url: 'ai/study-plan/task/toggle',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: ['StudyPlan'],
    }),
    rescheduleMilestone: builder.mutation({
      query: (rescheduleData) => ({
        url: 'ai/study-plan/reschedule',
        method: 'POST',
        body: rescheduleData,
      }),
      invalidatesTags: ['StudyPlan', 'Event'],
    }),

    // --- Tasks ---
    getTasks: builder.query({
      query: () => 'tasks',
      providesTags: ['Task'],
    }),
    getTaskById: builder.query({
      query: (id) => `tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    getStudents: builder.query({
      query: () => 'tasks/students',
    }),
    createTask: builder.mutation({
      query: (taskData) => ({
        url: 'tasks',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...taskData }) => ({
        url: `tasks/${id}`,
        method: 'PATCH',
        body: taskData,
      }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),

    // --- Task Submissions ---
    submitTask: builder.mutation({
      query: ({ id, formData }) => ({
        url: `tasks/${id}/submit`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Task', 'TaskSubmission'],
    }),
    getTaskSubmissions: builder.query({
      query: (taskId) => `tasks/${taskId}/submissions`,
      providesTags: ['TaskSubmission'],
    }),
    reviewSubmission: builder.mutation({
      query: ({ submissionId, action, feedback }) => ({
        url: `tasks/submissions/${submissionId}/review`,
        method: 'PATCH',
        body: { action, feedback },
      }),
      invalidatesTags: ['Task', 'TaskSubmission'],
    }),
  }),
});

export const { 
  useGetJournalsQuery, 
  useGetDashboardStatsQuery, 
  useGetDashboardInsightQuery,
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
  useDeleteEventMutation,

  // Roadmap Sync Hooks
  useGetRoadmapSyncStatusQuery,
  useSyncRoadmapMutation,
  
  // Roadmap Delete & Archive Mutations
  useDeleteActiveRoadmapMutation,
  useArchiveActiveRoadmapMutation,
  
  // Phase 7 AI Roadmap Mutations
  useGenerateRoadmapMutation,
  useAnalyzeSuggestionsMutation,
  useSaveRoadmapMutation,

  // Phase 8 AI Study Planner Hooks
  useGetStudyPlanQuery,
  useRegenerateStudyPlanMutation,
  useToggleStudyPlanTaskMutation,
  useRescheduleMilestoneMutation,

  // Tasks Hooks
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useGetStudentsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,

  // Task Submissions Hooks
  useSubmitTaskMutation,
  useGetTaskSubmissionsQuery,
  useReviewSubmissionMutation
} = apiSlice;
