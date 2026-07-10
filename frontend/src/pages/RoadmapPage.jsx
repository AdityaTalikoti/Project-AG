import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, CheckCircle2, Lock, ArrowLeft, Target, Award, Clock, Trash2, Trophy } from 'lucide-react';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  // Onboarding form states (in case they land here directly with no active roadmap)
  const [goalName, setGoalName] = useState('MERN Stack');
  const [customGoal, setCustomGoal] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [timeline, setTimeline] = useState('8 weeks');
  const [commitment, setCommitment] = useState(60);
  const [generating, setGenerating] = useState(false);

  const fetchActiveRoadmap = async () => {
    try {
      const res = await fetch('/api/roadmaps/active');
      const json = await res.json();
      if (json.success && json.data) {
        setRoadmap(json.data);
      }
    } catch (err) {
      console.error("Error fetching roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRoadmap();
  }, []);

  const handleToggleTask = async (taskId, currentCompleted) => {
    if (!roadmap) return;
    try {
      // Optimistic state update
      const updatedModules = roadmap.modules.map(mod => {
        const updatedTasks = mod.tasks.map(t => {
          if (t._id === taskId) {
            return { ...t, completed: !currentCompleted };
          }
          return t;
        });
        return { ...mod, tasks: updatedTasks };
      });
      setRoadmap({ ...roadmap, modules: updatedModules });

      const res = await fetch('/api/roadmaps/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmapId: roadmap._id,
          taskId,
          completed: !currentCompleted
        })
      });
      const json = await res.json();
      if (json.success) {
        setRoadmap(json.data);
      } else {
        // Revert on failure
        fetchActiveRoadmap();
      }
    } catch (err) {
      console.error(err);
      fetchActiveRoadmap();
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const selectedGoal = goalName === 'Custom' ? customGoal : goalName;
      const res = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: selectedGoal,
          skillLevel,
          timeline,
          dailyCommitment: commitment
        })
      });
      const json = await res.json();
      if (json.success) {
        setRoadmap(json.data);
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

  const handleDeleteRoadmap = async () => {
    // if (!window.confirm("Are you sure you want to reset your current goal track? All progress on this roadmap will be permanently lost.")) return;
    try {
      const res = await fetch('/api/roadmaps/active', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setRoadmap(null);
      } else {
        alert("Failed to delete active roadmap.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleArchiveRoadmap = async () => {
    try {
      const res = await fetch('/api/roadmaps/archive', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setRoadmap(null);
      } else {
        alert("Failed to archive active roadmap.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-[#0a0e1a] p-8 rounded-2xl border border-[#121829] flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Loading Roadmap...</span>
        </div>
      </div>
    );
  }

  // 1. Render Onboarding Goal setup if no roadmap exists
  if (!roadmap) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <button 
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-900/60 pb-4">
            <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-purple-400">
              <Target size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Choose Your Learning Goal</h3>
              <p className="text-xs text-gray-400">Generate a custom learning path with progress tracking and gamified modules.</p>
            </div>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Goal Track</label>
                <select
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition"
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Experience Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSkillLevel(lvl)}
                      className={`py-2 text-[10px] font-bold rounded-xl border transition ${
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
                  placeholder="e.g. Solidity & Ethereum, Golang APIs"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Timeline Target</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition"
                >
                  <option value="4 weeks">4 Weeks (Intensive)</option>
                  <option value="8 weeks">8 Weeks (Standard)</option>
                  <option value="12 weeks">12 Weeks (Extended)</option>
                  <option value="16 weeks">16 Weeks (Complete)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Daily Commitment</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setCommitment(mins)}
                      className={`py-2 text-[10px] font-bold rounded-xl border transition ${
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
                {generating ? "Generating Pathway..." : "Generate Learning Roadmap 🚀"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. Render Full Interactive Roadmap Page
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Quote and Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0e1a]/40 p-5 rounded-2xl border border-[#121829] shadow-sm">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={12} />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">{roadmap.title}</h1>
          <p className="text-xs text-gray-400">Personalized Learning Roadmap • {roadmap.skillLevel} Track</p>
        </div>

        <div className="flex items-center gap-6 bg-[#111625] px-5 py-3 rounded-2xl border border-[#1b2237]">
          <div className="text-center">
            <span className="text-[10px] text-gray-500 font-semibold block uppercase">Timeline</span>
            <span className="text-xs font-bold text-white">{roadmap.timeline}</span>
          </div>
          <div className="w-px h-8 bg-gray-900" />
          <div className="text-center">
            <span className="text-[10px] text-gray-500 font-semibold block uppercase">Commitment</span>
            <span className="text-xs font-bold text-white">{roadmap.dailyCommitment} mins/day</span>
          </div>
          <div className="w-px h-8 bg-gray-900" />
          <div className="text-center">
            <span className="text-[10px] text-gray-500 font-semibold block uppercase">Completion</span>
            <span className="text-xs font-bold text-emerald-400">{roadmap.completionPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Vertical Timeline Modules */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Learning Path Modules</h2>
          
          <div className="relative border-l border-gray-900 pl-6 ml-4 space-y-8">
            {roadmap.modules.map((mod, modIdx) => {
              const isInProgress = mod.status === 'in-progress';
              const isCompleted = mod.status === 'completed';
              const isLocked = mod.status === 'locked';

              return (
                <div key={mod._id} className="relative">
                  {/* Timeline bullet dot */}
                  <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : isInProgress
                      ? 'bg-purple-500/20 border-purple-500 text-purple-400 animate-pulse'
                      : 'bg-gray-950 border-gray-800 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 size={10} className="fill-emerald-500/20" />
                    ) : isLocked ? (
                      <Lock size={8} />
                    ) : (
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    )}
                  </span>

                  {/* Module Card container */}
                  <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                    isInProgress
                      ? 'bg-gradient-to-tr from-[#140b20] to-[#0a0e1a] border-purple-500/30 shadow-lg shadow-purple-950/10'
                      : isCompleted
                      ? 'bg-[#0a0e1a] border-emerald-500/10'
                      : 'bg-[#0a0e1a]/40 border-[#121829] opacity-50'
                  }`}>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider block ${
                          isCompleted ? 'text-emerald-400' : isInProgress ? 'text-purple-400' : 'text-gray-500'
                        }`}>
                          {mod.estimatedDuration} • {mod.status.replace('-', ' ')}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{mod.title}</h3>
                      </div>
                      {isLocked && <Lock size={16} className="text-gray-600" />}
                    </div>

                    <p className="text-xs text-gray-400 mb-4">{mod.description}</p>

                    {/* Tasks Checklist */}
                    <div className="space-y-2 border-t border-gray-900/60 pt-3">
                      {mod.tasks.map((task) => (
                        <div 
                          key={task._id} 
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition duration-200 ${
                            isLocked 
                              ? 'bg-transparent' 
                              : 'hover:bg-[#111625]/60'
                          }`}
                        >
                          <label className={`flex items-center gap-3 cursor-pointer select-none min-w-0 ${isLocked ? 'pointer-events-none' : ''}`}>
                            <input
                              type="checkbox"
                              disabled={isLocked}
                              checked={task.completed}
                              onChange={() => handleToggleTask(task._id, task.completed)}
                              className="w-4 h-4 rounded-lg bg-[#111625] border-[#1b2237] text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-purple-500 flex-shrink-0 disabled:opacity-50"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className={`font-semibold truncate ${
                                task.completed ? 'line-through text-gray-500' : 'text-white'
                              }`}>
                                {task.title}
                              </span>
                              <span className="text-[10px] text-gray-500 truncate">{task.description}</span>
                            </div>
                          </label>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                              <Clock size={10} />
                              {task.duration}
                            </span>
                            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                              +{task.xpReward} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Progress Card */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Milestones & Insights</h2>
          
          {/* Completed goal banner */}
          {roadmap.completionPercentage === 100 && (
            <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-emerald-500/20 shadow-md space-y-4 bg-gradient-to-tr from-[#0a1b16] to-[#0a0e1a] animate-in zoom-in duration-300">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Trophy size={20} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Track Completed! 🎉</h3>
                  <p className="text-[10px] text-emerald-400 font-medium">100% Modules Cleared</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Excellent work! You have finished all tasks. Ready to level up further?</p>
              <button
                onClick={handleArchiveRoadmap}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
              >
                Choose a New Learning Goal
              </button>
            </div>
          )}

          <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-900/60 pb-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                <Compass size={18} />
              </div>
              <div>
                <span className="text-[9px] text-gray-500 font-semibold block uppercase">Learning Path</span>
                <span className="text-xs font-bold text-white">{roadmap.category}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Progress</span>
                <span className="font-bold text-white">{roadmap.completionPercentage}%</span>
              </div>
              <div className="w-full bg-[#111625] h-2.5 rounded-full overflow-hidden border border-[#1b2237]">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${roadmap.completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-gray-400">
                <Award size={14} className="text-purple-400" />
                <span>Next Milestone: <strong className="text-white">
                  {roadmap.modules.find(m => m.status === 'in-progress')?.title || 'Completed! 🎉'}
                </strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-400">
                <Clock size={14} className="text-purple-400" />
                <span>Daily Commitment: <strong className="text-white">{roadmap.dailyCommitment} mins</strong></span>
              </div>
            </div>
          </div>
          
          {/* Quick instructions panel */}
          <div className="bg-[#0a0e1a]/60 p-5 rounded-2xl border border-[#121829]/60 border-dashed text-xs text-gray-400 space-y-2 leading-relaxed">
            <p className="font-semibold text-white uppercase text-[9px] tracking-wider">How to progress:</p>
            <p>1. Check tasks inside the active module to mark them complete.</p>
            <p>2. Completing all tasks in a module will instantly change its status to completed.</p>
            <p>3. Completing a module automatically unlocks the subsequent locked module in the pathway.</p>
            <p>4. Completing tasks earns you XP which levels up your profile in real-time!</p>
          </div>

          {/* Option to delete current goal */}
          <button
            onClick={handleDeleteRoadmap}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 font-bold py-3 px-4 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            Reset Current Goal Track
          </button>
        </div>
      </div>
    </div>
  );
}
