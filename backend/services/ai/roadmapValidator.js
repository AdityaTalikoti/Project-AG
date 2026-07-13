/**
 * Sanitizes and validates the raw JSON response from Gemini.
 * Ensuring it complies with the required structured roadmap format.
 *
 * @param {string} rawText - Raw string from Gemini.
 * @returns {Object} Validated structured roadmap.
 * @throws {Error} If parsing fails or structural validation is unsatisfied.
 */
export const validateRoadmapJSON = (rawText) => {
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

  // 3. Validate root properties
  if (!parsed.title || typeof parsed.title !== 'string') {
    throw new Error('Roadmap title is missing or not a string');
  }
  if (!parsed.milestones || !Array.isArray(parsed.milestones)) {
    throw new Error('Roadmap milestones are missing or not an array');
  }

  // 4. Validate and construct milestones
  const validatedMilestones = parsed.milestones.map((m, idx) => {
    if (!m.title || typeof m.title !== 'string') {
      throw new Error(`Milestone at index ${idx} title is missing or not a string`);
    }

    return {
      title: m.title.trim(),
      description: (m.description || '').trim(),
      duration: (m.duration || '1 week').trim(),
      priority: ['High', 'Medium', 'Low', 'high', 'medium', 'low'].includes(m.priority) 
        ? (m.priority.charAt(0).toUpperCase() + m.priority.slice(1).toLowerCase())
        : 'Medium',
      topics: Array.isArray(m.topics) ? m.topics.map(t => String(t).trim()).filter(Boolean) : [],
      resources: Array.isArray(m.resources) ? m.resources.map(r => String(r).trim()).filter(Boolean) : []
    };
  });

  return {
    title: parsed.title.trim(),
    estimatedDuration: parsed.estimatedDuration || '4 weeks',
    description: parsed.description || `Custom roadmap for ${parsed.title}`,
    milestones: validatedMilestones
  };
};
