import Goal from '../../models/Goal.js';
import Roadmap from '../../models/Roadmap.js';
import Event from '../../models/Event.js';
import { buildJournalContext } from './journalContextBuilder.js';

/**
 * Builds the context string for the authenticated student.
 * Gathers active goals, roadmaps, calendar events, and summarized journals.
 * @param {string} studentId - The ID of the authenticated user.
 * @returns {Promise<string>} - The context text to append to the system prompt.
 */
export const buildContext = async (studentId) => {
  if (!studentId) {
    return '';
  }

  try {
    // 1. Fetch User Goals (Active)
    const activeGoal = await Goal.findOne({ studentId, status: 'Active' })
      .select('title description subTasks')
      .lean();

    // 2. Fetch Active Roadmap
    const activeRoadmap = await Roadmap.findOne({ studentId, active: true })
      .select('title completionPercentage modules')
      .lean();

    // 3. Fetch Calendar Events (Not in the past)
    const now = new Date();
    const futureEvents = await Event.find({
      createdBy: studentId,
      endDateTime: { $gte: now },
      status: { $ne: 'cancelled' }
    })
      .select('title description startDateTime endDateTime category')
      .sort({ startDateTime: 1 })
      .lean();

    let context = '### STUDENT CONTEXT\n\n';

    // Format Goals
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

    // Format Roadmap
    if (activeRoadmap) {
      context += `**Active Roadmap**: ${activeRoadmap.title} (${activeRoadmap.completionPercentage}% Completed)\n`;
      
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
        context += `- Upcoming/Pending Milestones: ${pendingMilestones.map(m => m.title).join(', ')}\n`;
      }
      context += '\n';
    } else {
      context += `**Active Roadmap**: None configured.\n\n`;
    }

    // Format Calendar Events
    if (futureEvents && futureEvents.length > 0) {
      context += `**Calendar & Schedule**:\n`;
      
      // Separate today's events from upcoming ones
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
        context += `Today's Events:\n` + todayEvents.map(evt => {
          const time = new Date(evt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `- [${evt.category || 'General'}] ${evt.title} at ${time}`;
        }).join('\n') + '\n';
      }

      if (upcomingEvents.length > 0) {
        context += `Upcoming Schedule & Deadlines:\n` + upcomingEvents.map(evt => {
          const dateStr = new Date(evt.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
          const timeStr = new Date(evt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `- [${evt.category || 'General'}] ${evt.title} on ${dateStr} at ${timeStr}`;
        }).join('\n') + '\n';
      }
      context += '\n';
    } else {
      context += `**Calendar & Schedule**: No upcoming events or deadlines scheduled.\n\n`;
    }

    // 4. Fetch and Append Summarized Journal Context (Phase 5)
    const journalContext = await buildJournalContext(studentId);
    if (journalContext) {
      context += journalContext;
    }

    return context;
  } catch (error) {
    console.error('Error gathering student context:', error);
    // Gracefully fallback to empty or error context description to not break the chatbot
    return '### STUDENT CONTEXT\nNote: Temporary error retrieving student context.\n\n';
  }
};
