import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { GraduationCap, Activity, Home, BookOpen, LogOut } from 'lucide-react';

export default function Layout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#111827] text-gray-200 font-sans">
      <nav className="border-b border-gray-800 bg-[#1f2937]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <GraduationCap className="text-emerald-400" size={24} />
                </div>
                <span className="font-bold text-xl tracking-tight text-white hidden sm:block">Scholar<span className="text-emerald-400">Sync</span></span>
              </Link>
              
              <div className="hidden md:flex items-center gap-4 ml-6 border-l border-gray-700 pl-6">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
                  <Home size={18} /> Dashboard
                </Link>
                <Link to="/dashboard/journal/new" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
                  <BookOpen size={18} /> Journal
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm">
                <Activity size={18} />
                <span className="hidden sm:inline">Mentor Portal</span>
              </button>

              {/* ── User Profile + Logout ── */}
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 hidden sm:inline">{user.name}</span>
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-gray-600 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-500 text-white text-sm font-bold">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-gray-800"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
