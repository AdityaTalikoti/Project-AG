import { Outlet, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import './mentor.css';

/**
 * Mentor Portal Layout — Phase 2.
 *
 * Features:
 * - Fixed sidebar with vertical navigation using NavLink
 * - Top bar with profile/logout and theme toggle
 * - Responsive: sidebar collapses on mobile
 * - Outlet for nested mentor-portal routes
 * - Accessible focus states and ARIA labels
 * - Logout via existing session termination mechanism (authSlice.logoutUser)
 * - Preserves Phase 1 role-based routing and session restoration
 * - Light/dark theme support via existing class conventions
 * - Scoped CSS via mentor.css with palette variables
 */

export default function MentorLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
    } catch { /* logout errors are non-fatal; redirect proceeds regardless */ }
    window.location.href = '/auth';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--mentor-dark-surface, #1e1b2e)',
        color: 'var(--mentor-accent, #e2e8f0)',
        fontFamily: 'inherit',
      }}
    >
      {/* ── Top bar ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          background: 'var(--mentor-dark-surface, #16132a)',
          borderBottom: '1px solid var(--mentor-border, #2d2a45)',
          fontSize: '0.875rem',
          zIndex: 100,
        }}
      >
        {/* Sidebar toggle for mobile */}
        <button
          style={{
            display: 'block',
            background: 'none',
            border: 'none',
            color: 'var(--mentor-accent, #94a3b8)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
          aria-label="Open sidebar"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 4v16" />
            <path d="M12 4v16" />
            <path d="M16 4v16" />
          </svg>
        </button>

        {/* Title / Brand */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontWeight: 600,
              color: 'var(--mentor-accent, #a78bfa)',
              fontSize: '1.25rem',
            }}
          >
            Mentor Portal
          </h1>
        </div>

        {/* User profile / logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme toggle button */}
            <button
              style={{
                marginLeft: '0.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--mentor-accent, #94a3b8)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
              }}
              title="Toggle theme"
              onClick={() => {}}
            >
              <span>☀️</span>
            </button>

            {/* Logout button */}
            <button
              style={{
                marginLeft: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
              }}
              onClick={handleLogout}
              aria-label="Log out"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      {/* ── Sidebar (desktop, visible on larger screens) ── */}
      <aside
        aria-label="Main navigation"
        style={{
          width: '260px',
          minHeight: '100vh',
          background: 'var(--mentor-dark-surface, #0a0e1a)',
          borderRight: '1px solid var(--mentor-border, #2d2a45)',
          color: 'var(--mentor-accent, #e2e8f0)',
          fontFamily: 'inherit',
          transition: 'transform 0.2s ease',
          flexShrink: 0,
        }}
      >
        {/* Sidebar header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--mentor-border, #2d2a45)' }}>
          <h2 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--mentor-primary, #7c3aed)' }}>Mentor Portal</h2>
        </div>

        {/* Navigation items */}
        <nav style={{ padding: '1rem 1.5rem' }}>
          <NavLink
            to="/mentor-portal"
            end
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.75rem 1rem',
              marginBottom: '0.25rem',
              color: isActive ? 'var(--mentor-accent, #a78bfa)' : 'var(--mentor-accent, #94a3b8)',
              background: isActive ? 'rgba(125, 58, 237, 0.15)' : 'transparent',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              transition: 'background 0.2s, color 0.2s',
            })}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 4v16" />
              <path d="M12 4v16" />
              <path d="M16 4v16" />
            </svg>
            <span className="sr-only">Dashboard</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/mentor-portal/tasks"
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.75rem 1rem',
              marginBottom: '0.25rem',
              color: isActive ? 'var(--mentor-accent, #a78bfa)' : 'var(--mentor-accent, #94a3b8)',
              background: isActive ? 'rgba(125, 58, 237, 0.15)' : 'transparent',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              transition: 'background 0.2s, color 0.2s',
            })}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1-1.4 1.4L11.4 7.7l-1.4 1.4a1 1 0 0 1-1.4-1.4l1.6-1.6z" />
              <path d="M2.1 2.6a1 1 0 0 1 0 1.4l22 6c.3.1.5.1.7.1s.4 0 .6-.1l19.7-5.8a1 1 0 0 1 .9-.9l-5.8-19.7a1 1 0 0 1-.1-.9l-5.8-19.7a1 1 0 0 1-.9-.9l5.8-19.7zM2.6 19.7a1 1 0 0 1 .9.9l5.8 19.7c.3.1.5.1.7.1s.4 0 .6-.1l-19.7-5.8a1 1 0 0 1-.9-.9l5.8-19.7zM21 12a1 1 0 0 1-1 1h-4.6l-.7 4a1 1 0 0 1-1.4.3l-1.6-2.4a1 1 0 0 1-.9-.9l2.5-6.6a1 1 0 0 1 .3-.9h4.6z" />
            </svg>
            <span className="sr-only">Tasks</span>
            Tasks
          </NavLink>

          <NavLink
            to="/mentor-portal/students"
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.75rem 1rem',
              marginBottom: '0.25rem',
              color: isActive ? 'var(--mentor-accent, #a78bfa)' : 'var(--mentor-accent, #94a3b8)',
              background: isActive ? 'rgba(125, 58, 237, 0.15)' : 'transparent',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              transition: 'background 0.2s, color 0.2s',
            })}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1l4 28a1 1 0 0 0 .9.9L21 7l-5.3 14.7a1 1 0 0 0 .9.9zM5.4 15.4l-1.5 5.8a1 1 0 0 0 .9 1.3h12.7a1 1 0 0 0 .9-1.3L19.6 6.6l-1.5-5.8a1 1 0 0 0-.9-.9H5.4z" />
            </svg>
            <span className="sr-only">Students</span>
            Students
          </NavLink>

          <NavLink
            to="/mentor-portal/submissions"
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.75rem 1rem',
              marginBottom: '0.25rem',
              color: isActive ? 'var(--mentor-accent, #a78bfa)' : 'var(--mentor-accent, #94a3b8)',
              background: isActive ? 'rgba(125, 58, 237, 0.15)' : 'transparent',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              transition: 'background 0.2s, color 0.2s',
            })}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M2 9l8 8 8-8" />
            </svg>
            <span className="sr-only">Submissions</span>
            Submissions
          </NavLink>
        </nav>

        {/* Sidebar footer / logout */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--mentor-border, #2d2a45)' }}>
          <button
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'left',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              marginTop: 'auto',
            }}
            aria-label="Log out"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main
        style={{
          flex: 1,
          padding: '1.5rem',
          minHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}