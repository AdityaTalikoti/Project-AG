import React from 'react';
import { useGetJournalsQuery } from '../store/apiSlice';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export default function Dashboard() {
  const { data: response, isLoading } = useGetJournalsQuery('60d0fe4f5311236168a109ca');
  
  if (isLoading) return <div className="text-gray-400 animate-pulse">Loading dashboard...</div>;

  // Transform data for the visualization
  // X: Index (Days), Y: Quality (1-10 based on match), Z: Bubble size
  const chartData = response?.data?.map((log, index) => ({
    day: index + 1,
    quality: log.aiFeedback?.match ? 9 : 4,
    size: 100,
    task: log.task
  })) || [];

  return (
    <div className="bg-dark-panel p-6 rounded-xl shadow-lg border border-gray-800 h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-white flex justify-between items-center">
        Progress Analytics
        <span className="text-xs font-normal text-gray-400 bg-gray-900 px-3 py-1 rounded-full">
          Consistency vs Depth
        </span>
      </h2>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis type="number" dataKey="day" name="Entry" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
            <YAxis type="number" dataKey="quality" name="Depth Score" domain={[0, 10]} stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
            <ZAxis type="number" dataKey="size" range={[60, 400]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl max-w-[200px]">
                      <p className="text-neon-green font-bold">Score: {data.quality}/10</p>
                      <p className="text-gray-300 text-xs mt-1 truncate">{data.task}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Progress" data={chartData} fill="#10b981" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
