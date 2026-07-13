import { buildPrompt } from '../services/ai/promptBuilder.js';
import { generateGeminiReply } from '../services/ai/geminiService.js';
import { getOrGenerateInsight } from '../services/ai/dashboardInsightService.js';

/**
 * Controller to handle GET /api/ai/dashboard-insight requests.
 * Checks cache and returns personalized AI-generated insight.
 */
export const handleDashboardInsight = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const clientTimezone = req.query.timezone || 'UTC';

    const result = await getOrGenerateInsight(studentId, clientTimezone);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle POST /api/ai/chat requests.
 * Keeps the controller layer thin by offloading prompt building and API service logic.
 */
export const handleChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const studentId = req.user?.id; // Authenticated student ID from authMiddleware

    // Validate request: Reject empty, null, undefined or non-string messages
    if (!message || typeof message !== 'string' || message.trim() === '') {
      const error = new Error('Message is required and cannot be empty');
      error.status = 400;
      throw error;
    }

    // Call Prompt Builder to construct the system-enriched prompt (now async)
    const structuredPrompt = await buildPrompt(message, studentId);

    // Call Gemini service with the pre-built prompt
    const reply = await generateGeminiReply(structuredPrompt);

    // Return JSON response on success
    return res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    // Forward failure to centralized error handler
    next(error);
  }
};
