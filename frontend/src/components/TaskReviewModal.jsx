import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, FileText, Image as ImageIcon, ExternalLink, Loader } from 'lucide-react';

export default function TaskReviewModal({ 
  isOpen, 
  onClose, 
  task,
  submissions,
  onApprove, 
  onReject,
  isLoading,
  validationError 
}) {
  const [feedback, setFeedback] = useState('');

  if (!isOpen || !task || !submissions || submissions.length === 0) return null;

  const latestSubmission = submissions[0]; // Submissions are sorted by attemptNumber desc

  const handleApprove = () => {
    onApprove(latestSubmission._id, feedback);
  };

  const handleReject = () => {
    onReject(latestSubmission._id, feedback);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Review Submission</h3>
            <p className="text-xs text-gray-500 mt-0.5">Attempt #{latestSubmission.attemptNumber}</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-500 hover:text-white p-1 hover:bg-gray-900 rounded-lg transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
              ⚠️ {validationError}
            </div>
          )}

          {/* Task Info */}
          <div className="bg-[#0d1222] border border-[#161d31] rounded-xl p-4">
            <h4 className="text-sm font-bold text-white mb-2">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-gray-400">{task.description}</p>
            )}
          </div>

          {/* Submission Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-semibold">Submitted by:</span>
              <span className="text-white">{latestSubmission.submittedBy?.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-semibold">Submitted at:</span>
              <span className="text-white">{formatDate(latestSubmission.createdAt)}</span>
            </div>
          </div>

          {/* Uploaded Files */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-semibold">Uploaded Files</label>
            <div className="space-y-2">
              {latestSubmission.files.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[#111625] rounded-lg border border-gray-800 hover:border-emerald-500/50 transition group"
                >
                  {file.mimeType.startsWith('image/') ? (
                    <ImageIcon size={20} className="text-blue-400" />
                  ) : (
                    <FileText size={20} className="text-red-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate group-hover:text-emerald-400 transition">
                      {file.originalName}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <ExternalLink size={14} className="text-gray-500 group-hover:text-emerald-400 transition" />
                </a>
              ))}
            </div>
          </div>

          {/* Student Note */}
          {latestSubmission.note && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold">Student Note</label>
              <div className="p-3 bg-[#111625] rounded-lg border border-gray-800">
                <p className="text-xs text-gray-300 leading-relaxed">{latestSubmission.note}</p>
              </div>
            </div>
          )}

          {/* Feedback Input */}
          <div className="space-y-1">
            <label htmlFor="review-feedback" className="text-xs text-gray-400 font-semibold">
              Feedback {latestSubmission.status === 'pending_review' && <span className="text-red-400">*</span>}
            </label>
            <textarea
              id="review-feedback"
              rows={4}
              placeholder="Provide feedback to the student..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={latestSubmission.status !== 'pending_review'}
              className="w-full bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none disabled:opacity-50"
            />
          </div>

          {/* Previous Submissions */}
          {submissions.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-gray-900">
              <label className="text-xs text-gray-400 font-semibold">Previous Attempts ({submissions.length - 1})</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {submissions.slice(1).map((sub) => (
                  <div key={sub._id} className="p-2 bg-[#0d1222] rounded-lg border border-[#161d31] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400">Attempt #{sub.attemptNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sub.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {sub.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                    {sub.mentorFeedback && (
                      <p className="text-gray-500 text-[10px] italic">"{sub.mentorFeedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {latestSubmission.status === 'pending_review' ? (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={isLoading || !feedback.trim()}
                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold rounded-xl text-xs hover:bg-red-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ThumbsDown size={14} />
                    Reject
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl text-xs transition shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ThumbsUp size={14} />
                    Approve
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-3 text-xs text-gray-500">
              This submission has already been reviewed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
