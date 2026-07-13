import Event from '../../models/Event.js';
import Roadmap from '../../models/Roadmap.js';

/**
 * Synchronizes module milestones of a roadmap with Calendar Events.
 * Reuses existing events where possible and deletes extra ones to avoid duplicates.
 *
 * @param {string} roadmapId
 * @param {string} studentId
 */
export const syncRoadmapToCalendar = async (roadmapId, studentId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, studentId });
  if (!roadmap) {
    throw new Error('Roadmap not found');
  }

  const existingEvents = await Event.find({
    roadmapId,
    createdBy: studentId,
    isRoadmapEvent: true
  }).sort({ startDateTime: 1 });

  const parseDurationToDays = (durationStr) => {
    if (!durationStr) return 7;
    const match = durationStr.match(/(\d+)\s*(day|week|month)/i);
    if (!match) return 7;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit.startsWith('day')) return value;
    if (unit.startsWith('week')) return value * 7;
    if (unit.startsWith('month')) return value * 30;
    return 7;
  };

  let currentDate = new Date();
  // Reset time to 09:00 for the start of the study blocks
  currentDate.setHours(9, 0, 0, 0);

  const modules = roadmap.modules;

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const durationDays = parseDurationToDays(mod.estimatedDuration);

    const startDateTime = new Date(currentDate);
    const endDateTime = new Date(currentDate);
    // End the event on the same day or duration days later (at 18:00)
    endDateTime.setDate(startDateTime.getDate() + Math.max(0, durationDays - 1));
    endDateTime.setHours(18, 0, 0, 0);

    // Increment start date for the next module
    currentDate.setDate(currentDate.getDate() + durationDays);

    const expectedTitle = mod.title;
    const expectedDescription = mod.description || '';

    if (i < existingEvents.length) {
      // Update existing event to preserve ID
      const evt = existingEvents[i];
      evt.title = expectedTitle;
      evt.description = expectedDescription;
      evt.startDateTime = startDateTime;
      evt.endDateTime = endDateTime;
      evt.category = roadmap.category || 'Study';
      evt.color = '#8B5CF6'; // Violet color accent
      evt.status = 'upcoming';
      
      await evt.save();
    } else {
      // Create new event
      await Event.create({
        title: expectedTitle,
        description: expectedDescription,
        startDateTime,
        endDateTime,
        category: roadmap.category || 'Study',
        color: '#8B5CF6',
        createdBy: studentId,
        roadmapId,
        isRoadmapEvent: true,
        status: 'upcoming'
      });
    }
  }

  // Delete any trailing events (e.g. if modules count decreased)
  if (existingEvents.length > modules.length) {
    const eventsToDelete = existingEvents.slice(modules.length);
    const idsToDelete = eventsToDelete.map(e => e._id);
    await Event.deleteMany({ _id: { $in: idsToDelete } });
  }
};
