import { generateAIOrFallbackRoadmap, deduceCategory } from '../services/ai/roadmapGeneratorService.js';
import { generateSmartSuggestions } from '../services/ai/roadmapSuggestionService.js';
import { syncRoadmapToCalendar } from '../services/ai/roadmapSyncService.js';
import Roadmap from '../models/Roadmap.js';

/**
 * Controller to handle POST /api/roadmaps/generate
 */
export const handleGenerateRoadmap = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { goal, skillLevel, dailyCommitment, targetDate, learningStyle, existingKnowledge, timeline } = req.body;

    if (!goal) {
      return res.status(400).json({ success: false, message: "Goal name is required" });
    }

    const generatedRoadmap = await generateAIOrFallbackRoadmap(studentId, {
      goal,
      skillLevel,
      dailyCommitment,
      targetDate,
      learningStyle,
      existingKnowledge,
      timeline
    });

    return res.status(200).json({
      success: true,
      data: generatedRoadmap
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle POST /api/roadmaps/analyze-suggestions
 */
export const handleAnalyzeSuggestions = async (req, res, next) => {
  try {
    const { title, skillLevel, dailyCommitment, milestones } = req.body;

    const suggestions = await generateSmartSuggestions({
      title,
      skillLevel,
      dailyCommitment,
      milestones
    });

    return res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle POST /api/roadmaps/save
 */
export const handleSaveRoadmap = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { title, description, skillLevel, dailyCommitment, milestones, timeline } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Roadmap title is required" });
    }
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return res.status(400).json({ success: false, message: "Milestones list cannot be empty" });
    }

    // Translate milestones array to database subdocument modules
    const modules = milestones.map((m, idx) => {
      const tasks = [];
      
      if (m.topics && Array.isArray(m.topics)) {
        m.topics.forEach((t) => {
          tasks.push({
            title: t,
            description: `Learn and practice: ${t}`,
            duration: "45 mins",
            xpReward: 50,
            completed: false
          });
        });
      }
      
      if (m.resources && Array.isArray(m.resources)) {
        m.resources.forEach((res) => {
          tasks.push({
            title: `Resource: ${res}`,
            description: `Review reference material: ${res}`,
            duration: "30 mins",
            xpReward: 50,
            completed: false
          });
        });
      }

      if (tasks.length === 0) {
        tasks.push({
          title: `Study foundations of ${m.title}`,
          description: m.description || `Study topics for ${m.title}`,
          duration: "1 hour",
          xpReward: 100,
          completed: false
        });
      }

      return {
        title: m.title,
        description: m.description || '',
        estimatedDuration: m.duration || '1 week',
        status: idx === 0 ? 'in-progress' : 'locked',
        tasks
      };
    });

    // 1. Archive any pre-existing active roadmaps
    await Roadmap.updateMany({ studentId, active: true }, { active: false });

    // 2. Create the customized roadmap
    const category = deduceCategory(title);
    const newRoadmap = await Roadmap.create({
      studentId,
      title,
      description: description || `Customized learning path for ${title}`,
      category,
      skillLevel: skillLevel || 'Beginner',
      timeline: timeline || '8 weeks',
      dailyCommitment: dailyCommitment || 60,
      active: true,
      modules,
      completionPercentage: 0
    });

    // 3. Automatically trigger calendar sync in the background
    await syncRoadmapToCalendar(newRoadmap._id, studentId);

    return res.status(201).json({
      success: true,
      message: "Roadmap customized and saved successfully. Calendar synced.",
      data: newRoadmap
    });
  } catch (error) {
    next(error);
  }
};
