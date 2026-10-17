import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Guards routes that require an authenticated Mentor session.
 *
 * Behaviour:
 *  - While the session is being verified (loading === true), show a spinner
 *    so the user is never incorrectly redirected on a hard refresh.
 *  - Unauthenticated users → /auth
 *  - Authenticated users whose role is NOT 'Mentor' → /dashboard
 *  - Authenticated Mentors → render children
 *
 * Security note: this is a UX guard only. All sensitive operations are
 * enforced server-side via authMiddleware + role checks.
 */
export default function MentorProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Wait for the session cookie to be verified before deciding.
  // This prevents a flash-redirect to /auth on page refresh.
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e1b2e',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(124,58,237,0.2)',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin .6s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Not logged in at all
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Logged in but not a Mentor — send back to student dashboard
  if (user?.role !== 'Mentor') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
