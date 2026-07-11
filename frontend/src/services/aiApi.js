/**
 * Service to communicate with the ScholarSync AI Mentor API.
 */

/**
 * Sends a chat message to the AI Mentor.
 * @param {string} message - The student's message.
 * @returns {Promise<{success: boolean, reply?: string, message?: string}>}
 */
export const sendChatMessage = async (message) => {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
