/**
 * Mentor Students Page — Phase 2 placeholder.
 *
 * Displays a suitable page heading and a short placeholder message.
 * Renders inside MentorLayout via Outlet.
 */
export default function MentorStudentsPage() {
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
      <h1 style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>Students</h1>
      <p style={{ color: '#6b7280' }}>Student roster and management will be implemented in a later phase.</p>
    </div>
  );
}