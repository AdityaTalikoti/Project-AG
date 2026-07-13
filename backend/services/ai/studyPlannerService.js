import { generateGeminiReply } from './geminiService.js';
import { buildStudyPlanContext } from './studyPlanContextBuilder.js';
import { validateStudyPlanJSON } from './studyPlanValidator.js';
import StudyPlan from '../../models/StudyPlan.js';

/**
 * Normalizes a date to midnight local time.
 */
const getNormalizedDate = (d = new Date()) => {
  const normalized = new Date(d);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Rule-based fallback generator if Gemini is down/offline.
 */
const generateFallbackStudyPlan = (context) => {
  const tasks = [];
  const recommendations = [];

  // Determine number of tasks based on workload
  const maxTasks = context.workloadStatus === 'Busy' ? 1 : 2;

  let taskAddedCount = 0;

  // 1. Add tasks from the active module if available
  if (context.roadmap && context.roadmap.currentModule && context.roadmap.currentModule.tasks) {
    const incompleteTasks = context.roadmap.currentModule.tasks.filter(t => !t.completed);
    
    for (let i = 0; i < Math.min(incompleteTasks.length, maxTasks); i++) {
      tasks.push({
        title: incompleteTasks[i].title,
        duration: incompleteTasks[i].duration || '45 min',
        completed: false
      });
      taskAddedCount++;
    }
  }

  // 2. If student is ahead, recommend revision or projects
  if (context.isAhead) {
    tasks.push({
      title: "Work on a personal side project or solve LeetCode algorithms",
      duration: "45 min",
      completed: false
    });
    taskAddedCount++;
  }

  // 3. Fallback if no task was added
  if (taskAddedCount === 0) {
    tasks.push({
      title: "Review active subjects & read textbook chapters",
      duration: "60 min",
      completed: false
    });
  }

  // 4. Always append journal writing
  tasks.push({
    title: "Write today's journal reflection",
    duration: "15 min",
    completed: false
  });

  // 5. Handle missed milestones advice
  if (context.missedMilestones && context.missedMilestones.length > 0) {
    const firstMissed = context.missedMilestones[0];
    recommendations.push({
      message: `You missed the milestone "${firstMissed.title}". Consider shifting it to Friday?`,
      actionType: "reschedule",
      metadata: {
        moduleIndex: firstMissed.moduleIndex,
        suggestedDay: "Friday"
      }
    });
  }

  return {
    workloadStatus: context.workloadStatus,
    tasks,
    recommendations,
    generatedBy: 'Fallback'
  };
};

/**
 * Gets the current cached plan for today, or generates a new one.
 * If forceRegenerate is true, it triggers a clean analysis.
 *
 * @param {string} studentId
 * @param {boolean} forceRegenerate
 * @returns {Promise<Object>}
 */
export const getOrCreateDailyStudyPlan = async (studentId, forceRegenerate = false) => {
  const todayDate = getNormalizedDate();

  if (!forceRegenerate) {
    const existing = await StudyPlan.findOne({ studentId, date: todayDate });
    if (existing) {
      return existing;
    }
  }

  const context = await buildStudyPlanContext(studentId);

  try {
    const prompt = `You are a master academic study planner. Generate a personalized daily study plan for the student based on:
Current Date: ${context.currentDate}
Workload load from calendar: ${context.workloadStatus} (Total Today Events duration: ${context.calendarLoad.totalDurationMinutes} mins)
Today's Calendar Events: ${JSON.stringify(context.calendarLoad.events)}
Active Roadmap: ${context.roadmap ? JSON.stringify(context.roadmap) : 'No active roadmap'}
Missed Milestones: ${JSON.stringify(context.missedMilestones)}
Is Student Ahead of schedule: ${context.isAhead}
Recent Journal Reflections (mood/stress levels): ${JSON.stringify(context.recentReflections)}

Constraints & Rules:
1. Generate 2 to 4 structured, realistic daily study tasks.
2. Order tasks logically by priority.
3. If calendar workload load is "Busy", significantly reduce today's study workload (recommend fewer or shorter tasks).
4. If student is ahead, recommend extension tasks: "LeetCode practice", "Mock interview prep", "Side project development", or "Revision".
5. If the student has missed milestones, automatically recommend moving/rescheduling them in the "recommendations" field. Format message like: "You missed yesterday's Docker milestone. Move it to Friday?"
6. Always append "Write today's journal" (duration "15 min") as the final task in the task list.
7. Return ONLY a single JSON object. Do NOT wrap in markdown fences.

Response format:
{
  "workloadStatus": "Busy | Balanced | Light",
  "tasks": [
    { "title": "Finish Binary Search", "duration": "45 min", "completed": false }
  ],
  "recommendations": [
    { "message": "You missed yesterday's Docker milestone. Move it to Friday?", "actionType": "reschedule", "metadata": { "moduleIndex": 1, "suggestedDay": "Friday" } }
  ]
}
`;

    console.log('Generating AI Study Plan via Gemini...');
    const reply = await generateGeminiReply(prompt);
    const parsed = validateStudyPlanJSON(reply);

    let plan = await StudyPlan.findOne({ studentId, date: todayDate });
    if (plan) {
      plan.tasks = parsed.tasks;
      plan.recommendations = parsed.recommendations;
      plan.workloadStatus = parsed.workloadStatus;
      plan.generatedBy = 'AI';
      await plan.save();
    } else {
      plan = await StudyPlan.create({
        studentId,
        date: todayDate,
        tasks: parsed.tasks,
        recommendations: parsed.recommendations,
        workloadStatus: parsed.workloadStatus,
        generatedBy: 'AI'
      });
    }

    return plan;
  } catch (error) {
    console.warn('AI study plan generation failed, falling back to rule-based fallback. Error:', error.message);
    const fallback = generateFallbackStudyPlan(context);

    let plan = await StudyPlan.findOne({ studentId, date: todayDate });
    if (plan) {
      plan.tasks = fallback.tasks;
      plan.recommendations = fallback.recommendations;
      plan.workloadStatus = fallback.workloadStatus;
      plan.generatedBy = 'Fallback';
      await plan.save();
    } else {
      plan = await StudyPlan.create({
        studentId,
        date: todayDate,
        tasks: fallback.tasks,
        recommendations: fallback.recommendations,
        workloadStatus: fallback.workloadStatus,
        generatedBy: 'Fallback'
      });
    }

    return plan;
  }
};
