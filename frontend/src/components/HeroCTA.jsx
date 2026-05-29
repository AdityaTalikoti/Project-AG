import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function HeroCTA({ goal, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-sm h-56 animate-pulse" />
    );
  }

  const completion = goal?.completionPercentage || 0;
  const roadmap = goal?.roadmap || [];
  const completedCount = roadmap.filter(t => t.status === 'completed').length;
  const inProgressCount = roadmap.filter(t => t.status === 'current').length;
  const remainingCount = roadmap.filter(t => t.status === 'upcoming').length;
  const totalCount = roadmap.length || 5;

  // SVG circle calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  return (
    <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-sm flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
      {/* Deep green background blur glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
      
      {/* Circular Progress & Info */}
      <div className="flex flex-col sm:flex-row items-center gap-6 z-10 w-full md:w-auto">
        {/* SVG Circle Progress */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-gray-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Active progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-emerald-500"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-white font-mono leading-none">{completion}%</span>
            <span className="text-[8px] text-gray-500 font-medium uppercase mt-0.5 tracking-wider">Completed</span>
          </div>
        </div>

        {/* Text & Progress Bars */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-lg font-bold text-white tracking-tight">{goal?.title || "Active Goal"}</h2>
          <p className="text-[11px] text-gray-400 mt-1">You're making steady progress.</p>
          <p className="text-[10px] text-gray-500 font-semibold mt-2">{completedCount} of {totalCount} modules completed</p>
          
          {/* Horizontal Progress Bar */}
          <div className="w-full sm:w-64 bg-[#111625] h-1.5 rounded-full overflow-hidden mt-2 border border-[#1b2237]">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${completion}%` }}
            />
          </div>

          {/* Breakdown counts */}
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Completed: <strong>{completedCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>In Progress: <strong>{inProgressCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Remaining: <strong>{remainingCount}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Button & Rocket graphic */}
      <div className="flex flex-col items-center md:items-end gap-3 mt-6 md:mt-0 z-10 w-full md:w-auto">
        {/* Floating Rocket SVG graphic */}
        <div className="hidden md:block text-indigo-400/20 absolute right-6 top-6 animate-bounce" style={{ animationDuration: '4s' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" />
            <path d="M12 2C6.5 2 2 6.5 2 12c0 2.5 1 4.5 2.5 6l6-6L18 4.5 22 2l-2.5 4L12 12l-6 6c1.5 1.5 3.5 2.5 6 2.5 5.5 0 10-4.5 10-10C22 6.5 17.5 2 12 2z" />
          </svg>
        </div>

        <Link 
          to="/dashboard/roadmap"
          className="bg-[#111625] hover:bg-[#1c2237] text-white border border-[#1b2237] font-semibold py-2 px-4 rounded-xl text-xs transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <span>View Roadmap</span>
          <Compass size={14} />
        </Link>
      </div>
    </div>
  );
}
