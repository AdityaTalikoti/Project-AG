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
import { getCsrfHeaders } from './csrf.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const sendChatMessage = async (message) => {
  try {
    const headers = await getCsrfHeaders();
    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const data = await response.json();
    if (data && typeof data === 'object') {
      return {
        success: data.success !== false,
        reply: data.reply || data.message || '',
        ...data,
      };
    }
    throw new Error('Invalid JSON payload structure received from AI mentor service');
  } catch (error) {
    console.error('API Error in sendChatMessage:', error);
    return {
      success: false,
      message: 'Unable to contact ScholarSync AI Mentor. Please try again.',
    };
  }
};
