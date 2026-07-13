import Goal from '../../models/Goal.js';
import Roadmap from '../../models/Roadmap.js';
import Event from '../../models/Event.js';
import { buildJournalContext } from './journalContextBuilder.js';

/**
 * Builds the context string for the authenticated student.
 * Gathers active goals, roadmaps, calendar events, and summarized journals.
 *
 * @param {string} studentId - The ID of the authenticated user.
 * @returns {Promise<string>} - The context text to append to the system prompt.
 */
export const buildContext = async (studentId) => {
  if (!studentId) {
    return '';
  }

  try {
    const now = new Date();

    // Parallelize context data fetching
    const [activeGoal, activeRoadmap, futureEvents, journalContext] = await Promise.all([
      Goal.findOne({ studentId, status: 'Active' }).select('title description subTasks').lean(),
      Roadmap.findOne({ studentId, active: true }).select('title completionPercentage skillLevel modules').lean(),
      Event.find({
        createdBy: studentId,
        endDateTime: { $gte: now },
        status: { $ne: 'cancelled' }
      })
        .select('title startDateTime category')
        .sort({ startDateTime: 1 })
        .limit(10) // Fetch next 10 candidates to sort and filter locally
        .lean(),
      buildJournalContext(studentId)
    ]);

    let context = '### STUDENT CONTEXT\n\n';

    // 1. Format Goals
    if (activeGoal) {
      context += `**Active Learning Goal**: ${activeGoal.title}\n`;
      if (activeGoal.description) {
        context += `Goal Description: ${activeGoal.description}\n`;
      }
      const pendingTasks = activeGoal.subTasks?.filter(t => !t.completed) || [];
      if (pendingTasks.length > 0) {
        context += `Pending Objectives:\n` + pendingTasks.map(t => `- ${t.title}`).join('\n') + '\n';
      }
      context += '\n';
    } else {
      context += `**Active Learning Goal**: None configured.\n\n`;
    }

    // 2. Format Roadmap (Compressed)
    if (activeRoadmap) {
      context += `**Active Roadmap**: ${activeRoadmap.title} (${activeRoadmap.completionPercentage}% Completed, Skill Level: ${activeRoadmap.skillLevel || 'Beginner'})\n`;
      
      const modules = activeRoadmap.modules || [];
      const currentMilestone = modules.find(m => m.status === 'in-progress');
      const completedMilestones = modules.filter(m => m.status === 'completed');
      const pendingMilestones = modules.filter(m => m.status === 'upcoming' || m.status === 'locked');

      if (currentMilestone) {
        context += `- Current Milestone: ${currentMilestone.title}\n`;
      }
      if (completedMilestones.length > 0) {
        context += `- Completed Milestones: ${completedMilestones.map(m => m.title).join(', ')}\n`;
      }
      if (pendingMilestones.length > 0) {
        // Compress: Show next 2 pending milestones and count the rest
        const nextTwo = pendingMilestones.slice(0, 2).map(m => m.title).join(', ');
        const remaining = pendingMilestones.length - 2;
        context += `- Next Milestones: ${nextTwo}${remaining > 0 ? ` (+${remaining} more)` : ''}\n`;
      }
      context += '\n';
    } else {
      context += `**Active Roadmap**: None configured.\n\n`;
    }

    // 3. Format Calendar Events (Compressed to max 3 upcoming)
    if (futureEvents && futureEvents.length > 0) {
      context += `**Calendar & Schedule**:\n`;
      
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const todayEvents = [];
      const upcomingEvents = [];

      futureEvents.forEach(evt => {
        const start = new Date(evt.startDateTime);
        if (start >= todayStart && start <= todayEnd) {
          todayEvents.push(evt);
        } else {
          upcomingEvents.push(evt);
        }
      });

      if (todayEvents.length > 0) {
        context += `Today's Events:\n` + todayEvents.slice(0, 3).map(evt => {
          const time = new Date(evt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `- [${evt.category || 'General'}] ${evt.title} at ${time}`;
        }).join('\n') + '\n';
      }

      if (upcomingEvents.length > 0) {
        // Compress: Only send next 3 upcoming events
        const limitedUpcoming = upcomingEvents.slice(0, 3);
        context += `Upcoming Schedule & Deadlines:\n` + limitedUpcoming.map(evt => {
          const dateStr = new Date(evt.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
          const timeStr = new Date(evt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `- [${evt.category || 'General'}] ${evt.title} on ${dateStr} at ${timeStr}`;
        }).join('\n') + '\n';
      }
      context += '\n';
    } else {
      context += `**Calendar & Schedule**: No upcoming events or deadlines scheduled.\n\n`;
    }

    // 4. Append Local Journal Summary
    if (journalContext) {
      context += journalContext;
    }

    return context;
  } catch (error) {
    console.error('Error gathering student context:', error);
    return '### STUDENT CONTEXT\nNote: Temporary error retrieving student context.\n\n';
  }
};
