import Goal from '../../models/Goal.js';
import Roadmap from '../../models/Roadmap.js';
import Event from '../../models/Event.js';
import Journal from '../../models/Journal.js';
import FocusSession from '../../models/FocusSession.js';
import { generateGeminiReply } from './geminiService.js';
import {
  computeSourceVersion,
  getCachedInsight,
  isCacheValid,
  saveCachedInsight
} from './insightCacheService.js';

/**
 * Retrieves the cached AI Insight for the authenticated student or regenerates it
 * if the cache is expired, a new day has arrived, or relevant databases have updated.
 *
 * @param {string} studentId - The ID of the authenticated user.
 * @param {string} clientTimezone - The timezone of the client.
 * @returns {Promise<Object>} - Object with success, cached, summary, generatedAt, expiresAt
 */
export const getOrGenerateInsight = async (studentId, clientTimezone = 'UTC') => {
  if (!studentId) {
    return {
      success: false,
      cached: false,
      summary: '',
      generatedAt: null,
      expiresAt: null
    };
  }

  const fallbackSummary = "Welcome back! Continue working toward your current goals. I'll generate personalized insights as more activity becomes available.";

  let cachedInsight = null;
  let sourceVersion = '';

  try {
    // 1. Fetch current cached insight and compute new source version
    cachedInsight = await getCachedInsight(studentId);
    sourceVersion = await computeSourceVersion(studentId, clientTimezone);

    // 2. Check if cache is valid
    if (isCacheValid(cachedInsight, sourceVersion)) {
      console.log('Returning valid cached AI insight');
      return {
        success: true,
        cached: true,
        summary: cachedInsight.summary,
        generatedAt: cachedInsight.generatedAt,
        expiresAt: cachedInsight.expiresAt
      };
    }
  } catch (cacheError) {
    console.error('Error checking cached insight validity:', cacheError);
  }

  // 3. Cache is missing or invalidated -> Gather student data & call Gemini
  try {
    // a. Goals (optimized fields selection)
    const activeGoal = await Goal.findOne({ studentId, status: 'Active' })
      .select('title description subTasks')
      .lean();
    let goalInfo = 'None configured.';
    if (activeGoal) {
      goalInfo = `Active Goal: "${activeGoal.title}"`;
      if (activeGoal.description) {
        goalInfo += ` (${activeGoal.description})`;
      }
      const pendingTasks = activeGoal.subTasks?.filter(t => !t.completed) || [];
      if (pendingTasks.length > 0) {
        goalInfo += `. Pending steps: ${pendingTasks.map(t => t.title).join(', ')}`;
      }
    }

    // b. Roadmap (optimized fields selection)
    const activeRoadmap = await Roadmap.findOne({ studentId, active: true })
      .select('title completionPercentage modules')
      .lean();
    let roadmapInfo = 'None configured.';
    if (activeRoadmap) {
      const currentMilestone = activeRoadmap.modules?.find(m => m.status === 'in-progress');
      roadmapInfo = `Roadmap: "${activeRoadmap.title}" (${activeRoadmap.completionPercentage}% Completed).`;
      if (currentMilestone) {
        roadmapInfo += ` Current milestone in progress: "${currentMilestone.title}".`;
      }
    }

    // c. Calendar (upcoming events - optimized fields selection)
    const now = new Date();
    const futureEvents = await Event.find({
      createdBy: studentId,
      endDateTime: { $gte: now },
      status: { $ne: 'cancelled' }
    })
      .sort({ startDateTime: 1 })
      .limit(3)
      .select('title startDateTime category')
      .lean();
    let calendarInfo = 'No upcoming events.';
    if (futureEvents && futureEvents.length > 0) {
      calendarInfo = `Upcoming Schedule: ${futureEvents.map(e => `"${e.title}" (${e.category || 'General'}) on ${new Date(e.startDateTime).toLocaleDateString()}`).join(', ')}`;
    }

    // d. Recent Journals (optimized fields selection)
    const journals = await Journal.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('task idea aiFeedback createdAt')
      .lean();
    let journalInfo = 'No recent journals logged yet.';
    if (journals && journals.length > 0) {
      journalInfo = journals.map((j, idx) => {
        return `Entry ${idx + 1}: Task "${j.task}". Approach: "${j.idea}". feedback match: ${j.aiFeedback?.match || false}. feedback: "${j.aiFeedback?.feedback || ''}"`;
      }).join('; ');
    }

    // e. Study Progress / Stats (optimized fields selection)
    const focusSessions = await FocusSession.find({ studentId })
      .select('duration')
      .lean();
    const totalFocusSeconds = focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalFocusHours = totalFocusSeconds / 3600;

    // Calculate level and XP
    let focusSessionXp = 0;
    focusSessions.forEach(s => {
      if (s.duration >= 2700) {
        focusSessionXp += 100;
      } else if (s.duration >= 1500) {
        focusSessionXp += 50;
      }
    });

    let roadmapXp = 0;
    if (activeRoadmap) {
      activeRoadmap.modules.forEach(m => {
        m.tasks.forEach(t => {
          if (t.completed) {
            roadmapXp += (t.xpReward || 50);
          }
        });
      });
    }

    const totalJournalsCount = await Journal.countDocuments({ studentId });
    const matchJournalsCount = await Journal.countDocuments({ studentId, 'aiFeedback.match': true });
    const totalXp = totalJournalsCount * 100 + (matchJournalsCount * 50) + focusSessionXp + roadmapXp;
    const level = Math.floor(totalXp / 1000) + 1;

    let progressInfo = `Level: ${level}, Total focus hours: ${totalFocusHours.toFixed(1)}h, Total completed tasks (journals): ${totalJournalsCount}.`;

    // 4. Construct prompt
    const prompt = `You are ScholarSync AI Mentor. Your task is to generate a concise, personalized study insight for the student's dashboard.

Student Progress Profile:
- Active Goal: ${goalInfo}
- Active Roadmap: ${roadmapInfo}
- Upcoming Calendar Events: ${calendarInfo}
- Recent Journals: ${journalInfo}
- Study Stats: ${progressInfo}

Generate a highly motivating and actionable dashboard insight based on the student's progress and upcoming tasks.
Constraints:
- Strictly 3 to 5 short sentences.
- Actionable (give them a clear next step).
- Motivating and encouraging.
- Do not fabricate information.
- Start directly with the insight text. Do not include any headers, greetings, bullet points, or introductory phrases.`;

    // 5. Call Gemini
    const summary = await generateGeminiReply(prompt);
    const trimmedSummary = summary ? summary.trim() : '';

    if (!trimmedSummary) {
      throw new Error('Received empty text from Gemini');
    }

    // 6. Cache the new insight
    const saved = await saveCachedInsight(studentId, trimmedSummary, sourceVersion);

    return {
      success: true,
      cached: false,
      summary: saved.summary,
      generatedAt: saved.generatedAt,
      expiresAt: saved.expiresAt
    };
  } catch (error) {
    console.error('Gemini call or cache save failed, retrieving fallback:', error);

    // If Gemini is unavailable, return most recent cached insight (even if expired)
    if (cachedInsight) {
      console.log('Serving expired/invalid cache as fallback due to Gemini unavailability');
      return {
        success: true,
        cached: true,
        summary: cachedInsight.summary,
        generatedAt: cachedInsight.generatedAt,
        expiresAt: cachedInsight.expiresAt
      };
    }

    // If no cache exists, return friendly fallback message
    return {
      success: true,
      cached: false,
      summary: fallbackSummary,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expires fallback
    };
  }
};
