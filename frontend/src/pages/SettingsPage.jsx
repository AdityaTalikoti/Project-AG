import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  ShieldCheck, 
  Trash2, 
  LogOut, 
  Globe, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  Laptop
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';

export default function SettingsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [revokingId, setRevokingId] = useState(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const dispatch = useDispatch();

  // Helper to fetch anti-CSRF token cookie
  const getCsrfToken = async () => {
    try {
      const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]*)/);
      if (match) return decodeURIComponent(match[1]);
      
      const res = await fetch('/api/auth/csrf-token', { credentials: 'include' });
      const data = await res.json();
      return data.csrfToken;
    } catch {
      return '';
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/sessions', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load active sessions');
      }

      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId, isCurrent) => {
    if (!window.confirm(isCurrent ? 'Revoking your current session will log you out. Continue?' : 'Are you sure you want to revoke this session?')) {
      return;
    }

    setRevokingId(sessionId);
    setActionSuccess('');
    setError(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to revoke session');
      }

      if (isCurrent) {
        dispatch(logoutUser());
        return;
      }

      setActionSuccess('Session revoked successfully');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      setError(err.message);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to revoke all other active sessions across all devices?')) {
      return;
    }

    setRevokingOthers(true);
    setActionSuccess('');
    setError(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch('/api/auth/sessions/revoke-others', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to revoke other sessions');
      }

      setActionSuccess('All other sessions revoked successfully');
      setSessions(prev => prev.filter(s => s.isCurrent));
    } catch (err) {
      setError(err.message);
    } finally {
      setRevokingOthers(false);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-purple-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-400" />;
      default:
        return <Laptop className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6 text-gray-100">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-purple-400" />
            Account Security & Active Sessions
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your logged-in devices and revoke unrecognized active sessions.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-xs font-semibold text-gray-300 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main sessions section */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Active Logged-in Devices ({sessions.length})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              These devices currently have valid server-side session cookies attached to your account.
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={handleRevokeOtherSessions}
              disabled={revokingOthers}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition shadow-sm hover:shadow-red-950/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {revokingOthers ? 'Revoking Others...' : 'Revoke All Other Sessions'}
            </button>
          )}
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="py-12 flex justify-center items-center text-gray-400 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
            <span className="text-sm">Fetching active session security metadata...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            No active sessions found.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  session.isCurrent
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-950/10'
                    : 'bg-gray-800/40 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-gray-800 border border-gray-700/60 shrink-0">
                    {getDeviceIcon(session.deviceType)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">
                        {session.deviceDisplay || 'Unknown Device'}
                      </span>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                          Current Session
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-gray-500" />
                        IP: {session.ipAddress}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        Last Active: {new Date(session.lastActivityAt || session.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleRevokeSession(session.id, session.isCurrent)}
                    disabled={revokingId === session.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                      session.isCurrent
                        ? 'bg-gray-800 hover:bg-red-500/10 border-gray-700 text-gray-300 hover:text-red-400 hover:border-red-500/30'
                        : 'bg-gray-800/80 hover:bg-red-500/15 border-gray-700 text-gray-300 hover:text-red-400 hover:border-red-500/40'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {revokingId === session.id
                      ? 'Revoking...'
                      : session.isCurrent
                      ? 'Revoke & Logout'
                      : 'Revoke Session'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
