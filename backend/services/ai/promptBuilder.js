import { getSystemPrompt } from './systemPrompt.js';
import { buildContext } from './contextBuilder.js';

/**
 * Combines the system prompt, retrieved student context, and user message into a single structured prompt.
 * @param {string} userMessage - The user's input message.
 * @param {string} studentId - The authenticated student ID.
 * @returns {Promise<string>} - The enriched, structured prompt.
 */
export const buildPrompt = async (userMessage, studentId) => {
  const systemPrompt = getSystemPrompt();
  const context = await buildContext(studentId);
  return `${systemPrompt}\n\n${context}Student Message: "${userMessage}"\nMentor Response:`;
};
