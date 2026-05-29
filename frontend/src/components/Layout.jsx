import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { useGetDashboardStatsQuery } from '../store/apiSlice';
import {
  GraduationCap, Home, BookOpen, Compass, CheckSquare, Layers,
  FileText, BarChart2, LineChart, Award, Users, Activity,
  Settings, LogOut, Search, Bell, Calendar, Moon, Flame, Menu, X
} from 'lucide-react';

export default function Layout() {
  const { user } = useSelector((state) => state.auth);
  const { data: statsRes } = useGetDashboardStatsQuery(undefined, { skip: !user });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = statsRes?.data || {};
  const levelInfo = stats.levelInfo || { level: 12, name: "Full Stack Explorer", xp: 2450, maxXp: 3000 };
  const currentWeekDots = stats.currentWeekDots || [
    { label: 'M', active: true }, { label: 'T', active: true }, { label: 'W', active: true },
    { label: 'T', active: true }, { label: 'F', active: false }, { label: 'S', active: false }, { label: 'S', active: false }
  ];

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Journal', path: '/dashboard/journal/new', icon: BookOpen },
    { name: 'Roadmap', path: '/dashboard/roadmap', icon: Compass },
    { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Flashcards', path: '/dashboard/flashcards', icon: Layers },
    { name: 'Notes', path: '/dashboard/notes', icon: FileText },
    { name: 'Progress', path: '/dashboard/progress', icon: BarChart2 },
    { name: 'Analytics', path: '/dashboard/analytics', icon: LineChart },
    { name: 'Achievements', path: '/dashboard/achievements', icon: Award },
    { name: 'Peers', path: '/dashboard/peers', icon: Users },
    { name: 'Mentor Portal', path: '/dashboard/mentor', icon: Activity },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-gray-200 font-sans flex">
      {/* ── Left Sidebar (Desktop) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0e1a] border-r border-[#121829] flex flex-col justify-between transform transition-transform duration-300 md:translate-x-0 md:static md:flex-shrink-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 px-2">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <GraduationCap className="text-emerald-400" size={22} />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Scholar<span className="text-emerald-400">Sync</span></span>
            </Link>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${active ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400' : 'text-gray-400 hover:text-white hover:bg-gray-900/50'}`}
                >
                  <Icon size={18} className={active ? 'text-emerald-400' : 'text-gray-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Cards */}
        <div className="p-4 border-t border-[#121829] space-y-4">
          {/* XP Progress Card */}
          <div className="bg-[#111625] p-3 rounded-2xl border border-[#1b2237] shadow-md">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-emerald-400 font-bold">Level {levelInfo.level}</span>
              <span className="text-gray-400 font-medium">{levelInfo.name}</span>
            </div>
            <div className="w-full bg-[#1c2237] h-2 rounded-full overflow-hidden mb-1">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(levelInfo.xp / levelInfo.maxXp) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-right text-gray-500 font-mono">
              {levelInfo.xp.toLocaleString()} / {levelInfo.maxXp.toLocaleString()} XP
            </div>
          </div>

          {/* Week Streak dots */}
          <div className="bg-[#111625] p-3 rounded-2xl border border-[#1b2237] shadow-md flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                <Flame className="text-orange-500 animate-pulse" size={14} />
                <span>{stats.streak || 0} Day Streak</span>
              </div>
              {/* Dots grid */}
              <div className="flex gap-1.5 mt-2">
                {currentWeekDots.map((dot, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${dot.active ? 'bg-emerald-500 text-gray-950 ring-2 ring-emerald-500/20' : 'bg-gray-800 text-gray-500'}`} />
                    <span className="text-[9px] text-gray-500 font-medium">{dot.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User profile actions */}
          {user && (
            <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-900/60">
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full border border-[#1c2237] object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-indigo-500">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col max-w-[120px]">
                  <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                  <span className="text-[10px] text-gray-500 truncate">{user.role || 'Student'}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-gray-900/50" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#0a0e1a]/80 backdrop-blur-md border-b border-[#121829] px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={22} />
            </button>
            
            {/* Search Input */}
            <div className="relative max-w-md w-full hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full bg-[#111625] border border-[#1b2237] rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-gray-600 font-mono pointer-events-none">
                ⌘ K
              </span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-[#111625] relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0a0e1a]" />
            </button>
            <button className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-[#111625]">
              <Calendar size={18} />
            </button>
            <button className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-[#111625]">
              <Moon size={18} />
            </button>

            {/* Profile Avatar Card */}
            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-[#1b2237]">
                <div className="flex flex-col text-right hidden lg:flex">
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] text-emerald-400 font-medium">MERN Learner</span>
                </div>
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full border border-emerald-500/20 object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold border border-emerald-500/20">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
