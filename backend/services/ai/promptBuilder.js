import { getSystemPrompt } from './systemPrompt.js';

/**
 * Combines the system prompt and the user message into a single structured prompt.
 * @param {string} userMessage - The user's input message.
 * @returns {string} - The combined prompt.
 */
export const buildPrompt = (userMessage) => {
  const systemPrompt = getSystemPrompt();
  return `${systemPrompt}\n\nStudent Message: "${userMessage}"\nMentor Response:`;
};
