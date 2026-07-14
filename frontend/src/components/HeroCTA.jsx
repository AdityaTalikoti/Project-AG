import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Target } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function HeroCTA({ activeRoadmap, hasActiveRoadmap, isLoading }) {
  const [goalName, setGoalName] = useState('MERN Stack');
  const [customGoal, setCustomGoal] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [timeline, setTimeline] = useState('8 weeks');
  const [commitment, setCommitment] = useState(60);
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const selectedGoal = goalName === 'Custom' ? customGoal : goalName;
      const res = await fetch(`${API_BASE}/api/roadmaps/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          goal: selectedGoal,
          skillLevel,
          timeline,
          dailyCommitment: commitment
        })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to generate roadmap.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-sm h-56 animate-pulse" />
    );
  }

  // 1. If no active roadmap, show Onboarding form
  if (!hasActiveRoadmap) {
    return (
      <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-sm space-y-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3 border-b border-gray-900/60 pb-4">
          <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-purple-400">
            <Target size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Set Your Learning Goal</h3>
            <p className="text-xs text-gray-400">Generate a personalized modular learning roadmap to track your daily progress.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Goal Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Goal Track</label>
              <select
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition cursor-pointer"
              >
                <option value="MERN Stack">MERN Stack Mastery</option>
                <option value="DSA">Data Structures & Algorithms</option>
                <option value="AI/ML">Artificial Intelligence & ML</option>
                <option value="React">React Developer Pathway</option>
                <option value="Full Stack Development">Full Stack Engineering</option>
                <option value="Placement Preparation">Placement & Technical Prep</option>
                <option value="Custom">Custom Learning Track...</option>
              </select>
            </div>

            {/* Skill level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Experience Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSkillLevel(lvl)}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition cursor-pointer ${
                      skillLevel === lvl
                        ? 'bg-purple-500/15 border-purple-500 text-purple-400'
                        : 'bg-[#111625] border-[#1b2237] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {goalName === 'Custom' && (
            <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Custom Goal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. AWS Cloud Architecture, Web3 Development"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timeline */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Timeline Target</label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition cursor-pointer"
              >
                <option value="4 weeks">4 Weeks (Intensive)</option>
                <option value="8 weeks">8 Weeks (Standard)</option>
                <option value="12 weeks">12 Weeks (Extended)</option>
                <option value="16 weeks">16 Weeks (Complete)</option>
              </select>
            </div>

            {/* Commitment */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Daily Commitment</label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCommitment(mins)}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition cursor-pointer ${
                      commitment === mins
                        ? 'bg-purple-500/15 border-purple-500 text-purple-400'
                        : 'bg-[#111625] border-[#1b2237] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60} hr${mins > 60 ? 's' : ''}` : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/20 disabled:opacity-50"
            >
              {generating ? "Generating Pathway..." : "Generate Custom Learning Roadmap 🚀"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. If active roadmap exists, render premium circular progress card
  const completion = activeRoadmap?.completionPercentage || 0;
  const completedCount = activeRoadmap?.completedModulesCount || 0;
  const inProgressCount = activeRoadmap?.inProgressModulesCount || 0;
  const totalCount = activeRoadmap?.totalModulesCount || 4;
  const remainingCount = totalCount - completedCount - inProgressCount;

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
          <h2 className="text-lg font-bold text-white tracking-tight">{activeRoadmap?.title}</h2>
          <p className="text-[11px] text-gray-400 mt-1">
            Active Module: <strong className="text-emerald-400">{activeRoadmap?.activeModuleName}</strong>
          </p>
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
              <span>Locked: <strong>{remainingCount >= 0 ? remainingCount : 0}</strong></span>
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
