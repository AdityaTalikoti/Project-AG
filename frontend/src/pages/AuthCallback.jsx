import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      fetch(`${API_BASE}/api/auth/set-cookie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to set cookie');
        })
        .then((data) => {
          if (data.success && data.user) {
            dispatch(setCredentials(data.user));
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/auth?error=auth_failed', { replace: true });
          }
        })
        .catch((err) => {
          console.error('Error during token callback cookie setting:', err);
          navigate('/auth?error=auth_failed', { replace: true });
        });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [searchParams, navigate, dispatch]);

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
