import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetDashboardStatsQuery, useGetActiveGoalQuery } from '../store/apiSlice';
import HeroCTA from '../components/HeroCTA';
import WeeklyProgress from '../components/WeeklyProgress';
import RoadmapStepper from '../components/RoadmapStepper';
import QuickActions from '../components/QuickActions';
import Widgets from '../components/Widgets';
import AchievementsList from '../components/AchievementsList';
import { Flame, Clock, CheckCircle, Zap, Play, Compass, Target } from 'lucide-react';

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
  const { user } = useSelector((state) => state.auth);
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: goalData, isLoading: goalLoading } = useGetActiveGoalQuery();

  const isLoading = statsLoading || goalLoading;
  const stats = statsData?.data || {};
  const goal = goalData?.data || {};
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Welcome and Quote Bar ── */}
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


      {/* ── Top Metrics Grid ── */}
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

        {/* Streak & Weekly Progress */}
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
            {/* Weekly dots grid inside the card */}
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

      {/* ── Main Grid Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Goals and Visual Progress */}
        <div className="lg:col-span-2 space-y-6">
          <HeroCTA activeRoadmap={stats.activeRoadmap} hasActiveRoadmap={stats.hasActiveRoadmap} isLoading={isLoading} />
          <WeeklyProgress weeklyData={stats.weeklyProgress} isLoading={isLoading} />
        </div>

        {/* Right Column - Actions and Lists */}
        <div className="lg:col-span-1 space-y-6">
          <QuickActions />
          <Widgets 
            upcomingTasks={stats.upcomingTasks}
            aiInsight={stats.aiInsight}
            isLoading={isLoading} 
          />
          <AchievementsList achievements={stats.achievements} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
