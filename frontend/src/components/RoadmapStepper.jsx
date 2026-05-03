import React from 'react';
import { CheckCircle2, Circle, ArrowRightCircle } from 'lucide-react';

export default function RoadmapStepper({ roadmap = [], isLoading }) {
  if (isLoading) {
    return <div className="bg-[#1f2937] p-6 rounded-2xl h-64 animate-pulse border border-gray-800" />;
  }

  return (
    <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-6">Action Plan</h3>
      <div className="space-y-6">
        {roadmap.map((task, idx) => (
          <div key={task.id} className="flex items-start gap-4 relative">
            {idx !== roadmap.length - 1 && (
              <div className="absolute left-3 top-8 bottom-[-24px] w-0.5 bg-gray-700" />
            )}
            
            <div className="mt-0.5 z-10 bg-[#1f2937]">
              {task.status === 'completed' && <CheckCircle2 className="text-emerald-500" size={24} />}
              {task.status === 'current' && <ArrowRightCircle className="text-amber-500" size={24} />}
              {task.status === 'upcoming' && <Circle className="text-gray-600" size={24} />}
            </div>
            
            <div>
              <p className={`font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : task.status === 'current' ? 'text-white' : 'text-gray-500'}`}>
                {task.title}
              </p>
              {task.status === 'current' && (
                <span className="text-xs text-amber-500 font-mono mt-1 block">In Progress</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
