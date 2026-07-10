import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Square, ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import { useAddFocusSessionMutation, useUpdateDailyTargetMutation } from '../store/apiSlice';
import { updateUser } from '../store/authSlice';
import { useDispatch, useSelector } from 'react-redux';

const PRESETS = [
  { label: 'Pomodoro', value: 25 * 60 * 1000 },
  { label: 'Long Session', value: 45 * 60 * 1000 },
];

export default function FocusTimerPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [addFocusSession, { isLoading: isSaving }] = useAddFocusSessionMutation();
  const [updateDailyTarget] = useUpdateDailyTargetMutation();

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(30);
  const [customValue, setCustomValue] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const [currentPreset, setCurrentPreset] = useState(PRESETS[0]);
  const [sessionPhase, setSessionPhase] = useState('focus'); // 'focus' or 'break'

  // Core Timer State
  const [totalDuration, setTotalDuration] = useState(PRESETS[0].value); // Default 25 min
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].value);
  const [isRunning, setIsRunning] = useState(false);

  // System Wall Clock Tracker for background throttling protection
  const [startTime, setStartTime] = useState(null);
  const [timeLeftAtStart, setTimeLeftAtStart] = useState(null);
  
  // Total focused time in milliseconds for the current load
  const [accumulatedTimeMs, setAccumulatedTimeMs] = useState(0);
  
  // UI States
  const [isCompleted, setIsCompleted] = useState(false);
  const [mouseMoved, setMouseMoved] = useState(true);
  const mouseTimeoutRef = useRef(null);

  // Tracking cursor movement to fade out UI controls in active focus mode
  useEffect(() => {
    if (!isRunning) {
      setMouseMoved(true);
      return;
    }

    const handleMouseMove = () => {
      setMouseMoved(true);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = setTimeout(() => {
        setMouseMoved(false);
      }, 3000); // fade out after 3 seconds of inactivity
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
    };
  }, [isRunning]);

  // Synthesize a calming chime using the Web Audio API (zero external assets dependency)
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Harmonic chord progression: C5 -> E5 -> G5 -> C6
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); 
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); 
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); 
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch (err) {
      console.warn("Audio chime block failed due to browser permissions:", err);
    }
  };

  // Save focused session to backend and redirect/transition phase
  const handlePhaseComplete = async (finalAccumulatedMs) => {
    const elapsedSeconds = Math.round(finalAccumulatedMs / 1000);

    if (currentPreset.label === 'Long Session' && sessionPhase === 'focus') {
      // Save focus session to backend (without navigating)
      if (elapsedSeconds > 0) {
        try {
          await addFocusSession({ duration: elapsedSeconds }).unwrap();
        } catch (error) {
          console.error("Failed to save focus session:", error);
        }
      }
      
      // Transition to break phase
      setSessionPhase('break');
      const breakDuration = 15 * 60 * 1000;
      setTotalDuration(breakDuration);
      setTimeLeft(breakDuration);
      setAccumulatedTimeMs(0);
      
      // Auto-start the break timer
      setIsRunning(true);
      setStartTime(Date.now());
      setTimeLeftAtStart(breakDuration);
    } else if (sessionPhase === 'break') {
      // Break phase is completed
      setAccumulatedTimeMs(finalAccumulatedMs);
      setIsCompleted(true);
    } else {
      // Pomodoro focus session is completed
      setAccumulatedTimeMs(finalAccumulatedMs);
      setIsCompleted(true);
      
      // Auto-save and redirect
      if (elapsedSeconds > 0) {
        try {
          await addFocusSession({ duration: elapsedSeconds }).unwrap();
          navigate('/dashboard');
        } catch (error) {
          console.error("Failed to save focus session:", error);
          alert("Could not save focus session. Returning to dashboard.");
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    }
  };

  // Main countdown ticker hook
  useEffect(() => {
    let intervalId;
    if (isRunning && startTime !== null) {
      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const nextTimeLeft = Math.max(0, timeLeftAtStart - elapsed);
        
        setTimeLeft(nextTimeLeft);

        if (nextTimeLeft <= 0) {
          clearInterval(intervalId);
          setIsRunning(false);
          playChime();
          
          const sessionTime = accumulatedTimeMs + timeLeftAtStart;
          handlePhaseComplete(sessionTime);
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, startTime, timeLeftAtStart, accumulatedTimeMs, sessionPhase, currentPreset]);

  // Play / Resume Session
  const handlePlay = () => {
    if (isCompleted) {
      // If completed, reset to start fresh
      handleReset();
    }
    setIsRunning(true);
    setStartTime(Date.now());
    setTimeLeftAtStart(timeLeft);

    // Intercept with Daily Target modal if not set yet
    if (user && !user.dailyTarget) {
      setShowTargetModal(true);
    }
  };

  // Pause Session
  const handlePause = () => {
    if (!isRunning) return;
    setIsRunning(false);
    
    // Add current focused segment to total accumulated focus time
    const segmentDuration = Date.now() - startTime;
    setAccumulatedTimeMs((prev) => prev + segmentDuration);
    
    // Reset trackers
    setStartTime(null);
    setTimeLeftAtStart(null);
  };

  // Reset Timer to default or chosen preset
  const handleReset = () => {
    setIsRunning(false);
    setSessionPhase('focus');
    const baseDuration = currentPreset.value;
    setTotalDuration(baseDuration);
    setTimeLeft(baseDuration);
    setStartTime(null);
    setTimeLeftAtStart(null);
    setAccumulatedTimeMs(0);
    setIsCompleted(false);
  };

  // Switch presets
  const handleSelectPreset = (preset) => {
    if (isRunning) return;
    setCurrentPreset(preset);
    setSessionPhase('focus');
    setTotalDuration(preset.value);
    setTimeLeft(preset.value);
    setAccumulatedTimeMs(0);
    setIsCompleted(false);
  };

  // Triggered when manual "End Focus / End Break" button is clicked
  const handleManualEnd = async () => {
    setIsRunning(false);
    const currentRun = isRunning && startTime !== null ? (Date.now() - startTime) : 0;
    const finalAccumulatedMs = accumulatedTimeMs + currentRun;
    const elapsedSeconds = Math.round(finalAccumulatedMs / 1000);

    // Reset trackers
    setStartTime(null);
    setTimeLeftAtStart(null);

    if (sessionPhase === 'break') {
      // If we're in break phase, just go back to dashboard without saving focus session
      navigate('/dashboard');
    } else {
      // If we're in focus phase, save and go back
      if (elapsedSeconds > 0) {
        try {
          await addFocusSession({ duration: elapsedSeconds }).unwrap();
        } catch (error) {
          console.error("Failed to save focus session:", error);
          alert("Could not save focus session. Returning to dashboard.");
        }
      }
      navigate('/dashboard');
    }
  };

  // Handle Cancel / Go Back check
  const handleBack = () => {
    const currentRun = isRunning && startTime !== null ? (Date.now() - startTime) : 0;
    const totalFocusedSoFar = accumulatedTimeMs + currentRun;

    if (sessionPhase === 'focus' && totalFocusedSoFar > 10000) { // If spent more than 10 seconds focusing, warn before discard
      if (window.confirm("You have focused for " + Math.round(totalFocusedSoFar / 1000) + " seconds. Would you like to save this progress before leaving?")) {
        handleManualEnd();
        return;
      }
    }
    navigate('/dashboard');
  };

  // Format milliseconds as MM:SS
  const formatTime = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');
    return `${formattedMins}:${formattedSecs}`;
  };

  const formattedTimeStr = formatTime(timeLeft);

  return (
    <div className="fixed inset-0 bg-[#050811] text-gray-200 flex flex-col items-center justify-between py-12 px-6 overflow-hidden z-50">
      {/* Dynamic Background Glow Effects */}
      <div 
        className={`absolute w-[450px] h-[450px] rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
          sessionPhase === 'break' 
            ? (isRunning ? 'scale-110 bg-emerald-500/15' : 'scale-100 bg-emerald-600/10')
            : (isRunning ? 'scale-110 bg-indigo-500/15' : 'scale-100 bg-violet-600/10')
        }`} 
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes breathe-focus {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 40px 2px rgba(124, 58, 237, 0.1), inset 0 0 20px 2px rgba(124, 58, 237, 0.05);
            border-color: rgba(124, 58, 237, 0.15);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 65px 12px rgba(124, 58, 237, 0.25), inset 0 0 30px 4px rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.4);
          }
        }
        @keyframes breathe-break {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 40px 2px rgba(16, 185, 129, 0.1), inset 0 0 20px 2px rgba(16, 185, 129, 0.05);
            border-color: rgba(16, 185, 129, 0.15);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 65px 12px rgba(16, 185, 129, 0.25), inset 0 0 30px 4px rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.4);
          }
        }
        .breathing-ring-focus {
          animation: breathe-focus 5s infinite ease-in-out;
        }
        .breathing-ring-break {
          animation: breathe-break 5s infinite ease-in-out;
        }
        .no-select {
          user-select: none;
        }
      `}} />

      {/* ── TOP HEADER / EXIT ACTION ── */}
      <header className={`w-full max-w-4xl flex items-center justify-between z-10 transition-opacity duration-500 ${
        isRunning && !mouseMoved ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-400 hover:text-white transition duration-200 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft size={14} />
          <span>Exit Space</span>
        </button>

        <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md bg-white/5 border border-white/5 px-3 py-1.5 rounded-full select-none transition-colors duration-500 ${
          sessionPhase === 'break' ? 'text-emerald-400/80' : 'text-violet-400/80'
        }`}>
          <Sparkles size={12} className={isRunning ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
          <span>{sessionPhase === 'break' ? 'Break Mode' : 'Focus Mode'}</span>
        </div>
      </header>

      {/* ── CENTRAL TIMER ELEMENT ── */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 select-none no-select w-full max-w-md relative">
        
        {/* Animated breathing glow ring around timer */}
        <div 
          className={`absolute rounded-full border transition-all duration-700 w-72 h-72 md:w-80 md:h-80 flex items-center justify-center ${
            isRunning 
              ? (sessionPhase === 'break' ? 'breathing-ring-break border-emerald-500/25 bg-emerald-950/5' : 'breathing-ring-focus border-violet-500/25 bg-violet-950/5')
              : 'border-white/5 bg-white/[0.01] shadow-xl'
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            {/* Massive Monospaced Timer digits */}
            <h1 className="text-6xl md:text-7xl font-bold font-mono tracking-widest text-white leading-none">
              {formattedTimeStr}
            </h1>
            
            {/* Subtle state feedback */}
            <span className="text-[10px] tracking-[0.25em] font-semibold text-gray-400 uppercase mt-4">
              {isCompleted 
                ? (sessionPhase === 'break' ? 'BREAK COMPLETED' : 'SESSION COMPLETED')
                : isRunning 
                  ? (sessionPhase === 'break' ? 'RELAX ACTIVE' : 'DEEP FOCUS ACTIVE')
                  : timeLeft === totalDuration 
                    ? (sessionPhase === 'break' ? 'READY FOR BREAK' : 'READY TO FOCUS')
                    : (sessionPhase === 'break' ? 'BREAK PAUSED' : 'SESSION PAUSED')}
            </span>
          </div>
        </div>

      </main>

      {/* ── CONTROLS & PRESETS FOOTER ── */}
      <footer className="w-full max-w-lg flex flex-col items-center gap-8 z-10">
        
        {/* Preset configuration buttons - hidden during active countdown */}
        <div className={`flex items-center gap-3 transition-all duration-500 ${
          isRunning 
            ? 'opacity-0 pointer-events-none translate-y-4' 
            : 'opacity-100 translate-y-0'
        }`}>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              disabled={isRunning || isCompleted}
              onClick={() => handleSelectPreset(preset)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition duration-200 cursor-pointer ${
                currentPreset.label === preset.label
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Action controls panel */}
        <div className={`flex flex-col items-center gap-4 w-full transition-opacity duration-500 ${
          isRunning && !mouseMoved ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="flex items-center gap-5">
            {/* Reset Action */}
            <button
              onClick={handleReset}
              disabled={timeLeft === totalDuration && accumulatedTimeMs === 0}
              className={`p-3.5 rounded-full border border-white/5 transition duration-200 cursor-pointer text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none`}
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            {/* Core Play / Pause Action */}
            <button
              onClick={isRunning ? handlePause : handlePlay}
              disabled={isSaving}
              className="p-5 rounded-full bg-white hover:bg-gray-100 text-[#050811] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-xl shadow-white/10 flex items-center justify-center"
              title={isRunning ? (sessionPhase === 'break' ? "Pause Break" : "Pause Session") : (sessionPhase === 'break' ? "Start Break" : "Start Session")}
            >
              {isRunning ? <Pause size={24} className="fill-[#050811]" /> : <Play size={24} className="fill-[#050811] ml-0.5" />}
            </button>

            {/* End Focus Action (Persists elapsed minutes to backend) */}
            <button
              onClick={handleManualEnd}
              disabled={accumulatedTimeMs === 0 && !isRunning}
              className={`p-3.5 rounded-full border border-rose-500/20 text-rose-400 hover:text-white hover:bg-rose-500/10 transition duration-200 cursor-pointer bg-rose-500/5 disabled:opacity-30 disabled:pointer-events-none`}
              title={sessionPhase === 'break' ? "End Break" : "End Focus and Save Session"}
            >
              <Square size={18} className="fill-current" />
            </button>
          </div>

          {/* Current Session Stats Indicator */}
          {accumulatedTimeMs > 0 && (
            <div className="text-[11px] text-gray-400 bg-white/5 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-300">
              {sessionPhase === 'break' ? 'Break Progress: ' : 'Session Progress: '}
              <strong className="text-white font-mono">{Math.round(accumulatedTimeMs / 1000)}s</strong> {sessionPhase === 'break' ? 'elapsed' : 'focused'}
            </div>
          )}
        </div>
      </footer>

      {/* FULLSCREEN GLASSMORPHIC SAVING BACKEND MODAL */}
      {(isSaving || isCompleted) && (
        <div className="absolute inset-0 bg-[#050811]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-all duration-500">
          <div className="bg-white/5 border border-white/5 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-5">
            {isSaving ? (
              <>
                <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <h3 className="font-bold text-white text-base">Storing focus logs...</h3>
                  <p className="text-xs text-gray-400 mt-1">Uploading focus minutes to database.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {sessionPhase === 'break' ? 'Break Finished!' : 'Well Done Scholar!'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium text-emerald-300">
                    {sessionPhase === 'break' ? 'Ready to get back to work?' : 'Focus block successfully completed.'}
                  </p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-lg shadow-violet-500/25"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Daily Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0e17] border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            {/* Ambient purple/blue blur glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

            <div className="text-center space-y-2 relative">
              <div className="inline-flex p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl mb-1">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Set Your Daily Focus Target</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Define your daily target to track consistency. Meet this target to boost your consistency health bar!
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: '15 Min', value: 15 },
                { label: '30 Min', value: 30 },
                { label: '1 Hour', value: 60 },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedTarget(opt.value);
                    setIsCustom(false);
                  }}
                  className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                    !isCustom && selectedTarget === opt.value
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-950/20 scale-[1.02]'
                      : 'bg-[#111625] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setIsCustom(true)}
                className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isCustom
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-950/20 scale-[1.02]'
                    : 'bg-[#111625] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Input */}
            {isCustom && (
              <div className="space-y-2 animate-in slide-in-from-top duration-200">
                <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Minutes</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 45"
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  className="w-full bg-[#111625] border border-gray-800 rounded-2xl p-3 text-sm text-white font-mono outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                />
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={async () => {
                const targetVal = isCustom ? parseInt(customValue, 10) : selectedTarget;
                if (isNaN(targetVal) || targetVal <= 0) {
                  alert('Please enter a valid number of minutes.');
                  return;
                }
                try {
                  await updateDailyTarget({ dailyTarget: targetVal }).unwrap();
                  dispatch(updateUser({ dailyTarget: targetVal }));
                  setShowTargetModal(false);
                } catch (e) {
                  console.error('Failed to save daily target', e);
                  alert('Could not save target. Please try again.');
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-950/20 hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
            >
              Save and Start Focusing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
