import React from 'react';
import { Check, Lock, ChevronRight } from 'lucide-react';

export default function RoadmapStepper({ roadmap = [], isLoading }) {
  if (isLoading) {
    return <div className="bg-[#0a0e1a] p-6 rounded-2xl h-44 animate-pulse border border-[#121829]" />;
  }

  return (
    <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Your Roadmap</h3>
        <button className="text-[10px] text-gray-500 font-semibold hover:text-emerald-400 transition flex items-center gap-0.5 cursor-pointer">
          View Full Roadmap <ChevronRight size={12} />
        </button>
      </div>

      {roadmap.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl">
          No active goal roadmap found. Create a goal to start tracking milestones!
        </div>
      ) : (
        <div className="relative flex items-center justify-between overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {roadmap.map((mil, idx) => {
            const status = mil.status; // 'completed', 'current', 'upcoming'
            const isLast = idx === roadmap.length - 1;

            return (
              <div key={mil.id || mil.title} className="flex items-center flex-1 min-w-[120px] relative">
                {/* Connector Line */}
                {!isLast && (
                  <div className={`absolute top-5 left-10 right-0 h-0.5 z-0 ${status === 'completed' ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                )}

                {/* Step Node */}
                <div className="flex flex-col items-center z-10 w-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 relative ${
                    status === 'completed' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                      : status === 'current'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                      : 'bg-[#111625] border-[#1b2237] text-gray-600'
                  }`}>
                    {status === 'completed' && <Check size={18} strokeWidth={3} />}
                    {status === 'current' && <span className="text-[9px] font-bold font-mono">Active</span>}
                    {status === 'upcoming' && <Lock size={14} />}
                  </div>

                  <span className={`text-[10px] font-semibold mt-3 text-center truncate px-2 w-full ${
                    status === 'completed' ? 'text-gray-300' : status === 'current' ? 'text-amber-500' : 'text-gray-500'
                  }`} title={mil.title}>
                    {mil.title}
                  </span>

                  <span className={`text-[8px] font-bold uppercase mt-0.5 ${
                    status === 'completed' ? 'text-emerald-500/80' : status === 'current' ? 'text-amber-500' : 'text-gray-600'
                  }`}>
                    {status === 'completed' ? 'Completed' : status === 'current' ? 'In Progress' : 'Locked'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
