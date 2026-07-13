/**
 * Sanitizes and validates the raw JSON response from Gemini for the study planner.
 *
 * @param {string} rawText - Raw string output from Gemini
 * @returns {Object} Validated study plan object
 * @throws {Error} If parsing fails or required fields are missing
 */
export const validateStudyPlanJSON = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Raw response is empty or not a string');
  }

  // 1. Clean markdown code fences if present
  let cleanText = rawText.trim();
  cleanText = cleanText.replace(/^\s*```(?:json)?/gi, '');
  cleanText = cleanText.replace(/```\s*$/g, '');
  cleanText = cleanText.trim();

  // 2. Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(cleanText);
  } catch (err) {
    throw new Error(`JSON parsing failed: ${err.message}`);
  }

  // 3. Validate properties
  const workloadStatus = ['Light', 'Balanced', 'Busy'].includes(parsed.workloadStatus)
    ? parsed.workloadStatus
    : 'Balanced';

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error('Study plan tasks are missing or not an array');
  }

  // Validate tasks
  const validatedTasks = parsed.tasks.map((t, idx) => {
    if (!t.title) {
      throw new Error(`Task at index ${idx} is missing a title`);
    }
    return {
      title: String(t.title).trim(),
      duration: String(t.duration || '30 min').trim(),
      completed: Boolean(t.completed)
    };
  });

  // Validate recommendations
  const validatedRecommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations.map((r, idx) => {
        if (!r.message) {
          throw new Error(`Recommendation at index ${idx} is missing a message`);
        }
        return {
          message: String(r.message).trim(),
          actionType: ['reschedule', 'info'].includes(r.actionType) ? r.actionType : 'info',
          metadata: r.metadata || null
        };
      })
    : [];

  return {
    workloadStatus,
    tasks: validatedTasks,
    recommendations: validatedRecommendations
  };
};
