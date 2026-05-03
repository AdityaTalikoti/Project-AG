import React from 'react';
import { Pin, Users, Sparkles } from 'lucide-react';

export default function Widgets({ mentorPinned = [], peerPulse = [], aiInsight, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-[#1f2937] rounded-2xl animate-pulse" />
        <div className="h-40 bg-[#1f2937] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insight Card */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-[#1f2937] p-6 rounded-2xl border border-indigo-800/50 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-indigo-400" size={18} />
          <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">AI Insight</h3>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{aiInsight}</p>
      </div>

      {/* Mentor's Corner */}
      <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-800 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Pin className="text-rose-400" size={18} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mentor's Corner</h3>
        </div>
        <ul className="space-y-3">
          {mentorPinned.map(task => (
            <li key={task.id} className="flex items-start gap-3 text-sm">
              <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              <span className="text-gray-300">{task.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Peer Pulse */}
      <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-800 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-blue-400" size={18} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Peer Pulse</h3>
        </div>
        <ul className="space-y-4">
          {peerPulse.map(peer => (
            <li key={peer.id} className="text-sm border-l-2 border-gray-700 pl-3">
              <span className="font-bold text-gray-200">{peer.user}</span> <span className="text-gray-400">{peer.action}</span>
              <span className="block text-xs text-gray-500 mt-1 font-mono">{peer.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
