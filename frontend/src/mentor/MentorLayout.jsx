import { Outlet, Link, useLocation } from 'react-router-dom';

/**
 * Phase 1 placeholder — full layout (sidebar, topbar, purple theme) is built in Phase 2.
 * This shell exists only to satisfy valid imports and working routes.
 */
export default function MentorLayout() {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: '#1e1b2e', color: '#e2e8f0', fontFamily: 'inherit' }}>
      {/* Minimal nav — replaced by full sidebar in Phase 2 */}
      <nav style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 1.5rem',
        background: '#16132a',
        borderBottom: '1px solid #2d2a45',
        fontSize: '0.875rem',
      }}>
        <Link to="/mentor-portal" style={{ color: location.pathname === '/mentor-portal' ? '#a78bfa' : '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/mentor-portal/tasks" style={{ color: location.pathname === '/mentor-portal/tasks' ? '#a78bfa' : '#94a3b8', textDecoration: 'none' }}>Tasks</Link>
        <Link to="/mentor-portal/students" style={{ color: location.pathname === '/mentor-portal/students' ? '#a78bfa' : '#94a3b8', textDecoration: 'none' }}>Students</Link>
        <Link to="/mentor-portal/submissions" style={{ color: location.pathname === '/mentor-portal/submissions' ? '#a78bfa' : '#94a3b8', textDecoration: 'none' }}>Submissions</Link>
      </nav>
      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
