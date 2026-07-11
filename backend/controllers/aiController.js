import { buildPrompt } from '../services/ai/promptBuilder.js';
import { generateGeminiReply } from '../services/ai/geminiService.js';

/**
 * Controller to handle POST /api/ai/chat requests.
 * Keeps the controller layer thin by offloading prompt building and API service logic.
 */
export const handleChat = async (req, res, next) => {
  try {
    const { message } = req.body;

    // Validate request: Reject empty, null, undefined or non-string messages
    if (!message || typeof message !== 'string' || message.trim() === '') {
      const error = new Error('Message is required and cannot be empty');
      error.status = 400;
      throw error;
    }

    // Call Prompt Builder to construct the system-enriched prompt
    const structuredPrompt = buildPrompt(message);

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
