import { useSelector } from 'react-redux';
import { useGetDashboardStatsQuery, useGetTasksQuery, useGetStudentsQuery } from '../store/apiSlice';

/**
 * Mentor Dashboard — Phase 2.
 *
 * Statistics are fetched from authorized endpoints only.
 * If an endpoint cannot reliably supply mentor-scoped data,
 * the statistic displays "—" with a brief explanation.
 */

export default function MentorDashboard() {
  const { user } = useSelector((state) => state.auth);

  // Fetch dashboard stats (timezone-aware, authorized)
  const { isLoading: statsLoading, isError: statsError } = useGetDashboardStatsQuery(
    undefined,
    { skip: !user }
  );

  // Fetch all tasks — we client-filter for mentor-created tasks only.
  // This is presentation-only filtering; backend authorization is required.
  const { data: tasksRes, isLoading: tasksLoading, isError: tasksError } = useGetTasksQuery(undefined);

  // Fetch students list — we DO NOT use client-side filtering as authorization.
  // If the API does not return mentor-scoped data, we show "—".
  const { data: studentsRes, isLoading: studentsLoading, isError: studentsError } = useGetStudentsQuery();

  // --- Statistics ---
  let totalStudents = '—';
  let tasksAssigned = '—';
  // pendingReviews is intentionally unavailable until a mentor-submissions API is implemented.
  const pendingReviews = '—';
  let completedTasks = '—';

  // 1. Total Students:
  //    The `tasks/students` endpoint may or may not be mentor-scoped.
  // Per requirements: only show count if API is known to be authorized.
  // Currently we treat it as unavailable until a mentor-scoped students API exists.
  if (!studentsLoading && !studentsError && studentsRes) {
    // Only display if we can confirm this is mentor-authorized data.
    // Since we cannot guarantee authorization from client-side data,
    // we show "—" with explanation. In a later phase, a dedicated
    // mentor-students API should be implemented.
    totalStudents = '—';
  }

  // 2. Tasks Assigned: count mentor-created tasks.
  //    A task is "mentor-created" if source === 'mentor' and createdBy === user.id.
  if (!tasksLoading && !tasksError && tasksRes) {
    const tasks = Array.isArray(tasksRes) ? tasksRes : [];
    const mentorId = user?.id;
    if (mentorId) {
      const mentorTasks = tasks.filter(
        (t) =>
          t &&
          t.source === 'mentor' &&
          t.createdBy &&
          String(t.createdBy) === String(mentorId)
      );
      tasksAssigned = String(mentorTasks.length);
    }
  }

  // 3. Pending Reviews: unavailable until mentor-submissions API exists.

  // 4. Completed Tasks: count completed tasks created by the mentor.
    if (!tasksLoading && !tasksError && tasksRes) {
      const tasks = Array.isArray(tasksRes) ? tasksRes : [];
      const mentorId = user?.id;
      if (mentorId) {
        const completed = tasks.filter(
          (t) =>
            t &&
            t.status === 'completed' &&
            t.source === 'mentor' &&
            t.createdBy &&
            String(t.createdBy) === String(mentorId)
        );
        completedTasks = String(completed.length);
      }
    }

  // --- Error handling ---
  if (statsError) {
    return <div style={{ padding: '2rem' }}>Error loading dashboard statistics.</div>;
  }

  if (statsLoading) {
    return <div style={{ padding: '2rem' }}>Loading dashboard statistics...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Welcome section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>Welcome</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Mentor Portal — Dashboard
        </p>
      </div>

      {/* Statistic cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', maxWidth: '1200px' }}>
        {/* Card 1: Total Students */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #2d2a45',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#a78bfa', marginBottom: '0.25rem' }}>
            {totalStudents}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Total Students
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Data unavailable until mentor-students API is implemented.
          </div>
        </div>

        {/* Card 2: Tasks Assigned */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #2d2a45',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#a78bfa', marginBottom: '0.25rem' }}>
            {tasksAssigned}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Tasks Assigned
          </div>
        </div>

        {/* Card 3: Pending Reviews */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #2d2a45',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#a78bfa', marginBottom: '0.25rem' }}>
            {pendingReviews}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Pending Reviews
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Unavailable until mentor-submissions API is implemented.
          </div>
        </div>

        {/* Card 4: Completed Tasks */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #2d2a45',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#a78bfa', marginBottom: '0.25rem' }}>
            {completedTasks}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Completed Tasks
          </div>
        </div>
      </div>

      {/* Overview area with navigation links */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#0f172a', borderRadius: '0.5rem' }}>
        <h2 style={{ color: '#7c3aed', marginBottom: '0.75rem' }}>Quick Navigation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <a
            style={{
              background: '#1e1b2e',
              border: '1px solid #2d2a45',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: '#e2e8f0',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#16132a')}
            onMouseLeave={(e) => (e.target.style.background = '#1e1b2e')}
            href="/mentor-portal/tasks"
            target="_self"
            rel="noopener noreferrer"
          >
            Tasks
          </a>
          <a
            style={{
              background: '#1e1b2e',
              border: '1px solid #2d2a45',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: '#e2e8f0',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#16132a')}
            onMouseLeave={(e) => (e.target.style.background = '#1e1b2e')}
            href="/mentor-portal/students"
            target="_self"
            rel="noopener noreferrer"
          >
            Students
          </a>
          <a
            style={{
              background: '#1e1b2e',
              border: '1px solid #2d2a45',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: '#e2e8f0',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#16132a')}
            onMouseLeave={(e) => (e.target.style.background = '#1e1b2e')}
            href="/mentor-portal/submissions"
            target="_self"
            rel="noopener noreferrer"
          >
            Submissions
          </a>
        </div>
      </div>
    </div>
  );
}