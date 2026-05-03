import React from 'react';
import { useGetDashboardStatsQuery, useGetActiveGoalQuery } from '../store/apiSlice';
import HeroCTA from '../components/HeroCTA';
import ActivityHeatmap from '../components/ActivityHeatmap';
import RoadmapStepper from '../components/RoadmapStepper';
import Widgets from '../components/Widgets';

export default function Home() {
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: goalData, isLoading: goalLoading } = useGetActiveGoalQuery();

  const isLoading = statsLoading || goalLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <HeroCTA goal={goalData?.data} isLoading={isLoading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ActivityHeatmap heatmap={statsData?.data?.heatmap} streak={statsData?.data?.streak} isLoading={isLoading} />
          <RoadmapStepper roadmap={goalData?.data?.roadmap} isLoading={isLoading} />
        </div>
        
        <div className="lg:col-span-1">
          <Widgets 
            mentorPinned={statsData?.data?.mentorPinned} 
            peerPulse={statsData?.data?.peerPulse}
            aiInsight={statsData?.data?.aiInsight}
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
}
