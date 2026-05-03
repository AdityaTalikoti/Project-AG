import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Edit3 } from 'lucide-react';

export default function HeroCTA({ goal, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-[#1f2937] p-8 rounded-2xl shadow-lg border border-gray-800 flex flex-col md:flex-row items-center justify-between animate-pulse">
        <div className="h-32 w-32 bg-gray-700 rounded-full mb-6 md:mb-0" />
        <div className="h-12 w-48 bg-gray-700 rounded-lg" />
      </div>
    );
  }

  const completion = goal?.completionPercentage || 0;
  const data = [
    { name: 'Completed', value: completion },
    { name: 'Remaining', value: 100 - completion }
  ];
  
  return (
    <div className="bg-[#1f2937] p-8 rounded-2xl shadow-lg border border-gray-800 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 mb-6 md:mb-0 z-10">
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={50}
                outerRadius={70}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell key="cell-0" fill="#10b981" />
                <Cell key="cell-1" fill="#374151" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white font-mono">{completion}%</span>
          </div>
        </div>
        
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-2">{goal?.title || "Active Goal"}</h2>
          <p className="text-gray-400 max-w-md">You're making steady progress. Logging your execution with theory is key to mastery.</p>
        </div>
      </div>

      <Link 
        to="/journal/new"
        className="z-10 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold py-4 px-8 rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 animate-pulse"
      >
        <Edit3 size={20} />
        Add Today's Journal
      </Link>
    </div>
  );
}
