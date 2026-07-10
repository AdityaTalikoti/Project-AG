import React from 'react';
import { Sparkles, ChevronRight, Clock } from 'lucide-react';

export default function Widgets({ upcomingTasks = [], aiInsight, isLoading }) {
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
            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">New</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed max-w-[200px]">
            {aiInsight || "You've been consistent with Trees. Next logical step is Graphs. Try implementing BFS today."}
          </p>
          <button className="text-[10px] text-purple-400 font-bold hover:text-purple-300 transition flex items-center gap-0.5 cursor-pointer pt-1">
            Explore Graphs Roadmap <ChevronRight size={12} />
          </button>
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

      {/* Upcoming Tasks Card */}
      <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Tasks</h3>
          <button className="text-[10px] text-gray-500 font-semibold hover:text-emerald-400 transition cursor-pointer">
            View All →
          </button>
        </div>
        
        <div className="space-y-3.5">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority, task.status)}`} />
                <span className={`font-medium truncate ${task.status === 'current' ? 'text-white' : 'text-gray-400'}`}>
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono font-medium ml-2 bg-gray-900 border border-gray-800/80 px-2 py-0.5 rounded-md flex-shrink-0">
                <Clock size={10} />
                <span>{task.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
