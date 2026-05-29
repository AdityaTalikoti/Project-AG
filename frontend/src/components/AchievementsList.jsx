import React from 'react';
import { Flame, Sparkles, Trophy, BookOpen } from 'lucide-react';

export default function AchievementsList({ achievements = [], isLoading }) {
  if (isLoading) {
    return <div className="bg-[#0a0e1a] p-5 rounded-2xl h-36 animate-pulse border border-[#121829]" />;
  }

  const iconsMap = {
    "Consistency King": Flame,
    "Early Bird": Sparkles,
    "Problem Solver": Trophy,
    "Journal Master": BookOpen
  };

  return (
    <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Achievements</h3>
        <button className="text-[10px] text-gray-500 font-semibold hover:text-emerald-400 transition cursor-pointer">
          View All →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {achievements.map((ach) => {
          const Icon = iconsMap[ach.title] || Trophy;
          return (
            <div 
              key={ach.title} 
              className="flex flex-col items-center text-center group cursor-help"
              title={`${ach.title}: ${ach.desc}`}
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${ach.color}`}>
                <Icon size={20} />
              </div>
              <span className="text-[9px] font-semibold text-gray-300 truncate w-full mt-2 tracking-tight">
                {ach.title}
              </span>
              <span className="text-[8px] text-gray-500 truncate w-full mt-0.5 font-medium">
                {ach.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
