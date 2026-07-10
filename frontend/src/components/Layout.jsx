import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { useGetDashboardStatsQuery } from '../store/apiSlice';
import {
  GraduationCap, Home, BookOpen, Compass, CheckSquare, Layers,
  FileText, BarChart2, Settings, LogOut, Search, Bell, Calendar, 
  Moon, Sun, Menu
} from 'lucide-react';

export default function Layout() {
  const { user } = useSelector((state) => state.auth);
  const { data: statsRes } = useGetDashboardStatsQuery(undefined, { skip: !user });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isSidebarExpanded = isHovered || mobileMenuOpen;

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const stats = statsRes?.data || {};
  const levelInfo = stats.levelInfo || { level: 1, name: "Loading...", xp: 0, maxXp: 1000 };
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
    { name: 'Calendar', path: '/dashboard/calendar', icon: Calendar },
    { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Flashcards', path: '/dashboard/flashcards', icon: Layers },
    { name: 'Notes', path: '/dashboard/notes', icon: FileText },
    { name: 'Progress', path: '/dashboard/progress', icon: BarChart2 },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-gray-200 font-sans flex">
      {/* ── Left Sidebar (Desktop) ── */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 bg-[#0a0e1a] border-r border-[#121829] flex flex-col justify-between transform transition-all duration-300 md:translate-x-0 ${
          isSidebarExpanded ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {/* Logo */}
          <div className={`flex items-center justify-between mb-8 px-2 ${!isSidebarExpanded ? 'justify-center' : ''}`}>
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex-shrink-0">
                <GraduationCap className="text-emerald-400" size={22} />
              </div>
              {isSidebarExpanded && (
                <span className="font-bold text-lg tracking-tight text-white animate-in fade-in duration-300">
                  Scholar<span className="text-emerald-400">Sync</span>
                </span>
              )}
            </Link>
            {isSidebarExpanded && mobileMenuOpen && (
              <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            )}
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                    active ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400' : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                  } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                  title={!isSidebarExpanded ? item.name : undefined}
                >
                  <Icon size={18} className={`flex-shrink-0 ${active ? 'text-emerald-400' : 'text-gray-400'}`} />
                  {isSidebarExpanded && (
                    <span className="animate-in fade-in duration-300 truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#121829]">
          {/* User profile actions */}
          {user && (
            <div className={`flex items-center justify-between px-2 ${!isSidebarExpanded ? 'justify-center' : ''}`}>
              <div className="flex items-center gap-2 min-w-0">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full border border-[#1c2237] object-cover flex-shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-indigo-500 flex-shrink-0">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                {isSidebarExpanded && (
                  <div className="flex flex-col max-w-[120px] animate-in fade-in duration-300 min-w-0">
                    <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                    <span className="text-[10px] text-gray-500 truncate">{user.role || 'Student'}</span>
                  </div>
                )}
              </div>
              {isSidebarExpanded && (
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-gray-900/50" title="Logout">
                  <LogOut size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-20">
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
            <button 
              onClick={() => navigate('/dashboard/calendar')}
              className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-[#111625]"
              title="Open Calendar"
            >
              <Calendar size={18} />
            </button>
            <button 
              onClick={toggleTheme}
              className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-[#111625]"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} className="text-amber-500" />}
            </button>

            {/* Profile Avatar Card with Hover Dropdown */}
            {user && (
              <div 
                className="relative"
                onMouseEnter={() => setProfileDropdownOpen(true)}
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div className="flex items-center gap-3 pl-3 border-l border-[#1b2237] cursor-pointer">
                  <div className="flex flex-col text-right hidden lg:flex">
                    <span className="text-xs font-semibold text-white">{user.name}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">{user.role || 'Student'}</span>
                  </div>
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full border border-emerald-500/20 object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold border border-emerald-500/20">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Profile Hover Dropdown Panel */}
                <div className={`absolute right-0 top-full mt-2 w-64 bg-[#0a0e1a] border border-[#1b2237] rounded-2xl p-4 shadow-xl z-50 transition-all duration-200 origin-top-right transform ${
                  profileDropdownOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}>
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-900/60">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="h-10 w-10 rounded-full border border-[#1c2237] object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold border border-indigo-500">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                      <span className="text-[10px] text-gray-500 truncate">{user.email}</span>
                    </div>
                  </div>

                  {/* Level Progress Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-400 font-bold">Level {levelInfo.level}</span>
                      <span className="text-gray-400 font-medium">{levelInfo.name}</span>
                    </div>
                    <div className="w-full bg-[#1c2237] h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(levelInfo.xp / levelInfo.maxXp) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-right text-gray-500 font-mono">
                      {levelInfo.xp.toLocaleString()} / {levelInfo.maxXp.toLocaleString()} XP
                    </div>
                  </div>
                  
                  {/* Quick logout */}
                  <button 
                    onClick={handleLogout} 
                    className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
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
