import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, CheckCircle2, Lock, ArrowLeft, Target, Award, Clock, 
  Trash2, Trophy, Calendar, AlertTriangle, Check, Plus, ArrowRight, 
  Sparkles, ChevronUp, ChevronDown, Save, RefreshCw, X, Eye, BookOpen, 
  BookMarked, HelpCircle
} from 'lucide-react';
import { 
  useGetRoadmapSyncStatusQuery, 
  useSyncRoadmapMutation,
  useDeleteActiveRoadmapMutation,
  useArchiveActiveRoadmapMutation,
  useGenerateRoadmapMutation,
  useAnalyzeSuggestionsMutation,
  useSaveRoadmapMutation
} from '../store/apiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync state hooks and toast states
  const { data: syncData, refetch: refetchSyncStatus } = useGetRoadmapSyncStatusQuery(roadmap?._id, { skip: !roadmap?._id });
  const [syncRoadmap, { isLoading: isSyncing }] = useSyncRoadmapMutation();
  const [deleteActiveRoadmap] = useDeleteActiveRoadmapMutation();
  const [archiveActiveRoadmap] = useArchiveActiveRoadmapMutation();
  
  // Phase 7 AI Roadmap Mutations
  const [generateRoadmap, { isLoading: isGenerating }] = useGenerateRoadmapMutation();
  const [analyzeSuggestions, { isLoading: isAnalyzingSuggestions }] = useAnalyzeSuggestionsMutation();
  const [saveRoadmap, { isLoading: isSavingRoadmap }] = useSaveRoadmapMutation();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Onboarding Wizard states
  const [interviewStep, setInterviewStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [dailyCommitment, setDailyCommitment] = useState(60);
  const [targetDate, setTargetDate] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [existingKnowledge, setExistingKnowledge] = useState('');
  const [customGoalOption, setCustomGoalOption] = useState('MERN Stack');

  // Preview Editor states
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const syncStatus = syncData?.status || 'Not Synced';

  const handleSyncClick = () => {
    setShowConfirmModal(true);
  };

  const handleSyncExecute = async () => {
    try {
      const res = await syncRoadmap(roadmap._id).unwrap();
      if (res.success) {
        addToast(res.message || 'Roadmap synced to calendar successfully!', 'success');
        setShowConfirmModal(false);
        if (refetchSyncStatus) refetchSyncStatus();
      }
    } catch (err) {
      console.error(err);
      addToast(err?.data?.error || 'Failed to sync roadmap to calendar', 'error');
      setShowConfirmModal(false);
    }
  };

  const fetchActiveRoadmap = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/roadmaps/active`, { credentials: 'include' });
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

  // Debounced live AI suggestions when milestones change
  useEffect(() => {
    if (!generatedRoadmap) return;
    if (!generatedRoadmap?.milestones || generatedRoadmap.milestones.length === 0) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await analyzeSuggestions({
          title: generatedRoadmap.title,
          skillLevel,
          dailyCommitment,
          milestones: generatedRoadmap.milestones
        }).unwrap();

        if (res.success) {
          setSuggestions(res.suggestions || []);
        }
      } catch (err) {
        console.error('Error analyzing roadmap suggestions:', err);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [generatedRoadmap?.milestones, generatedRoadmap?.title, skillLevel, dailyCommitment]);

  // Tasks actions on Active view
  const handleToggleTask = async (taskId, currentCompleted) => {
    if (!roadmap) return;
    try {
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

      const res = await fetch(`${API_BASE}/api/roadmaps/tasks/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        fetchActiveRoadmap();
      }
    } catch (err) {
      console.error(err);
      fetchActiveRoadmap();
    }
  };

  const handleDeleteRoadmap = async () => {
    try {
      const res = await deleteActiveRoadmap().unwrap();
      if (res.success) {
        setRoadmap(null);
        setGeneratedRoadmap(null);
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
      const res = await archiveActiveRoadmap().unwrap();
      if (res.success) {
        setRoadmap(null);
        setGeneratedRoadmap(null);
      } else {
        alert("Failed to archive active roadmap.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  // Onboarding submissions -> triggers generateRoadmap mutation
  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    const finalGoal = customGoalOption === 'Custom' ? goal : customGoalOption;
    if (!finalGoal.trim()) {
      alert("Please enter a learning goal.");
      return;
    }

    try {
      const res = await generateRoadmap({
        goal: finalGoal,
        skillLevel,
        dailyCommitment,
        targetDate,
        learningStyle,
        existingKnowledge
      }).unwrap();

      if (res.success && res.data) {
        setGeneratedRoadmap(res.data);
        setInterviewStep(1); // Reset step counter
      } else {
        alert("Failed to generate roadmap preview.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during roadmap generation.");
    }
  };

  // Preview Editor actions
  const handleUpdateRoadmapField = (field, value) => {
    setGeneratedRoadmap(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateMilestoneField = (index, field, value) => {
    const updated = generatedRoadmap.milestones.map((m, idx) => {
      if (idx === index) {
        if (field === 'topics' || field === 'resources') {
          return { ...m, [field]: value.split(',').map(s => s.trim()).filter(Boolean) };
        }
        return { ...m, [field]: value };
      }
      return m;
    });
    setGeneratedRoadmap(prev => ({ ...prev, milestones: updated }));
  };

  const handleAddMilestone = () => {
    const newMilestone = {
      title: "New Learning Milestone",
      description: "Describe what concepts will be covered in this milestone.",
      duration: "1 week",
      priority: "Medium",
      topics: ["Concept 1", "Concept 2"],
      resources: ["Reference Document"]
    };
    setGeneratedRoadmap(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
  };

  const handleDeleteMilestone = (index) => {
    const updated = generatedRoadmap.milestones.filter((_, idx) => idx !== index);
    setGeneratedRoadmap(prev => ({
      ...prev,
      milestones: updated
    }));
  };

  const handleMoveMilestone = (index, direction) => {
    const milestones = [...generatedRoadmap.milestones];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= milestones.length) return;

    // Swap
    const temp = milestones[index];
    milestones[index] = milestones[targetIdx];
    milestones[targetIdx] = temp;

    setGeneratedRoadmap(prev => ({
      ...prev,
      milestones
    }));
  };

  const handleSaveCustomizedRoadmap = async (shouldSync = false) => {
    try {
      const res = await saveRoadmap({
        title: generatedRoadmap.title,
        description: generatedRoadmap.description,
        skillLevel,
        dailyCommitment,
        milestones: generatedRoadmap.milestones,
        timeline: generatedRoadmap.estimatedDuration,
        sync: shouldSync
      }).unwrap();

      if (res.success && res.data) {
        addToast(res.message || (shouldSync ? "Roadmap saved and calendar synchronized successfully!" : "Roadmap saved successfully!"), "success");
        setRoadmap(res.data);
        setGeneratedRoadmap(null);
        setSuggestions([]);
        setDismissedSuggestions([]);
        if (refetchSyncStatus) refetchSyncStatus();
      }
    } catch (err) {
      console.error(err);
      addToast(err?.data?.message || "Failed to save customized roadmap", "error");
    }
  };

  const handleDismissSuggestion = (msg) => {
    setDismissedSuggestions(prev => [...prev, msg]);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-[#0a0e1a] p-8 rounded-2xl border border-[#121829] flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Loading active track...</span>
        </div>
      </div>
    );
  }

  // STEP 1 — AI Onboarding Interview UI
  if (!roadmap && !generatedRoadmap) {
    const finalGoal = customGoalOption === 'Custom' ? goal : customGoalOption;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <button 
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-md space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-900/60 pb-4">
            <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-purple-400">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Roadmap Architect</h3>
              <p className="text-xs text-gray-400">Build a personalized academic path in minutes with step-by-step guidance.</p>
            </div>
          </div>

          {/* Stepper progress */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider pb-1">
            <span>Step {interviewStep} of 3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <div 
                  key={s} 
                  className={`w-8 h-1.5 rounded-full transition-all duration-300 ${
                    s === interviewStep ? 'bg-purple-500 w-12' : s < interviewStep ? 'bg-purple-500/40' : 'bg-gray-900'
                  }`} 
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleInterviewSubmit} className="space-y-5">
            {/* Step 1: Learning Goal & Skill Level */}
            {interviewStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">What topic or career role do you want to learn?</label>
                  <select
                    value={customGoalOption}
                    onChange={(e) => setCustomGoalOption(e.target.value)}
                    className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition"
                  >
                    <option value="MERN Stack">MERN Stack Developer</option>
                    <option value="DSA">Data Structures & Algorithms (LeetCode)</option>
                    <option value="AI/ML">Artificial Intelligence & Machine Learning</option>
                    <option value="React">React Developer Pathway</option>
                    <option value="Full Stack Development">Full Stack Engineering</option>
                    <option value="Placement Preparation">Placement & Technical Prep</option>
                    <option value="Custom">Custom Learning Track...</option>
                  </select>
                </div>

                {customGoalOption === 'Custom' && (
                  <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase">Enter Custom Goal</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Solidity Blockchain Development, Golang microservices"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500 transition"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Current Experience Level</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSkillLevel(lvl)}
                        className={`py-2.5 text-[10px] font-bold rounded-xl border transition cursor-pointer ${
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

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (customGoalOption === 'Custom' && !goal.trim()) {
                        alert("Goal is required.");
                        return;
                      }
                      setInterviewStep(2);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/20"
                  >
                    Next Step <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Time commitment & completion dates */}
            {interviewStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Daily Study Time Commitment</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[30, 60, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDailyCommitment(mins)}
                        className={`py-2.5 text-[10px] font-bold rounded-xl border transition cursor-pointer ${
                          dailyCommitment === mins
                            ? 'bg-purple-500/15 border-purple-500 text-purple-400'
                            : 'bg-[#111625] border-[#1b2237] text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        {mins >= 60 ? `${mins / 60} hr${mins > 60 ? 's' : ''}` : `${mins} min`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Target Completion Date (Optional)</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition cursor-pointer font-mono"
                  />
                  <span className="text-[9px] text-gray-500">Leaving this blank allows AI to estimate a realistic timeline.</span>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setInterviewStep(1)}
                    className="bg-gray-900 border border-gray-800 text-gray-400 font-semibold py-2.5 px-4 rounded-xl text-xs hover:text-white transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewStep(3)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/20"
                  >
                    Next Step <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Preferences & Background (Optional) */}
            {interviewStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Preferred Learning Style (Optional)</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['Hands-on Practice', 'Visual Video Lessons', 'Detailed Articles', 'Interactive Scenarios'].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setLearningStyle(style)}
                        className={`py-2.5 text-[10px] font-bold rounded-xl border transition cursor-pointer ${
                          learningStyle === style
                            ? 'bg-purple-500/15 border-purple-500 text-purple-400'
                            : 'bg-[#111625] border-[#1b2237] text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase">Existing Knowledge / Prerequisite Background (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Basic HTML, CSS, and some programming logic in Python"
                    value={existingKnowledge}
                    onChange={(e) => setExistingKnowledge(e.target.value)}
                    className="bg-[#111625] border border-[#1b2237] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500 transition resize-none"
                  />
                  <span className="text-[9px] text-gray-500">List what you already know so the AI doesn't duplicate introductory steps.</span>
                </div>

                <div className="pt-2 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setInterviewStep(2)}
                    className="bg-gray-900 border border-gray-800 text-gray-400 font-semibold py-2.5 px-4 rounded-xl text-xs hover:text-white transition cursor-pointer"
                  >
                    Back
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/20 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Building Pathway...
                        </>
                      ) : (
                        <>
                          Generate Roadmap 🚀
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // STEP 3 — SMART PREVIEW EDITOR UI (Before saving)
  if (!roadmap && generatedRoadmap) {
    const activeSuggestions = suggestions.filter(s => !dismissedSuggestions.includes(s.message));

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0e1a]/40 p-5 rounded-2xl border border-[#121829] shadow-sm">
          <div className="space-y-1">
            <button 
              onClick={() => {
                if (window.confirm("Go back to interview? This will discard your current generated preview.")) {
                  setGeneratedRoadmap(null);
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={12} />
              Cancel & Restart
            </button>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400 animate-pulse" />
              <h1 className="text-xl font-bold text-white tracking-tight">Preview & Customize Your Roadmap</h1>
            </div>
            <p className="text-xs text-gray-400">Review your generated learning curriculum. Reorder, add, or delete milestones before saving.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSaveCustomizedRoadmap(false)}
              disabled={isSavingRoadmap || !generatedRoadmap?.milestones || generatedRoadmap.milestones.length === 0}
              className="bg-[#111625] border border-gray-800 hover:border-gray-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={13} />
              Save Roadmap
            </button>
            <button
              onClick={() => handleSaveCustomizedRoadmap(true)}
              disabled={isSavingRoadmap || !generatedRoadmap?.milestones || generatedRoadmap.milestones.length === 0}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/20 disabled:opacity-50"
            >
              {isSavingRoadmap ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  Save & Sync Roadmap 🚀
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Editable Milestones */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Milestone Modules ({generatedRoadmap?.milestones?.length || 0})</h2>
              <button
                onClick={handleAddMilestone}
                className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-lg"
              >
                <Plus size={10} /> Add Milestone
              </button>
            </div>

            <div className="space-y-4">
              {(generatedRoadmap?.milestones || []).map((m, idx) => (
                <div 
                  key={idx} 
                  className="bg-[#0a0e1a] p-5 rounded-2xl border border-gray-900/60 space-y-4 shadow-sm hover:border-gray-800 transition duration-200 relative group"
                >
                  {/* Position Badge & Reorder Controls */}
                  <div className="absolute top-5 right-5 flex items-center gap-2">
                    {/* Shift Controls */}
                    <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleMoveMilestone(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-gray-900 text-gray-400 hover:text-white rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveMilestone(idx, 'down')}
                        disabled={idx === (generatedRoadmap?.milestones?.length || 1) - 1}
                        className="p-1 hover:bg-gray-900 text-gray-400 hover:text-white rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteMilestone(idx)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 rounded-xl transition cursor-pointer"
                      title="Delete Milestone"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-3.5 max-w-[90%]">
                    {/* Module Title */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-gray-500 font-semibold uppercase">Milestone Title</label>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleUpdateMilestoneField(idx, 'title', e.target.value)}
                        className="bg-transparent border-b border-gray-900 focus:border-purple-500 font-bold text-white text-sm w-full py-1 outline-none transition"
                        placeholder="Milestone Title"
                      />
                    </div>

                    {/* Module Description */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-gray-500 font-semibold uppercase">Description & Learning Outcomes</label>
                      <textarea
                        rows={2}
                        value={m.description}
                        onChange={(e) => handleUpdateMilestoneField(idx, 'description', e.target.value)}
                        className="bg-transparent border border-gray-900 focus:border-purple-500 text-gray-300 text-xs w-full p-2 rounded-xl outline-none transition resize-none"
                        placeholder="Milestone description"
                      />
                    </div>

                    {/* Timeline & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-gray-500 font-semibold uppercase">Duration</label>
                        <input
                          type="text"
                          value={m.duration}
                          onChange={(e) => handleUpdateMilestoneField(idx, 'duration', e.target.value)}
                          className="bg-[#111625] border border-[#1b2237] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 transition"
                          placeholder="e.g. 5 days, 2 weeks"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-gray-500 font-semibold uppercase">Priority</label>
                        <select
                          value={m.priority}
                          onChange={(e) => handleUpdateMilestoneField(idx, 'priority', e.target.value)}
                          className="bg-[#111625] border border-[#1b2237] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 transition cursor-pointer"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Topics (Comma separated list) */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-gray-500 font-semibold uppercase">Topics (comma-separated list)</label>
                      <input
                        type="text"
                        value={m.topics ? m.topics.join(', ') : ''}
                        onChange={(e) => handleUpdateMilestoneField(idx, 'topics', e.target.value)}
                        className="bg-[#111625] border border-[#1b2237] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 transition"
                        placeholder="Topic A, Topic B, Topic C"
                      />
                    </div>

                    {/* Resources (Comma separated list) */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-gray-500 font-semibold uppercase">Recommended Resources (comma-separated list)</label>
                      <input
                        type="text"
                        value={m.resources ? m.resources.join(', ') : ''}
                        onChange={(e) => handleUpdateMilestoneField(idx, 'resources', e.target.value)}
                        className="bg-[#111625] border border-[#1b2237] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 transition"
                        placeholder="Resource A, Resource B"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddMilestone}
                className="w-full py-4 border-2 border-dashed border-gray-900 hover:border-purple-500/40 hover:bg-[#111625]/20 rounded-2xl transition duration-200 text-xs text-gray-500 hover:text-purple-400 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Another Module Milestone
              </button>
            </div>
          </div>

          {/* Right Column: AI Suggestion & Save Action Board */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI smart analysis</h2>

            {/* Smart Suggestions card */}
            <div className="bg-[#0b0f19] p-5 rounded-2xl border border-[#172033] shadow-md space-y-4 relative overflow-hidden">
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2 border-b border-gray-900 pb-3">
                <Sparkles size={16} className="text-purple-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold text-white">AI Suggestion Engine</h3>
                  <span className="text-[9px] text-gray-500">Live checks on roadmap sequence & timeline</span>
                </div>
                {isAnalyzingSuggestions && (
                  <RefreshCw size={12} className="animate-spin text-purple-400 ml-auto" />
                )}
              </div>

              {activeSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {activeSuggestions.map((s, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-xl border text-[11px] leading-relaxed space-y-2.5 relative animate-in fade-in duration-300 ${
                        s.type === 'warning' 
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                          : s.type === 'tip'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {s.type === 'warning' ? (
                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        ) : (
                          <BookOpen size={12} className="mt-0.5 flex-shrink-0" />
                        )}
                        <p className="font-medium pr-3">{s.message}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-end border-t border-white/5 pt-2">
                        <button
                          onClick={() => handleDismissSuggestion(s.message)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 hover:text-white transition rounded text-[9px] font-bold cursor-pointer"
                        >
                          Accept Advice
                        </button>
                        <button
                          onClick={() => handleDismissSuggestion(s.message)}
                          className="px-2 py-1 text-gray-500 hover:text-gray-300 transition rounded text-[9px] font-bold cursor-pointer"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 space-y-1">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-white">Roadmap Looks Solid!</p>
                  <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto">AI analysis detected no timeline conflicts or sequencing warnings.</p>
                </div>
              )}
            </div>

            {/* General Info Metadata */}
            <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-900/60 pb-3">
                <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400 border border-purple-500/20">
                  <BookMarked size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] text-gray-500 font-semibold block uppercase">Roadmap Settings</span>
                  <input
                    type="text"
                    value={generatedRoadmap.title}
                    onChange={(e) => handleUpdateRoadmapField('title', e.target.value)}
                    className="bg-transparent text-xs font-bold text-white outline-none w-full border-b border-transparent focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Total Timeline */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-semibold uppercase">Total Roadmap Duration</label>
                  <input
                    type="text"
                    value={generatedRoadmap.estimatedDuration}
                    onChange={(e) => handleUpdateRoadmapField('estimatedDuration', e.target.value)}
                    className="bg-[#111625] border border-[#1b2237] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Overall Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-semibold uppercase">Overall Description</label>
                  <textarea
                    rows={3}
                    value={generatedRoadmap.description}
                    onChange={(e) => handleUpdateRoadmapField('description', e.target.value)}
                    className="bg-[#111625] border border-[#1b2237] rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSaveCustomizedRoadmap(false)}
                  disabled={isSavingRoadmap || !generatedRoadmap?.milestones || generatedRoadmap.milestones.length === 0}
                  className="w-full bg-[#111625] border border-gray-800 hover:border-gray-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save size={13} />
                  Save Roadmap
                </button>
                <button
                  onClick={() => handleSaveCustomizedRoadmap(true)}
                  disabled={isSavingRoadmap || !generatedRoadmap?.milestones || generatedRoadmap.milestones.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20 disabled:opacity-50"
                >
                  {isSavingRoadmap ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={13} />
                      Save & Sync Roadmap 🚀
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── TOAST ALERTS OVERLAY ── */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <div 
              key={t.id} 
              className={`p-3.5 rounded-2xl border text-xs font-semibold shadow-xl flex items-center gap-2.5 pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 ${
                t.type === 'error' 
                  ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {t.type === 'error' ? <AlertTriangle size={14} /> : <Check size={14} />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // STEP 2 ── FULL ACTIVE ROADMAP DISPLAY (Existing screen)
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
          
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{roadmap.title}</h1>
            
            {/* Sync Badge */}
            {syncStatus === 'Synced' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full select-none">
                <Check size={10} /> Synced
              </span>
            )}
            {syncStatus === 'Needs Update' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full select-none">
                <AlertTriangle size={10} /> Update Available
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Personalized Learning Roadmap • {roadmap.skillLevel} Track</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
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

          {/* Sync Button Action */}
          {syncStatus !== 'Synced' ? (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className={`px-4 py-2.5 font-bold rounded-xl text-xs transition duration-200 cursor-pointer flex items-center gap-1.5 shadow-lg disabled:opacity-50 disabled:pointer-events-none ${
                syncStatus === 'Needs Update'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white shadow-amber-950/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/20'
              }`}
            >
              <Calendar size={14} />
              {syncStatus === 'Needs Update' ? 'Update Calendar' : 'Add Roadmap to Calendar'}
            </button>
          ) : (
            <div className="px-4 py-2.5 bg-gray-900 border border-gray-800 text-gray-400 font-bold rounded-xl text-xs flex items-center gap-1.5 select-none">
              <Check size={14} className="text-emerald-400" />
              Already Synced
            </div>
          )}
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

      {/* ── TOAST ALERTS OVERLAY ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`p-3.5 rounded-2xl border text-xs font-semibold shadow-xl flex items-center gap-2.5 pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 ${
              t.type === 'error' 
                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {t.type === 'error' ? <AlertTriangle size={14} /> : <Check size={14} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* ── SYNC CONFIRMATION DIALOG ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0e17] border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full flex items-center justify-center">
              <Calendar size={20} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Import to Calendar?</h3>
              <p className="text-xs text-gray-400">
                {syncStatus === 'Needs Update' 
                  ? 'Update this roadmap in your calendar? This will sync all modified milestones, add new modules, and clean up removed ones.'
                  : 'Import this roadmap into your calendar? This will create calendar events for every module milestone.'
                }
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-gray-900 border border-gray-800 text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-800 transition duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSyncExecute}
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-purple-950/20 disabled:opacity-50"
              >
                {isSyncing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
