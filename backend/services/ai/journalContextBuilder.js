import Journal from '../../models/Journal.js';

/**
 * Gathers the latest 3 journal entries for the authenticated student,
 * and formats them directly into a concise prompt context.
 * This avoids an extra secondary Gemini API call per chat prompt.
 *
 * @param {string} studentId - The ID of the authenticated user.
 * @returns {Promise<string>} - The local journal context, or empty string.
 */
export const buildJournalContext = async (studentId) => {
  if (!studentId) {
    return '';
  }

  try {
    // Optimization: fetch only latest 3 entries with selected fields
    const journals = await Journal.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('task idea mood createdAt')
      .lean();

    if (!journals || journals.length === 0) {
      return '';
    }

    // Format journal entries concisely
    const logs = journals.map(entry => {
      const dateStr = entry.createdAt 
        ? new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) 
        : 'N/A';
      return `- ${dateStr}: Studied "${entry.task}" (Mood: ${entry.mood || 'Neutral'}). Strategy/Idea: "${entry.idea}"`;
    }).join('\n');

    return `### STUDENT JOURNAL LOGS\nLatest logs:\n${logs}\n\n`;
  } catch (error) {
    console.error('Error gathering journal context:', error);
    return '';
  }
};
