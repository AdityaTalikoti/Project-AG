import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Construction, ArrowLeft } from 'lucide-react';

export default function ComingSoonPage({ title }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative space-y-6 max-w-md w-full">
        {/* Pulsing indicator pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 animate-pulse">
          <Construction size={12} />
          Under Development
        </div>

        {/* Dynamic Icon */}
        <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-purple-500/15 to-indigo-500/15 border border-purple-500/20 text-purple-400 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-950/20 animate-bounce">
          <Rocket size={36} className="text-purple-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Module</span>
          </h2>
          <h3 className="text-lg font-bold text-gray-300">Coming Soon</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            🚀 This feature is currently under development. Our team is engineering an intelligent, gamified experience for this module.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition duration-200 shadow-lg shadow-purple-950/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
