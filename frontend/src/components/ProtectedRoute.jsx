import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Wraps routes that require authentication.
 * Shows a loading spinner while auth state is being determined,
 * redirects to /auth if not authenticated.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e1a',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin .6s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
