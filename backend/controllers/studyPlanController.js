import { getOrCreateDailyStudyPlan } from '../services/ai/studyPlannerService.js';
import StudyPlan from '../models/StudyPlan.js';
import Roadmap from '../models/Roadmap.js';
import Event from '../models/Event.js';

// Helper to compute next day of the week
const getNextDayOfWeek = (dayName) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  const currentDayIndex = today.getDay();
  const targetDayIndex = days.indexOf(dayName.toLowerCase());
  
  if (targetDayIndex === -1) return today;
  
  let difference = targetDayIndex - currentDayIndex;
  if (difference <= 0) {
    difference += 7; // Push to the next week
  }
  
  const resultDate = new Date(today);
  resultDate.setDate(today.getDate() + difference);
  return resultDate;
};

export const handleGetStudyPlan = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { date } = req.query;

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const plan = await StudyPlan.findOne({ studentId, date: targetDate });
      return res.status(200).json({ success: true, data: plan });
    }

    const plan = await getOrCreateDailyStudyPlan(studentId, false);
    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/regenerate-study-plan
 */
export const handleRegenerateStudyPlan = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const plan = await getOrCreateDailyStudyPlan(studentId, true);
    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/study-plan/task/toggle
 */
export const handleToggleStudyPlanTask = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { taskId, completed } = req.body;

    if (!taskId) {
      return res.status(400).json({ success: false, message: 'Task ID is required' });
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const plan = await StudyPlan.findOne({ studentId, date: todayDate });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Today's study plan not found" });
    }

    const task = plan.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found in study plan' });
    }

    task.completed = completed;
    await plan.save();

    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/study-plan/reschedule
 */
export const handleRescheduleMissedMilestone = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { moduleIndex, suggestedDay } = req.body;

    if (moduleIndex === undefined) {
      return res.status(400).json({ success: false, message: 'Module index is required' });
    }

    const activeRoadmap = await Roadmap.findOne({ studentId, active: true });
    if (!activeRoadmap) {
      return res.status(404).json({ success: false, message: 'No active roadmap found' });
    }

    const roadmapEvents = await Event.find({
      roadmapId: activeRoadmap._id,
      createdBy: studentId,
      isRoadmapEvent: true
    }).sort({ startDateTime: 1 });

    const targetEvent = roadmapEvents[moduleIndex];
    if (!targetEvent) {
      return res.status(404).json({ success: false, message: 'Roadmap event milestone not found' });
    }

    // Compute target date for rescheduling
    const newStartDate = getNextDayOfWeek(suggestedDay || 'Friday');
    newStartDate.setHours(9, 0, 0, 0);

    const durationMs = targetEvent.endDateTime.getTime() - targetEvent.startDateTime.getTime();
    const newEndDate = new Date(newStartDate.getTime() + durationMs);

    targetEvent.startDateTime = newStartDate;
    targetEvent.endDateTime = newEndDate;
    await targetEvent.save();

    // Remove the rescheduling advisory from today's plan so it clears from the dashboard view
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const plan = await StudyPlan.findOne({ studentId, date: todayDate });
    if (plan) {
      plan.recommendations = plan.recommendations.filter(r => 
        !(r.metadata && r.metadata.moduleIndex === moduleIndex)
      );
      await plan.save();
    }

    return res.status(200).json({
      success: true,
      message: `Successfully rescheduled milestone to ${newStartDate.toDateString()}`,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};
