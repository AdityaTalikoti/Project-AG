/**
 * Mentor Tasks Page — Phase 2 placeholder.
 *
 * Displays a suitable page heading and a short placeholder message.
 * Renders inside MentorLayout via Outlet.
 */
export default function MentorTasksPage() {
  return (
    <div
      style={{
        minHeight: '400px',
        background: '#0f172a',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <h1 style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>Tasks</h1>
      <p style={{ color: '#6b7280' }}>Task assignment and management will be implemented in a later phase.</p>
    </div>
  );
}