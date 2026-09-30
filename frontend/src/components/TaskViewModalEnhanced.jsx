import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, User, Send, Eye, Timer, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useGetTaskSubmissionsQuery } from '../store/apiSlice';

export default function TaskViewModalEnhanced({ 
  isOpen, 
  onClose, 
  task, 
  user,
  onSubmit,
  onReview,
  getPriorityColor 
}) {
  const [remainingTime, setRemainingTime] = useState('');
  const { data: submissionsResponse } = useGetTaskSubmissionsQuery(task?._id, {
    skip: !task?._id || !isOpen,
  });

  const submissions = submissionsResponse?.data || [];
  const latestSubmission = submissions[0];

  useEffect(() => {
    if (!task?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(task.expiresAt);
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setRemainingTime('expired');
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setRemainingTime(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setRemainingTime(`${hours}h ${minutes}m remaining`);
      } else {
        setRemainingTime(`${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [task?.expiresAt]);

  if (!isOpen || !task) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', label: 'Pending' },
      submitted: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Awaiting Review' },
      needs_revision: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Needs Revision' },
      completed: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Completed' },
      expired: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Time Expired' },
    };
    return badges[status] || badges.pending;
  };

  const statusBadge = getStatusBadge(task.status);
  const isExpired = remainingTime === 'expired' || task.status === 'expired';
  const isMentor = user?.role === 'Mentor';
  const isAssignedStudent = task.assignedTo?._id === user?._id;
  const isCreator = task.createdBy?._id === user?._id;

  const canSubmit = task.source === 'mentor' && 
                    isAssignedStudent && 
                    !isExpired && 
                    (task.status === 'pending' || task.status === 'needs_revision');

  const canReview = isMentor && 
                    isCreator && 
                    task.status === 'submitted' && 
                    submissions.length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-[#0b0e17] border border-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-900 bg-[#0a0e1a] sticky top-0 z-10">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Task Details</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-500 hover:text-white p-1 hover:bg-gray-900 rounded-lg transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title & Description */}
          <div>
            <h4 className="text-lg font-bold text-white mb-2">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
            )}
          </div>

          {/* Time Limit Warning */}
          {task.expiresAt && (
            <div className={`flex items-center gap-2 p-3 rounded-xl border ${
              isExpired 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : remainingTime.includes('h') && !remainingTime.includes('d')
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <Timer size={16} />
              <span className="text-xs font-semibold">
                {isExpired ? '⚠️ Time Expired - Submission Unavailable' : `⏱ ${remainingTime}`}
              </span>
            </div>
          )}

          {/* Status & Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Status:</span>
                <span className={`px-2 py-1 rounded-lg border font-semibold ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-semibold">Priority:</span>
                <span className={`px-2 py-1 rounded-lg border font-semibold ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {task.dueDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Due Date:</span>
                  <span className="text-gray-300">{formatDate(task.dueDate)}</span>
                </div>
              )}

              {task.source === 'mentor' && task.createdBy && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Assigned by:</span>
                  <span className="text-gray-300">{task.createdBy.name || 'Mentor'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submission History */}
          {submissions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-900">
              <label className="text-xs text-gray-400 font-semibold flex items-center gap-2">
                <Eye size={12} />
                Submission History ({submissions.length} attempt{submissions.length > 1 ? 's' : ''})
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {submissions.map((sub) => (
                  <div key={sub._id} className="p-3 bg-[#0d1222] rounded-lg border border-[#161d31]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-semibold">Attempt #{sub.attemptNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        sub.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : sub.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {sub.status === 'approved' && <CheckCircle size={10} />}
                        {sub.status === 'rejected' && <XCircle size={10} />}
                        {sub.status === 'pending_review' && <Clock size={10} />}
                        {sub.status === 'approved' ? 'Approved' : sub.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                      </span>
                    </div>
                    {sub.note && (
                      <p className="text-xs text-gray-500 mb-2 italic">"{sub.note}"</p>
                    )}
                    {sub.mentorFeedback && (
                      <div className="mt-2 p-2 bg-[#111625] rounded border border-gray-800">
                        <p className="text-[10px] text-gray-400 font-semibold mb-1">Mentor Feedback:</p>
                        <p className="text-xs text-gray-300">{sub.mentorFeedback}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-600 mt-2">
                      Submitted {new Date(sub.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback from Latest Rejected Submission */}
          {task.status === 'needs_revision' && latestSubmission?.mentorFeedback && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">Mentor Feedback</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{latestSubmission.mentorFeedback}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {canSubmit && (
              <button
                onClick={() => onSubmit(task)}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {task.status === 'needs_revision' ? 'Resubmit Task' : 'Submit Task'}
              </button>
            )}

            {canReview && (
              <button
                onClick={() => onReview(task, latestSubmission)}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye size={14} />
                Review Submission
              </button>
            )}

            {!canSubmit && !canReview && (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 font-semibold rounded-xl text-xs hover:bg-gray-800 transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
