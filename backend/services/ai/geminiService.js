import { GoogleGenAI } from '@google/genai';

// Initialize GoogleGenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

/**
 * Service to generate content using the Google GenAI SDK.
 * Receives the already-built prompt and handles API calls and fallbacks.
 * @param {string} prompt - The pre-built structured prompt.
 * @returns {Promise<string>} - The response text from Gemini.
 */
export const generateGeminiReply = async (prompt) => {
  if (!ai) {
    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    ai = new GoogleGenAI({ apiKey: currentApiKey });
  }

  try {
    // Attempt with default requested model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error('Received an empty response from Gemini API');
    }

    return response.text;
  } catch (error) {
    const isModelUnavailable = error.message && (
      error.message.includes('gemini-2.5-flash') ||
      error.message.includes('NOT_FOUND') ||
      error.message.includes('no longer available')
    );

    if (isModelUnavailable) {
      console.warn('gemini-2.5-flash is not available, falling back to gemini-3.5-flash');
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });

        if (!response || !response.text) {
          throw new Error('Received an empty response from Gemini API fallback');
        }

        return response.text;
      } catch (fallbackError) {
        console.error('Gemini Service Fallback API failure:', fallbackError);
        throw new Error(fallbackError.message || 'Failed to call Gemini AI Service (Fallback)');
      }
    }

    console.error('Gemini Service API failure:', error);
    throw new Error(error.message || 'Failed to call Gemini AI Service');
  }
};
