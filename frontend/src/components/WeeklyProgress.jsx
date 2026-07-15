import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function WeeklyProgress({ weeklyData = [], previousWeeklyData = [], isLoading }) {
  const [showPreviousWeek, setShowPreviousWeek] = useState(false);

  if (isLoading) {
    return <div className="bg-[#0a0e1a] p-6 rounded-2xl h-72 animate-pulse border border-[#121829]" />;
  }

  // Find the day with maximum hours to show the highlighted label
  let maxDay = null;
  if (weeklyData.length > 0) {
    maxDay = weeklyData.reduce((prev, current) => (prev.hours > current.hours) ? prev : current);
  }

  return (
    <div className="bg-[#0a0e1a] p-6 rounded-2xl border border-[#121829] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
            Weekly Progress
            <span className="text-[10px] text-gray-500 font-normal bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-full cursor-help" title="Weekly total study sessions focus duration.">
              ?
            </span>
          </h3>
        </div>
        <div className="bg-[#111625] px-3 py-1 rounded-lg border border-[#1b2237] text-[10px] text-gray-400 font-semibold cursor-pointer">
          This Week ▾
        </div>
      </div>

      <div className="h-60 w-full">
        {weeklyData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            No study sessions logged this week.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#121829" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#475569" 
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
              />
              <YAxis 
                stroke="#475569" 
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}h`}
                domain={[0, 10]}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#111625] border border-[#1b2237] px-3 py-2 rounded-xl shadow-lg">
                        <span className="text-[10px] text-gray-500 font-semibold block uppercase">{payload[0].payload.day}</span>
                        <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{payload[0].value} Focus Hours</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="hours" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorHours)" 
              />
              
              {/* Highlight the maximum study session hours dynamically */}
              {maxDay && (
                <ReferenceDot
                  x={maxDay.day}
                  y={maxDay.hours}
                  r={5}
                  fill="#10b981"
                  stroke="#080c14"
                  strokeWidth={2}
                  label={{
                    value: `${maxDay.hours} hrs`,
                    position: 'top',
                    fill: '#10b981',
                    fontSize: 9,
                    fontWeight: 'bold',
                    offset: 8,
                    bg: '#111625'
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Scroll Down Button to Toggle Previous Focus Graph */}
      {previousWeeklyData && previousWeeklyData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-900 flex justify-center">
          <button
            onClick={() => {
              const willShow = !showPreviousWeek;
              setShowPreviousWeek(willShow);
              if (willShow) {
                setTimeout(() => {
                  document.getElementById('previous-week-graph-container')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-emerald-400 font-bold uppercase tracking-wider transition cursor-pointer"
          >
            {showPreviousWeek ? (
              <>
                Hide Previous Week Graph <ChevronUp size={12} />
              </>
            ) : (
              <>
                Show Previous Week Graph <ChevronDown size={12} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Previous Week Focus Graph */}
      {showPreviousWeek && previousWeeklyData && previousWeeklyData.length > 0 && (
        <div id="previous-week-graph-container" className="mt-6 pt-6 border-t border-gray-900 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Previous Week Progress
              </h3>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={previousWeeklyData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrevHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#121829" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#475569" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                />
                <YAxis 
                  stroke="#475569" 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}h`}
                  domain={[0, 10]}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#111625] border border-[#1b2237] px-3 py-2 rounded-xl shadow-lg">
                          <span className="text-[10px] text-gray-500 font-semibold block uppercase">{payload[0].payload.day}</span>
                          <span className="text-sm font-bold text-purple-400 mt-0.5 block">{payload[0].value} Focus Hours</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorPrevHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
