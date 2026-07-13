import Goal from '../../models/Goal.js';
import Roadmap from '../../models/Roadmap.js';
import Event from '../../models/Event.js';
import Journal from '../../models/Journal.js';
import AIInsight from '../../models/AIInsight.js';

// Timezone-aware date string formatter
function getLocalDateStr(date, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return new Date(date).toISOString().split('T')[0];
  }
}

/**
 * Computes a unique version signature based on current date (timezone specific)
 * and count/modification times of Goals, Roadmaps, Calendar Events, and Journals.
 *
 * @param {string} userId - The authenticated user's ID
 * @param {string} timezone - Client timezone (default 'UTC')
 * @returns {Promise<string>} Fingerprint string representing the data state.
 */
export const computeSourceVersion = async (userId, timezone = 'UTC') => {
  const dateStr = getLocalDateStr(new Date(), timezone);

  const getStats = async (model, query) => {
    try {
      const count = await model.countDocuments(query);
      const latest = await model.findOne(query).sort({ updatedAt: -1 }).select('updatedAt').lean();
      const latestTime = latest && latest.updatedAt ? new Date(latest.updatedAt).getTime() : 0;
      return `${count}:${latestTime}`;
    } catch (err) {
      console.error(`Error computing source version stats for ${model.modelName}:`, err);
      return '0:0';
    }
  };

  const goalsKey = await getStats(Goal, { studentId: userId });
  const roadmapsKey = await getStats(Roadmap, { studentId: userId });
  const eventsKey = await getStats(Event, { createdBy: userId });
  const journalsKey = await getStats(Journal, { studentId: userId });

  return `${dateStr}|goals:${goalsKey}|roadmaps:${roadmapsKey}|events:${eventsKey}|journals:${journalsKey}`;
};

/**
 * Retrieves the cached insight document for a specific user.
 *
 * @param {string} userId
 * @returns {Promise<Object|null>} AIInsight document.
 */
export const getCachedInsight = async (userId) => {
  return await AIInsight.findOne({ userId }).lean();
};

/**
 * Verifies if the cached insight matches the current data version signature
 * and has not expired.
 *
 * @param {Object} cachedInsight - The retrieved AIInsight document.
 * @param {string} currentSourceVersion - The newly computed version signature.
 * @returns {boolean} True if cache is valid and can be served directly.
 */
export const isCacheValid = (cachedInsight, currentSourceVersion) => {
  if (!cachedInsight) return false;
  if (cachedInsight.sourceVersion !== currentSourceVersion) return false;
  if (cachedInsight.expiresAt && new Date() > new Date(cachedInsight.expiresAt)) return false;
  return true;
};

/**
 * Upserts a new or updated AI Insight cache record.
 *
 * @param {string} userId
 * @param {string} summary - AI generated text.
 * @param {string} sourceVersion - Version signature used to generate this summary.
 * @returns {Promise<Object>} The saved database document.
 */
export const saveCachedInsight = async (userId, summary, sourceVersion) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Expires in 24 hours

  return await AIInsight.findOneAndUpdate(
    { userId },
    {
      summary,
      generatedAt: now,
      expiresAt,
      sourceVersion
    },
    { upsert: true, new: true }
  );
};
