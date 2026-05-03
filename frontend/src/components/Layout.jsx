import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap, Activity, User, Home, BookOpen } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#111827] text-gray-200 font-sans">
      <nav className="border-b border-gray-800 bg-[#1f2937]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <GraduationCap className="text-emerald-400" size={24} />
                </div>
                <span className="font-bold text-xl tracking-tight text-white hidden sm:block">Scholar<span className="text-emerald-400">Sync</span></span>
              </Link>
              
              <div className="hidden md:flex items-center gap-4 ml-6 border-l border-gray-700 pl-6">
                <Link to="/" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
                  <Home size={18} /> Dashboard
                </Link>
                <Link to="/journal/new" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
                  <BookOpen size={18} /> Journal
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm">
                <Activity size={18} />
                <span className="hidden sm:inline">Mentor Portal</span>
              </button>
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                <User size={16} className="text-gray-300" />
              </div>
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
