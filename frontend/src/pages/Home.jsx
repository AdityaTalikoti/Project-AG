import React from 'react';
import { useSelector } from 'react-redux';
import { useGetDashboardStatsQuery, useGetActiveGoalQuery } from '../store/apiSlice';
import HeroCTA from '../components/HeroCTA';
import WeeklyProgress from '../components/WeeklyProgress';
import RoadmapStepper from '../components/RoadmapStepper';
import QuickActions from '../components/QuickActions';
import Widgets from '../components/Widgets';
import AchievementsList from '../components/AchievementsList';
import { Flame, Clock, CheckCircle, Zap, Trophy } from 'lucide-react';

export default function Home() {
  const { user } = useSelector((state) => state.auth);
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: goalData, isLoading: goalLoading } = useGetActiveGoalQuery();

  const isLoading = statsLoading || goalLoading;
  const stats = statsData?.data || {};
  const goal = goalData?.data || {};

  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Scholar';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Welcome and Quote Bar ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0e1a]/40 p-5 rounded-2xl border border-[#121829] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Good evening, {studentFirstName}! 👋</h1>
          <p className="text-xs text-gray-400 mt-1">You're building consistency. Keep the momentum going!</p>
        </div>
        <div className="bg-[#111625] px-4 py-2.5 rounded-xl border border-[#1b2237] max-w-sm">
          <p className="text-[11px] italic text-gray-300">"The expert in anything was once a beginner."</p>
          <span className="text-[9px] text-gray-500 font-medium block mt-1 text-right">— Helen Hayes</span>
        </div>
      </div>

      {/* ── Top Metrics Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Streak */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex items-center gap-4">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Flame size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">Streak</span>
            <span className="text-lg font-bold text-white block mt-0.5">{stats.streak || 0} Days</span>
            <span className="text-[9px] text-gray-500 block">Best: {stats.bestStreak || 18} days</span>
          </div>
        </div>

        {/* Focus Hours */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex items-center gap-4">
          <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-purple-400">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">Focus Hours</span>
            <span className="text-lg font-bold text-white block mt-0.5">34.2 hrs</span>
            <span className="text-[9px] text-emerald-400 font-medium block">↑ 12% this week</span>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex items-center gap-4">
          <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 text-blue-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">Tasks</span>
            <span className="text-lg font-bold text-white block mt-0.5">82 Completed</span>
            <span className="text-[9px] text-emerald-400 font-medium block">↑ 28% this week</span>
          </div>
        </div>

        {/* Consistency */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex items-center gap-4">
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-amber-400">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">Consistency</span>
            <span className="text-lg font-bold text-white block mt-0.5">92%</span>
            <span className="text-[9px] text-amber-400 font-medium block">Excellent</span>
          </div>
        </div>

        {/* Rank */}
        <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-[#121829] shadow-sm flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-rose-400">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">Rank</span>
            <span className="text-lg font-bold text-white block mt-0.5">Top 8%</span>
            <span className="text-[9px] text-gray-500 block">Among learners</span>
          </div>
        </div>
      </div>

      {/* ── Main Grid Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Goals and Visual Progress */}
        <div className="lg:col-span-2 space-y-6">
          <HeroCTA goal={goal} isLoading={isLoading} />
          <WeeklyProgress weeklyData={stats.weeklyProgress} isLoading={isLoading} />
          <RoadmapStepper roadmap={goal.roadmap} isLoading={isLoading} />
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
