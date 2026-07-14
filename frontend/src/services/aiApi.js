/**
 * Service to communicate with the ScholarSync AI Mentor API.
 */

/**
 * Sends a chat message to the AI Mentor.
 * @param {string} message - The student's message.
 * @returns {Promise<{success: boolean, reply?: string, message?: string}>}
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

export const sendChatMessage = async (message) => {
  try {
    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error in sendChatMessage:', error);
    return {
      success: false,
      message: 'Unable to contact ScholarSync AI Mentor. Please try again.',
    };
  }
};
