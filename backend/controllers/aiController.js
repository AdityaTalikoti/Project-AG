import { buildPrompt } from '../services/ai/promptBuilder.js';
import { generateGeminiReply } from '../services/ai/geminiService.js';
import { getOrGenerateInsight } from '../services/ai/dashboardInsightService.js';

/**
 * Sanitizes incoming user messages by stripping script tags and general HTML tags
 * to improve security against injections.
 *
 * @param {string} text - User message
 * @returns {string} Cleaned text
 */
const sanitizeInput = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Strip script blocks
    .replace(/<\/?[^>]+(>|$)/g, '') // Strip HTML tags
    .trim();
};

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
 * Integrates input sanitization and friendly fallback logic for AI failures.
 */
export const handleChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const studentId = req.user?.id;

    // Validate request: Reject empty or non-string inputs
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty'
      });
    }

    // Sanitize incoming input
    const cleanMessage = sanitizeInput(message);
    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        message: 'Message contains invalid characters'
      });
    }

    // Call Prompt Builder to construct the system-enriched prompt
    const structuredPrompt = await buildPrompt(cleanMessage, studentId);

    let reply;
    try {
      // Call Gemini service with the pre-built prompt
      reply = await generateGeminiReply(structuredPrompt);
    } catch (geminiError) {
      console.warn('Gemini chat service failed, falling back gracefully. Error:', geminiError.message);
      // Return a friendly, in-character fallback response instead of failing the route
      reply = "I'm currently experiencing high connection volumes and couldn't process your request. Let's try again in a few moments, or review your active study planner goals in the dashboard!";
    }

    // Return JSON response on success
    return res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    // Forward unexpected failures to centralized error handler
    next(error);
  }
};
