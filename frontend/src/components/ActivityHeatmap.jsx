import React from 'react';
import { Flame } from 'lucide-react';

export default function ActivityHeatmap({ heatmap = [], streak = 0, isLoading }) {
  if (isLoading) {
    return <div className="bg-[#1f2937] p-6 rounded-2xl h-48 animate-pulse border border-gray-800" />;
  }

  const getCellColor = (score) => {
    if (score === 0) return 'bg-gray-800';
    if (score <= 3) return 'bg-emerald-900';
    if (score <= 7) return 'bg-emerald-600';
    return 'bg-emerald-400';
  };

  return (
    <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Activity Heatmap</h3>
        <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-lg border border-gray-700">
          <Flame className="text-orange-500" size={16} />
          <span className="text-white font-mono text-sm">{streak} Day Streak</span>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="flex gap-1 min-w-max">
          {heatmap.map((day, idx) => (
            <div 
              key={idx} 
              title={`${day.date}: ${day.score} points`}
              className={`w-4 h-4 rounded-sm ${getCellColor(day.score)} transition hover:ring-2 hover:ring-white`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
