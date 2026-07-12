import Journal from '../../models/Journal.js';
import { generateGeminiReply } from './geminiService.js';

/**
 * Gathers the latest 5 journal entries for the authenticated student,
 * extracts key information, and summarizes them using Gemini.
 *
 * @param {string} studentId - The ID of the authenticated user.
 * @returns {Promise<string>} - The summarized journal context, or empty string.
 */
export const buildJournalContext = async (studentId) => {
  if (!studentId) {
    return '';
  }

  try {
    // Performance optimization: fetch only required fields for latest 5 entries
    const journals = await Journal.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('task idea aiFeedback createdAt')
      .lean();

    // Gracefully handle cases where no journal entries exist
    if (!journals || journals.length === 0) {
      return '';
    }

    // Format the journal entries for the summarization prompt
    const formattedJournals = journals.map((entry, index) => {
      const dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A';
      return `Entry ${index + 1} (Date: ${dateStr}):
- Task: ${entry.task}
- Idea/Approach: ${entry.idea}
- Feedback: ${entry.aiFeedback?.feedback || 'None'}
- Next Step: ${entry.aiFeedback?.nextStep || 'None'}`;
    }).join('\n\n');

    // Build a concise prompt to summarize topics studied, struggles, completions, and progress
    const prompt = `You are a professional study helper. Analyze the following recent learning journal entries of a student:

${formattedJournals}

Provide a very concise, structured summary (max 100-120 words) of their recent learning journey.
Specifically summarize:
1. Topics studied & completed
2. Challenges/topics they struggled with
3. Learning progress & reflections

Do not fabricate information. Keep it factual and directly based on the provided logs. Start your reply directly with the summary, without any introductions (e.g. do not say "Here is the summary:") or greetings.`;

    // Use Gemini service for summarization
    const summary = await generateGeminiReply(prompt);

    if (!summary || summary.trim() === '') {
      return '';
    }

    // Return structured context block
    return `### STUDENT JOURNAL SUMMARY\n\nBelow is a summary of the student's recent learning reflections and journals. Use this to naturally reference their progress, struggles, or topics studied if relevant to their message:\n\n${summary.trim()}\n\n`;
  } catch (error) {
    console.error('Error in buildJournalContext:', error);
    // Gracefully fallback to empty context so the chat doesn't break
    return '';
  }
};
