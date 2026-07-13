import { generateGeminiReply } from './geminiService.js';

/**
 * Clean up markdown fences from raw text.
 */
const cleanJSONText = (text) => {
  let cleanText = text.trim();
  cleanText = cleanText.replace(/^\s*```(?:json)?/gi, '');
  cleanText = cleanText.replace(/```\s*$/g, '');
  return cleanText.trim();
};

/**
 * Analyzes the user's current roadmap milestone list and provides logical hints/warnings.
 *
 * @param {Object} roadmapData - Object containing title, skillLevel, dailyCommitment, and milestones list.
 * @returns {Promise<Array>} Array of suggestion objects { message: string, type: 'warning'|'tip'|'info' }.
 */
export const generateSmartSuggestions = async (roadmapData = {}) => {
  const {
    title = '',
    skillLevel = 'Beginner',
    dailyCommitment = 60,
    milestones = []
  } = roadmapData;

  if (!milestones || milestones.length === 0) {
    return [];
  }

  try {
    const formattedMilestones = milestones.map((m, idx) => {
      return `Milestone ${idx + 1}: Title: "${m.title}", Description: "${m.description || ''}", Duration: "${m.duration || ''}", Priority: "${m.priority || 'Medium'}", Topics: [${(m.topics || []).join(', ')}]`;
    }).join('\n');

    const prompt = `You are an expert curriculum auditor. Analyze the following learning roadmap milestones list and provide optional smart suggestions for improvement.

Goal: "${title}"
Student Level: ${skillLevel}
Daily Commitment: ${dailyCommitment} minutes

Roadmap Milestones:
${formattedMilestones}

Analyze the milestones for:
1. Illogical sequencing: e.g., learning React before basic JavaScript, or learning Kubernetes before Docker, or deploying before writing code.
2. Missing critical topics: e.g., a MERN developer track that completely lacks Database/MongoDB modules or Authentication/JWT modules.
3. Unrealistic durations: e.g., trying to learn deep React concepts in just 1-2 days based on their ${dailyCommitment} mins/day commitment.

Return ONLY a single valid JSON object with the format:
{
  "suggestions": [
    {
      "message": "Write a helpful, specific 1-to-2 sentence suggestion.",
      "type": "warning | tip | info"
    }
  ]
}

Constraints:
- Suggestions must NEVER modify the roadmap automatically.
- Do NOT wrap in markdown fences.
- Return at most 2 relevant suggestions.
- If the roadmap is already logical, complete, and balanced, return an empty array for "suggestions".
`;

    console.log('Sending edited roadmap milestones to Gemini for review...');
    const reply = await generateGeminiReply(prompt);
    
    const cleanText = cleanJSONText(reply);
    const parsed = JSON.parse(cleanText);

    if (parsed && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions.map(s => ({
        message: s.message.trim(),
        type: ['warning', 'tip', 'info'].includes(s.type) ? s.type : 'info'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error generating smart suggestions from Gemini:', error.message);
    // Silent recovery: return no suggestions so the editor stays fully functional.
    return [];
  }
};
