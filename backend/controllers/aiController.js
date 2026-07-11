import { generateGeminiReply } from '../services/ai/geminiService.js';

/**
 * Controller to handle POST /api/ai/chat requests.
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

    // Call Gemini service
    const reply = await generateGeminiReply(message);

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
