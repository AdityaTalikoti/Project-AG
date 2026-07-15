import React from 'react';
import { Sparkles, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Widgets({
  upcomingTasks = [],
  aiInsight,
  isLoading,
  insightLoading,
  insightError
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-[#0a0e1a] rounded-2xl animate-pulse border border-[#121829]" />
        <div className="h-48 bg-[#0a0e1a] rounded-2xl animate-pulse border border-[#121829]" />
      </div>
    );
  }

  // Helper for priority color mapping
  const getPriorityColor = (priority, status) => {
    if (status === 'current') return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    if (priority === 'high') return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
    if (priority === 'medium') return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
    return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]';
  };

  const displaySummary = (insightError || !aiInsight || !aiInsight.summary)
    ? "Welcome back! Continue working toward your current goals. I'll generate personalized insights as more activity becomes available."
    : aiInsight.summary;

  return (
    <div className="space-y-6">
      {/* AI Insight Card */}
      <div className="bg-gradient-to-br from-[#1c122e] to-[#0a0e1a] p-5 rounded-2xl border border-purple-900/30 shadow-lg relative overflow-hidden flex justify-between items-center gap-4">
        {/* Glow effect */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex-1 space-y-3 z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={16} />
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">AI Insight</h3>
            {insightLoading ? (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide animate-pulse">
                Thinking...
              </span>
            ) : (insightError || !aiInsight || !aiInsight.summary) ? (
              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide animate-pulse">
                Fallback
              </span>
            ) : aiInsight?.cached ? (
              <span className="text-[9px] bg-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">
                Cached
              </span>
            ) : (
              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">
                New
              </span>
            )}
          </div>

          {insightLoading ? (
            <div className="space-y-2 animate-pulse w-full max-w-[200px] py-1">
              <div className="h-2.5 bg-purple-500/20 rounded w-11/12" />
              <div className="h-2.5 bg-purple-500/20 rounded w-full" />
              <div className="h-2.5 bg-purple-500/20 rounded w-4/5" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-gray-300 text-xs leading-relaxed max-w-[200px]">
                {displaySummary}
              </p>
              {aiInsight?.generatedAt && !insightError && (
                <p className="text-[9px] text-gray-500 font-medium">
                  As of: {new Date(aiInsight.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          )}

          <div className="pt-1">
            <Link 
              to="/dashboard/mentor"
              className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition flex items-center gap-0.5 cursor-pointer"
            >
              Open AI Mentor <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* Glowing Brain Graphic */}
        <div className="text-purple-500/30 z-10 flex-shrink-0 animate-pulse">
          <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v12" />
            <path d="M8 10a4 4 0 0 1 8 0" />
            <path d="M8 14a4 4 0 0 1 8 0" />
            <path d="M7 12h10" />
          </svg>
        </div>
      </div>
    </div>
  );
}
