import Roadmap from '../../models/Roadmap.js';
import Event from '../../models/Event.js';
import Journal from '../../models/Journal.js';

/**
 * Gathers study-planning context for the authenticated user.
 *
 * @param {string} studentId - The user's database ID.
 * @returns {Promise<Object>} The compiled context object.
 */
export const buildStudyPlanContext = async (studentId) => {
  const today = new Date();
  
  // 1. Fetch Active Roadmap
  const activeRoadmap = await Roadmap.findOne({ studentId, active: true });
  
  let roadmapContext = null;
  let missedMilestones = [];
  let isAhead = false;

  if (activeRoadmap) {
    // Fetch related calendar events for matching modules
    const roadmapEvents = await Event.find({
      roadmapId: activeRoadmap._id,
      createdBy: studentId,
      isRoadmapEvent: true
    }).sort({ startDateTime: 1 });

    // Identify missed milestones
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    activeRoadmap.modules.forEach((mod, idx) => {
      const evt = roadmapEvents[idx];
      // If module is not completed, and its calendar event end date has passed before today
      if (evt && new Date(evt.endDateTime) < startOfToday && mod.status !== 'completed') {
        missedMilestones.push({
          moduleIndex: idx,
          title: mod.title,
          description: mod.description,
          dueDate: evt.endDateTime,
          duration: mod.estimatedDuration
        });
      }
    });

    // Determine if student is ahead of schedule
    const firstIncompleteIdx = activeRoadmap.modules.findIndex(m => m.status !== 'completed');
    if (firstIncompleteIdx !== -1) {
      const nextEvt = roadmapEvents[firstIncompleteIdx];
      // If the first incomplete module's scheduled start date is in the future
      if (nextEvt && new Date(nextEvt.startDateTime) > today) {
        isAhead = true;
      }
    } else {
      // All modules are completed
      isAhead = true;
    }

    const currentModule = activeRoadmap.modules.find(m => m.status === 'in-progress') || 
                          activeRoadmap.modules.find(m => m.status === 'upcoming') ||
                          null;

    roadmapContext = {
      title: activeRoadmap.title,
      category: activeRoadmap.category,
      skillLevel: activeRoadmap.skillLevel,
      dailyCommitment: activeRoadmap.dailyCommitment,
      completionPercentage: activeRoadmap.completionPercentage,
      currentModule: currentModule ? {
        title: currentModule.title,
        description: currentModule.description,
        estimatedDuration: currentModule.estimatedDuration,
        status: currentModule.status,
        tasks: currentModule.tasks.map(t => ({
          title: t.title,
          description: t.description,
          duration: t.duration,
          completed: t.completed
        }))
      } : null
    };
  }

  // 2. Fetch Calendar Events for Today (non-roadmap study events)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayEvents = await Event.find({
    createdBy: studentId,
    isRoadmapEvent: { $ne: true },
    startDateTime: { $gte: startOfDay, $lte: endOfDay }
  });

  // Calculate workloads
  const eventCount = todayEvents.length;
  let totalDurationMinutes = 0;
  todayEvents.forEach(evt => {
    const diff = new Date(evt.endDateTime) - new Date(evt.startDateTime);
    totalDurationMinutes += Math.round(diff / 60000);
  });

  let workloadStatus = 'Balanced';
  if (eventCount >= 3 || totalDurationMinutes >= 180) {
    workloadStatus = 'Busy';
  } else if (eventCount === 0 && totalDurationMinutes === 0) {
    workloadStatus = 'Light';
  }

  const calendarContext = todayEvents.map(evt => ({
    title: evt.title,
    description: evt.description || '',
    durationMinutes: Math.round((new Date(evt.endDateTime) - new Date(evt.startDateTime)) / 60000)
  }));

  // 3. Fetch Recent Journal Reflections (latest 3)
  const recentJournals = await Journal.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(3);

  const journalsContext = recentJournals.map(j => ({
    mood: j.mood,
    reflection: j.reflection || j.content || '',
    date: j.createdAt
  }));

  return {
    currentDate: today.toISOString().split('T')[0],
    workloadStatus,
    calendarLoad: {
      eventCount,
      totalDurationMinutes,
      events: calendarContext
    },
    roadmap: roadmapContext,
    missedMilestones,
    isAhead,
    recentReflections: journalsContext
  };
};
