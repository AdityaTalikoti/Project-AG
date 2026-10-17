import { useState } from 'react';
import {
  useGetMentorSubmissionsQuery,
  useReviewSubmissionMutation,
} from '../store/apiSlice';

/**
 * Mentor Submissions Page — Phase 5.
 *
 * Displays pending-review submissions for the authenticated mentor's own tasks,
 * with Approve and Request Revision actions according to the existing backend contract
 * (PATCH /api/tasks/submissions/:submissionId/review).
 *
 * Security notes:
 * - The backend scopes /api/tasks/mentor/submissions to the authenticated mentor's
 *   source: 'mentor' tasks and only allows the task creator to review; the client
 *   never asserts ownership.
 * - Only attachment URLs stored by the server (s.files[*].url) are rendered; no
 *   client-provided attachment locations are ever trusted.
 */

const STATUS_LABELS = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_COLORS = {
  pending_review: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
};

const initialsFor = (name) => {
  if (!name) return '—';
  return String(name)
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || '—';
};

export default function MentorSubmissionsPage() {
  // Fetch pending-review submissions for the mentor's own tasks (server-authorized)
  const {
    data: submissionsRes,
    isLoading: submissionsLoading,
    isError: submissionsError,
  } = useGetMentorSubmissionsQuery();

  // Review submission mutation: PATCH /api/tasks/submissions/:submissionId/review
  const [reviewSubmission, { isPending: reviewPending }] = useReviewSubmissionMutation();

  // API wraps responses as { success, count, data: [...] }
  const submissions = Array.isArray(submissionsRes?.data) ? submissionsRes.data : [];

  // Transient success/error banner (set from mutation outcomes in event handlers)
  const [message, setMessage] = useState(null);
  // Revision-request dialog state (feedback required by backend for action 'reject')
  const [revision, setRevision] = useState({ submissionId: null, feedback: '' });

  // While any review mutation is in flight, all review actions are disabled:
  // prevents duplicate submissions for the same or other submissions.
  const isReviewing = reviewPending;

  const handleApprove = async (submissionId) => {
    setMessage(null);
    try {
      const result = await reviewSubmission({ submissionId, action: 'approve' }).unwrap();
      setMessage({ type: 'success', text: result.message || 'Submission approved successfully' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.data?.message || 'Review failed. Please try again.',
      });
    }
  };

  const handleRequestRevision = (submissionId) => {
    setMessage(null);
    setRevision({ submissionId, feedback: '' });
  };

  const handleConfirmRevision = async () => {
    if (!revision.feedback || !revision.feedback.trim()) {
      setMessage({ type: 'error', text: 'Feedback is required when requesting a revision.' });
      return;
    }
    setMessage(null);
    try {
      const result = await reviewSubmission({
        submissionId: revision.submissionId,
        action: 'reject',
        feedback: revision.feedback.trim(),
      }).unwrap();
      setMessage({
        type: 'success',
        text: result.message || 'Revision requested successfully',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.data?.message || 'Review failed. Please try again.',
      });
    } finally {
      setRevision({ submissionId: null, feedback: '' });
    }
  };

  // --- Error state ---
  if (submissionsError) {
    return (
      <div style={{ padding: '2rem', color: '#f87171' }}>
        Error loading submissions. Please try again later.
      </div>
    );
  }

  // --- Loading state ---
  if (submissionsLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading submissions…
      </div>
    );
  }

  // --- Empty state ---
  if (!submissions || submissions.length === 0) {
    return (
      <div
        style={{
          minHeight: '400px',
          background: '#0f172a',
          color: '#6b7280',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <h1 style={{ color: '#a78bfa', margin: 0 }}>Submissions</h1>
        <p style={{ margin: 0 }}>No pending submissions found.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '600px',
        background: '#0f172a',
        color: '#e2e8f0',
        padding: '1.5rem',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <h1 style={{ color: '#a78bfa', marginBottom: '1rem' }}>Submission Review</h1>

      {/* Transient outcome banner */}
      {message && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid',
            background: message.type === 'success' ? '#052e16' : '#7f1d1d',
            color: message.type === 'success' ? '#10b981' : '#f87171',
            fontSize: '0.875rem',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Revision-request dialog (feedback required by backend before action 'reject') */}
      {revision.submissionId && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            borderRadius: '0.5rem',
            background: '#16132a',
            border: '1px solid #33314d',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontWeight: 600, color: '#a78bfa' }}>Request Revision</div>
          <label style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
            Mentor feedback (required)
          </label>
          <textarea
            value={revision.feedback}
            onChange={(e) => setRevision({ ...revision, feedback: e.target.value })}
            style={{
              width: '100%',
              minHeight: '80px',
              background: '#0f172a',
              border: '1px solid #33314d',
              borderRadius: '0.375rem',
              color: '#e2e8f0',
              padding: '0.5rem',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setRevision({ submissionId: null, feedback: '' })}
              style={{
                background: 'none',
                border: '1px solid #64748b',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.75rem',
                color: '#94a3b8',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isReviewing}
              onClick={handleConfirmRevision}
              style={{
                background: '#f59e0b',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.75rem',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isReviewing ? 'not-allowed' : 'pointer',
                opacity: isReviewing ? 0.6 : 1,
              }}
            >
              {isReviewing ? 'Reviewing…' : 'Confirm Request Revision'}
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#8884d8', fontSize: '0.75rem', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem 1rem' }}>Student</th>
              <th style={{ padding: '0.5rem 1rem' }}>Task</th>
              <th style={{ padding: '0.5rem 1rem' }}>Attempt</th>
              <th style={{ padding: '0.5rem 1rem' }}>Submitted</th>
              <th style={{ padding: '0.5rem 1rem' }}>Status</th>
              <th style={{ padding: '0.5rem 1rem' }}>Attachments</th>
              <th style={{ padding: '0.5rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const submittedBy = s?.submittedBy || {};
              const task = s?.task || {};
              const files = Array.isArray(s.files) ? s.files : [];
              const statusLabel = STATUS_LABELS[s.status] || s.status || '—';
              const statusColor = STATUS_COLORS[s.status] || '#94a3b8';
              const name = submittedBy.name || '—';
              const avatarUrl = submittedBy.picture || null;

              return (
                <tr key={s._id} style={{ background: '#16132a', fontSize: '0.75rem' }}>
                  <td style={{ padding: '0.5rem 1rem', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          width="24"
                          height="24"
                          style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#33314d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: '#a78bfa',
                          }}
                        >
                          {initialsFor(name)}
                        </div>
                      )}
                      <span style={{ fontSize: '0.85rem' }}>{name}</span>
                    </div>
                    {s.note && (
                      <div
                        style={{
                          marginTop: '0.25rem',
                          fontSize: '0.7rem',
                          color: '#94a3b8',
                        }}
                      >
                        “{s.note}”
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.5rem 1rem', verticalAlign: 'top' }}>{task.title || '—'}</td>
                  <td style={{ padding: '0.5rem 1rem', verticalAlign: 'top' }}>{s.attemptNumber ?? '—'}</td>
                  <td style={{ padding: '0.5rem 1rem', verticalAlign: 'top' }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.5rem 1rem', verticalAlign: 'top' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '0.25rem',
                        background: `${statusColor}1a`,
                        color: statusColor,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 1rem', verticalAlign: 'top' }}>
                    {files.length === 0 ? (
                      <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>—</span>
                    ) : (
                      files.map((f, i) => (
                        <div key={i} style={{ marginBottom: '0.2rem' }}>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#818cf8',
                              textDecoration: 'underline',
                              fontSize: '0.75rem',
                            }}
                          >
                            {f.originalName || 'attachment'}
                          </a>
                          <span
                            style={{
                              marginLeft: '0.4rem',
                              fontSize: '0.65rem',
                              color: '#64748b',
                            }}
                          >
                            ({(f.size / 1024).toFixed(1)} KB · {f.mimeType})
                          </span>
                        </div>
                      ))
                    )}
                  </td>
                  <td style={{ padding: '0.5rem 1rem', verticalAlign: 'top' }}>
                    {s.status !== 'pending_review' ? (
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Already reviewed</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleApprove(s._id)}
                          style={{
                            background: 'none',
                            border: '1px solid #10b981',
                            borderRadius: '0.375rem',
                            padding: '0.2rem 0.6rem',
                            color: '#10b981',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: isReviewing ? 'not-allowed' : 'pointer',
                            opacity: isReviewing ? 0.6 : 1,
                            marginRight: '0.3rem',
                          }}
                        >
                          {isReviewing ? 'Reviewing…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={() => handleRequestRevision(s._id)}
                          style={{
                            background: 'none',
                            border: '1px solid #f59e0b',
                            borderRadius: '0.375rem',
                            padding: '0.2rem 0.6rem',
                            color: '#f59e0b',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: isReviewing ? 'not-allowed' : 'pointer',
                            opacity: isReviewing ? 0.6 : 1,
                          }}
                        >
                          Request Revision
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
