/**
 * Service to communicate with the ScholarSync AI Mentor API.
 */

/**
 * Q9 — JAVASCRIPT PROMISE CHAINING IMPLEMENTATION:
 * Sends a chat message to the ScholarSync AI Mentor using a clean, multi-stage Promise chain.
 * Sequence:
 *   1. fetch() -> Initiates network call, returning initial Promise<Response>.
 *   2. First .then() -> Validates HTTP status (res.ok) and parses response body via res.json().
 *   3. Second .then() -> Transforms and formats payload for React components.
 * @param {string} message - The student's message.
 * @returns {Promise<{success: boolean, reply?: string, message?: string}>}
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

export const sendChatMessage = (message) => {
  return fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ message }),
  })
    // Chain Step 1: Handle HTTP Response & JSON stream resolution
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      return response.json();
    })
    // Chain Step 2: Validate payload structure and transform data for UI consumption
    .then((data) => {
      if (data && typeof data === 'object') {
        return {
          success: data.success !== false,
          reply: data.reply || data.message || '',
          ...data,
        };
      }
      throw new Error('Invalid JSON payload structure received from AI mentor service');
    })
    // Chain Step 3: Centralized Error Handling catching network errors, HTTP status errors, or JSON parse failures
    .catch((error) => {
      console.error('API Error in sendChatMessage:', error);
      return {
        success: false,
        message: 'Unable to contact ScholarSync AI Mentor. Please try again.',
      };
    });
};
