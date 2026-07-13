import React, { useState } from 'react';
import { 
  Check, RefreshCw, Calendar, AlertTriangle, Sparkles, Clock, 
  BookOpen, ChevronLeft, ChevronRight, Zap, CheckCircle2, AlertCircle
} from 'lucide-react';
import { 
  useGetStudyPlanQuery, 
  useRegenerateStudyPlanMutation, 
  useToggleStudyPlanTaskMutation, 
  useRescheduleMilestoneMutation 
} from '../../store/apiSlice';

export default function StudyPlanner() {
  const [dateOffset, setDateOffset] = useState(0);
  const [dismissedRecs, setDismissedRecs] = useState([]);
  const [toast, setToast] = useState(null);

  const getTargetDateString = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const targetDateStr = dateOffset === 0 ? null : getTargetDateString(dateOffset);

  const { data, isLoading, error, refetch } = useGetStudyPlanQuery(targetDateStr);
  const [regenerateStudyPlan, { isLoading: isRegenerating }] = useRegenerateStudyPlanMutation();
  const [toggleStudyPlanTask, { isLoading: isToggling }] = useToggleStudyPlanTaskMutation();
  const [rescheduleMilestone, { isLoading: isRescheduling }] = useRescheduleMilestoneMutation();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const plan = data?.data;

  const handleToggleTask = async (taskId, currentCompleted) => {
    if (dateOffset < 0) return; // Disable checklist modifications for past logs
    try {
      await toggleStudyPlanTask({ taskId, completed: !currentCompleted }).unwrap();
    } catch (err) {
      console.error(err);
      showToast('Failed to update task', 'error');
    }
  };

  const handleRegenerate = async () => {
    if (dateOffset < 0) return;
    try {
      await regenerateStudyPlan().unwrap();
      showToast('Study plan regenerated!', 'success');
      refetch();
    } catch (err) {
      console.error(err);
      showToast('Failed to regenerate plan', 'error');
    }
  };

  const handleRescheduleAccept = async (metadata) => {
    if (dateOffset < 0) return;
    if (!metadata || metadata.moduleIndex === undefined) return;
    try {
      const res = await rescheduleMilestone({
        moduleIndex: metadata.moduleIndex,
        suggestedDay: metadata.suggestedDay || 'Friday'
      }).unwrap();
      if (res.success) {
        showToast('Roadmap milestone rescheduled!', 'success');
        refetch();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to reschedule milestone', 'error');
    }
  };

  const handleDismissRec = (message) => {
    setDismissedRecs(prev => [...prev, message]);
  };

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-md animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-900 rounded w-1/3" />
          <div className="h-6 bg-gray-900 rounded-full w-20" />
        </div>
        <div className="space-y-2.5">
          <div className="h-10 bg-gray-900 rounded-xl" />
          <div className="h-10 bg-gray-900 rounded-xl" />
          <div className="h-10 bg-gray-900 rounded-xl" />
        </div>
      </div>
    );
  }

  // Filter recommendations that have not been dismissed
  const activeRecommendations = plan ? (plan.recommendations || []).filter(r => !dismissedRecs.includes(r.message)) : [];

  return (
    <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm space-y-4 hover:border-gray-800/80 transition duration-200 relative group animate-in fade-in duration-300">
      
      {/* Plan Header */}
      <div className="flex justify-between items-center border-b border-gray-900 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Zap size={14} className="text-purple-400 fill-purple-400/10 animate-pulse" />
            Study Planner
          </h3>
          
          {/* Date Selector Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDateOffset(prev => prev - 1)}
              className="p-1 hover:bg-gray-900 text-gray-400 hover:text-white rounded transition cursor-pointer"
              title="Previous Day Plan"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-[9px] text-gray-400 font-mono font-bold select-none min-w-[70px] text-center">
              {dateOffset === 0 ? 'Today' : dateOffset === -1 ? 'Yesterday' : getTargetDateString(dateOffset)}
            </span>
            <button
              onClick={() => setDateOffset(prev => Math.min(0, prev + 1))}
              disabled={dateOffset === 0}
              className="p-1 hover:bg-gray-900 text-gray-400 hover:text-white rounded disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
              title="Next Day Plan"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {plan && (
          <div className="flex items-center gap-2">
            {/* Workload Badge */}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none ${
              plan.workloadStatus === 'Busy'
                ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                : plan.workloadStatus === 'Light'
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                : 'bg-purple-500/10 border border-purple-500/25 text-purple-400'
            }`}>
              {plan.workloadStatus} Load
            </span>

            {/* AI vs Fallback Badge */}
            {plan.generatedBy === 'AI' ? (
              <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 select-none">
                <Sparkles size={8} /> AI
              </span>
            ) : (
              <span className="text-[9px] font-bold bg-gray-900 border border-gray-800 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-0.5 select-none" title="Offline rule fallback evaluation used">
                Offline Fallback
              </span>
            )}

            {/* Regenerate Action (Today only) */}
            {dateOffset === 0 && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating || isToggling}
                className="p-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition cursor-pointer border border-gray-800"
                title="Regenerate Plan"
              >
                <RefreshCw size={11} className={isRegenerating ? 'animate-spin text-purple-400' : ''} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task Checklist */}
      <div className="space-y-2">
        {plan && plan.tasks && plan.tasks.length > 0 ? (
          plan.tasks.map((task) => (
            <div
              key={task._id}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs border transition duration-200 ${
                task.completed 
                  ? 'bg-gray-950/20 border-gray-950/10' 
                  : 'bg-[#111625]/40 hover:bg-[#111625]/75 border-[#1b2237]/15'
              }`}
            >
              <label className={`flex items-center gap-3 select-none min-w-0 flex-1 ${dateOffset < 0 ? 'pointer-events-none' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task._id, task.completed)}
                  disabled={isToggling || dateOffset < 0}
                  className="w-4 h-4 rounded bg-[#111625] border-[#1b2237] text-purple-600 focus:ring-0 cursor-pointer accent-purple-500 disabled:opacity-50"
                />
                <span className={`font-semibold truncate pr-3 ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-200'
                }`}>
                  {task.title}
                </span>
              </label>

              <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono flex-shrink-0 select-none">
                <Clock size={10} />
                {task.duration}
              </span>
            </div>
          ))
        ) : error || !plan ? (
          <div className="text-center py-5 space-y-2 border border-dashed border-gray-900 rounded-2xl select-none">
            <BookOpen size={20} className="text-gray-650 mx-auto" />
            <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto">
              {dateOffset === 0 
                ? "Click the button above to generate today's study plan." 
                : `No study plan was generated for ${new Date(getTargetDateString(dateOffset)).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`
              }
            </p>
          </div>
        ) : null}
      </div>

      {/* AI Smart Adaptation Recommendations Panel (Today only) */}
      {dateOffset === 0 && activeRecommendations.length > 0 && (
        <div className="pt-2 border-t border-gray-900">
          <span className="text-[9px] text-purple-400/90 font-bold uppercase tracking-wider block mb-2">Smart Adaptations</span>
          
          <div className="space-y-2">
            {activeRecommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="bg-[#0b0f19] p-3 rounded-xl border border-purple-500/15 text-[11px] leading-relaxed space-y-2.5 relative"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-purple-300 font-medium pr-6">{rec.message}</p>
                  
                  <button
                    onClick={() => handleDismissRec(rec.message)}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-400 p-0.5 rounded cursor-pointer"
                    title="Dismiss"
                  >
                    <X size={10} />
                  </button>
                </div>

                {rec.actionType === 'reschedule' && rec.metadata && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleDismissRec(rec.message)}
                      className="px-2 py-1 text-gray-500 hover:text-gray-300 font-bold transition text-[9px] cursor-pointer"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleRescheduleAccept(rec.metadata)}
                      disabled={isRescheduling}
                      className="px-2 py-1 bg-purple-500/15 border border-purple-500/20 hover:border-purple-500/40 text-purple-400 font-bold transition rounded text-[9px] flex items-center gap-1 cursor-pointer"
                    >
                      {isRescheduling ? 'Moving...' : 'Reschedule & Sync'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toast && (
        <div className={`absolute bottom-3 right-3 p-2 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1.5 animate-in slide-in-from-bottom-2 duration-200 pointer-events-none ${
          toast.type === 'error'
            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={10} /> : <Check size={10} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function X({ size = 10, ...props }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
