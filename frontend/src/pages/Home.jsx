import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useGetDashboardStatsQuery, useGetDashboardInsightQuery, useGetActiveGoalQuery, useGetEventsQuery } from '../store/apiSlice';
import HeroCTA from '../components/HeroCTA';
import WeeklyProgress from '../components/WeeklyProgress';
import Widgets from '../components/Widgets';
import StudyPlanner from '../components/ai/StudyPlanner';
import QuickCreateEventModal from '../components/QuickCreateEventModal';
import { 
  Flame, Clock, CheckCircle, Zap, Play,
  Calendar as CalendarIcon, Search, 
  Filter, Timer, AlertCircle, Plus, Check, ArrowUpRight 
} from 'lucide-react';

const formatFocusTime = (hours) => {
  if (hours === undefined || hours === null || hours === 0) return '0 minutes';
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes === 0) return '0 minutes';
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hStr = h === 1 ? '1 hour' : `${h} hours`;
  const mStr = m > 0 ? ` ${m} minutes` : '';
  return `${hStr}${mStr}`;
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Dynamic dashboard stats and events queries
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: goalData, isLoading: goalLoading } = useGetActiveGoalQuery();
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useGetEventsQuery();
  const { data: insightData, isLoading: insightLoading, isError: insightError } = useGetDashboardInsightQuery();

  const isLoading = statsLoading || goalLoading || eventsLoading;
  const stats = statsData?.data || {};
  const allEvents = eventsData?.data || [];

  const currentWeekDots = stats.currentWeekDots || [
    { label: 'M', active: false }, { label: 'T', active: false }, { label: 'W', active: false },
    { label: 'T', active: false }, { label: 'F', active: false }, { label: 'S', active: false }, { label: 'S', active: false }
  ];

  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Scholar';

  const getConsistencyColor = (label) => {
    if (label === 'Excellent') return 'text-emerald-400';
    if (label === 'Good') return 'text-amber-400';
    if (label === 'Fair') return 'text-blue-400';
    return 'text-rose-400';
  };

  // Real-time tick hook for countdown updates
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000); // refresh every 15s
    return () => clearInterval(timer);
  }, []);

  // Quick event create modal state
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Search & Filter Panel State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [scheduleView, setScheduleView] = useState('Today'); // 'Today' | 'Upcoming'

  // Extract non-hardcoded categories dynamically
  const dynamicCategories = ['All', ...Array.from(new Set(allEvents.map(e => e.category).filter(Boolean)))];

  // Helper to check if event date overlaps with target day
  const isEventOnDay = (evt, date) => {
    const dStr = date.toISOString().split('T')[0];
    const startStr = new Date(evt.startDateTime).toISOString().split('T')[0];
    const endStr = new Date(evt.endDateTime).toISOString().split('T')[0];
    return dStr >= startStr && dStr <= endStr;
  };

  // 1. Today's Events List
  const todayEvents = allEvents.filter(evt => {
    const today = new Date(now);
    return isEventOnDay(evt, today);
  }).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  // 2. Upcoming Events List
  const upcomingEvents = allEvents.filter(evt => {
    return new Date(evt.startDateTime) > now;
  }).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  // 3. Next Event Calculations
  const nextEvent = upcomingEvents[0] || null;

  const getRemainingTimeStr = (startDateTimeStr) => {
    const start = new Date(startDateTimeStr);
    const diffMs = start - now;

    if (diffMs <= 0) {
      return "Starting now";
    }

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      const remainingMins = diffMins % 60;
      return `in ${diffHours} hr${diffHours > 1 ? 's' : ''} ${remainingMins > 0 ? `${remainingMins}m` : ''}`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "tomorrow";
    return `in ${diffDays} days`;
  };

  // 4. Filter Schedule listings
  const filteredScheduleEvents = (scheduleView === 'Today' ? todayEvents : upcomingEvents).filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (evt.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getEventTimeStr = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const dateOptions = { month: 'short', day: 'numeric' };

    const startTime = start.toLocaleTimeString([], timeOptions);
    const endTime = end.toLocaleTimeString([], timeOptions);

    if (scheduleView === 'Today') {
      return `${startTime} - ${endTime}`;
    } else {
      return `${start.toLocaleDateString([], dateOptions)}, ${startTime}`;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome and Quote Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0e1a]/40 p-5 rounded-2xl border border-[#121829] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Good evening, {studentFirstName}! 👋</h1>
          <p className="text-xs text-gray-400 mt-1">You're building consistency. Keep the momentum going!</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}} />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="bg-[#111625] px-4 py-2.5 rounded-xl border border-[#1b2237] max-w-sm hidden md:block">
            <p className="text-[11px] italic text-gray-300">"The expert in anything was once a beginner."</p>
            <span className="text-[9px] text-gray-500 font-medium block mt-1 text-right">— Helen Hayes</span>
          </div>
          <Link
            to="/dashboard/focus"
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20 hover:shadow-purple-700/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Play size={14} className="fill-white" />
            <span>Start Focus Session</span>
          </Link>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Focus Hours */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Focus Hours</span>
            <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20 text-purple-400">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-white block mt-1.5">
              {formatFocusTime(stats.focusHours?.current)}
            </span>
            <span className="text-[9px] text-gray-500 block mt-1">
              Target: {user?.dailyTarget ? `${user.dailyTarget} min` : 'Not set'}
            </span>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Tasks</span>
            <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 text-blue-400">
              <CheckCircle size={16} />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-white block mt-1.5">
              {stats.tasksCompleted?.current || 0} Completed
            </span>
            <span className={`text-[9px] font-medium block mt-1 ${stats.tasksCompleted?.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.tasksCompleted?.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.tasksCompleted?.trend || 0)}% this week
            </span>
          </div>
        </div>

        {/* Consistency */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Consistency</span>
            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-amber-400">
              <Zap size={16} />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-white block mt-1.5">
              {stats.consistency?.score || 0}%
            </span>
            <span className={`text-[9px] font-semibold block mt-1 ${getConsistencyColor(stats.consistency?.label)}`}>
              {stats.consistency?.label || 'Needs Practice'}
            </span>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Streak</span>
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
              <Flame size={16} className="animate-pulse" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-1.5">
            <div>
              <span className="text-xl font-bold text-white block">
                {stats.streak || 0} Days
              </span>
              <span className="text-[9px] text-gray-500 block mt-0.5">
                Best: {stats.bestStreak || 0} days
              </span>
            </div>
            {/* Weekly dots grid */}
            <div className="flex gap-1 mb-0.5">
              {currentWeekDots.map((dot, idx) => (
                <div key={idx} className="flex flex-col items-center gap-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${dot.active ? 'bg-emerald-500 ring-1 ring-emerald-500/20' : 'bg-gray-800'}`} />
                  <span className="text-[8px] text-gray-500 font-medium">{dot.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Goals, Progress Graphs, & Interactive Schedule list */}
        <div className="lg:col-span-2 space-y-6">
          
          <HeroCTA activeRoadmap={stats.activeRoadmap} hasActiveRoadmap={stats.hasActiveRoadmap} isLoading={isLoading} />
          
          {/* Today's Schedule & Upcoming Events Combined Panel */}
          <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-900 pb-4">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <CalendarIcon size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Study Schedule</h3>
                  <span className="text-[10px] text-gray-500 font-medium">Keep track of your milestones & sessions</span>
                </div>
              </div>

              {/* View Selector (Today / Upcoming) */}
              <div className="flex items-center bg-[#111625] p-1 border border-gray-900 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setScheduleView('Today')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                    scheduleView === 'Today' ? 'bg-[#0a0e1a] text-emerald-400 shadow-sm border border-gray-850' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setScheduleView('Upcoming')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                    scheduleView === 'Upcoming' ? 'bg-[#0a0e1a] text-emerald-400 shadow-sm border border-gray-850' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Upcoming
                </button>
              </div>
            </div>

            {/* Search & Dynamic Filters Block */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* Text Search */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder={`Search ${scheduleView.toLowerCase()} events...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#111625] border border-gray-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Dynamic Category Selector */}
              <div className="flex items-center gap-2 bg-[#111625] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-gray-400">
                <Filter size={12} className="text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent border-0 text-white placeholder-gray-500 text-xs focus:outline-none cursor-pointer w-24"
                >
                  {dynamicCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-[#0b0e17] text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listings Grid */}
            {isLoading ? (
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center bg-[#0a0e1a]/40 p-4 rounded-xl border border-[#121829] animate-pulse">
                    <div className="space-y-2 flex-1 max-w-md">
                      <div className="h-3.5 bg-gray-850 rounded-md w-2/3" />
                      <div className="h-2 bg-gray-850 rounded-md w-1/3" />
                    </div>
                    <div className="h-6 bg-gray-850 rounded-md w-16" />
                  </div>
                ))}
              </div>
            ) : filteredScheduleEvents.length > 0 ? (
              <div className="space-y-2.5 pt-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredScheduleEvents.map((evt) => (
                  <div 
                    key={evt._id} 
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#0d1222]/50 hover:bg-[#0d1222] border border-[#161d31] rounded-2xl transition duration-200"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-1.5 h-8 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: evt.color || '#8B5CF6' }} />
                      <div className="min-w-0 space-y-1">
                        <h4 className="text-xs font-bold text-white truncate">{evt.title}</h4>
                        {evt.description && (
                          <p className="text-[10px] text-gray-400 truncate max-w-sm sm:max-w-md">{evt.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-500 font-mono font-medium flex items-center gap-1">
                            <Clock size={10} />
                            {getEventTimeStr(evt.startDateTime, evt.endDateTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <span 
                      className="self-start sm:self-auto text-[9px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0"
                      style={{ 
                        color: evt.color || '#8B5CF6', 
                        borderColor: `${evt.color || '#8B5CF6'}1f`, 
                        backgroundColor: `${evt.color || '#8B5CF6'}0a` 
                      }}
                    >
                      {evt.category || 'Study'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Attractive Empty States */
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 bg-[#0d1222]/20 border border-[#161d31]/40 border-dashed rounded-2xl animate-in fade-in duration-300">
                <div className="w-10 h-10 bg-gray-900 border border-gray-800 text-gray-500 rounded-full flex items-center justify-center">
                  <AlertCircle size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">No Schedule Milestones Found</h4>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                    {searchTerm 
                      ? 'No events match your current query or category filter. Try clearing filters.'
                      : scheduleView === 'Today' 
                      ? "Your day looks clear! Use Quick Actions or head to the Calendar to plan a study sprint."
                      : "No upcoming study blocks. Add learning milestones to populate your timeline."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          <WeeklyProgress weeklyData={stats.weeklyProgress} isLoading={isLoading} />
        </div>

        {/* Right Column: Actions, Countdown, Mini-Calendar, & AI Insights */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Actions (Dashboard Specific) */}
          <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => setQuickCreateOpen(true)}
                className="flex items-center justify-between gap-3 px-3.5 py-3 border border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-400 rounded-xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Plus size={15} />
                  <span>Create Event</span>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Quick</span>
              </button>
              
              <button
                onClick={() => navigate('/dashboard/calendar')}
                className="flex items-center justify-between gap-3 px-3.5 py-3 border border-purple-500/20 hover:bg-purple-500/5 text-purple-400 rounded-xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarIcon size={15} />
                  <span>Open Calendar</span>
                </div>
                <ArrowUpRight size={14} className="text-purple-500/60" />
              </button>
              
              <button
                onClick={() => {
                  setScheduleView('Today');
                  // scroll to schedule panel
                  document.querySelector('.lg\\:col-span-2')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-between gap-3 px-3.5 py-3 border border-blue-500/20 hover:bg-blue-500/5 text-blue-400 rounded-xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Clock size={15} />
                  <span>View Today's Schedule</span>
                </div>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  {todayEvents.length}
                </span>
              </button>
            </div>
          </div>

          {/* Next Event Countdown Card */}
          <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm space-y-3.5">
            <div className="flex justify-between items-center border-b border-gray-900 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Timer size={14} className="text-purple-400" />
                Next Event
              </h3>
              {nextEvent && (
                <span className="text-[9px] text-gray-500 font-mono font-medium">
                  {getRemainingTimeStr(nextEvent.startDateTime)}
                </span>
              )}
            </div>

            {nextEvent ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white truncate">{nextEvent.title}</h4>
                  {nextEvent.description && (
                    <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{nextEvent.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] bg-[#111625]/60 p-2.5 rounded-xl border border-gray-900">
                  <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                    <CalendarIcon size={12} className="text-gray-500" />
                    <span>
                      {new Date(nextEvent.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                    <Clock size={12} className="text-gray-500" />
                    <span>
                      {new Date(nextEvent.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-0.5">
                  <span 
                    className="text-[9px] font-bold px-2 py-0.5 rounded-lg border"
                    style={{ 
                      color: nextEvent.color || '#8B5CF6', 
                      borderColor: `${nextEvent.color || '#8B5CF6'}1f`, 
                      backgroundColor: `${nextEvent.color || '#8B5CF6'}0a` 
                    }}
                  >
                    {nextEvent.category || 'Study'}
                  </span>
                  <button 
                    onClick={() => navigate('/dashboard/calendar')}
                    className="text-[9px] text-purple-400 font-bold hover:text-purple-300 transition flex items-center gap-0.5 cursor-pointer"
                  >
                    View in Calendar →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-1">
                <p className="text-xs font-bold text-gray-500">No upcoming events</p>
                <p className="text-[10px] text-gray-650 max-w-[200px] mx-auto">Create a study sprint or import milestones to see count-downs.</p>
              </div>
            )}
          </div>



          <StudyPlanner />

          <Widgets 
            upcomingTasks={stats.upcomingTasks}
            aiInsight={insightData}
            isLoading={isLoading}
            insightLoading={insightLoading}
            insightError={insightError}
          />
        </div>
      </div>

      {/* Floating Success Alert Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-xs font-semibold shadow-xl flex items-center gap-2 pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick create modal trigger */}
      <QuickCreateEventModal
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          if (refetchEvents) refetchEvents();
        }}
      />
    </div>
  );
}
