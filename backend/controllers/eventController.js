import Event from '../models/Event.js';

// Centralized error handler helper
const handleControllerError = (res, error, defaultMessage = 'Internal Server Error') => {
  console.error('Error in Event Controller:', error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {})
    });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${error.path}`
    });
  }
  return res.status(500).json({
    success: false,
    message: defaultMessage
  });
};

/**
 * Create a new calendar event.
 */
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      category,
      color,
      roadmapId,
      isRoadmapEvent,
      reminderEnabled,
      reminders,
      status,
      recurrence
    } = req.body;

    const event = await Event.create({
      title,
      description,
      startDateTime,
      endDateTime,
      category,
      color,
      createdBy: req.user.id,
      roadmapId,
      isRoadmapEvent,
      reminderEnabled,
      reminders,
      status,
      recurrence
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to create event');
  }
};

/**
 * Update an existing calendar event.
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Verify ownership
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this event'
      });
    }

    const updates = req.body;
    
    // Prevent modification of creator
    delete updates.createdBy;

    // Apply updates
    Object.keys(updates).forEach((key) => {
      event[key] = updates[key];
    });

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to update event');
  }
};

/**
 * Delete a calendar event.
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Verify ownership
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this event'
      });
    }

    await Event.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to delete event');
  }
};

/**
 * Get a single calendar event by ID.
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Verify ownership
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this event'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to retrieve event');
  }
};

/**
 * Get all events for the authenticated user, supporting optional start/end filters.
 */
export const getAllUserEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = { createdBy: req.user.id };

    if (start && !isNaN(Date.parse(start))) {
      query.startDateTime = { $gte: new Date(start) };
    }
    if (end && !isNaN(Date.parse(end))) {
      query.endDateTime = { $lte: new Date(end) };
    }

    const events = await Event.find(query).sort({ startDateTime: 1 }).lean();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to retrieve events');
  }
};

/**
 * Get all events occurring today for the authenticated user, relative to their timezone.
 */
export const getTodayEvents = async (req, res) => {
  try {
    const clientTimezone = req.query.timezone || 'UTC';
    const now = new Date();

    let startOfDay, endOfDay;
    try {
      const localDateStr = new Intl.DateTimeFormat('en-US', {
        timeZone: clientTimezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).format(now);

      const [m, d, y] = localDateStr.split('/');
      const paddedMonth = m.padStart(2, '0');
      const paddedDay = d.padStart(2, '0');
      const dateString = `${y}-${paddedMonth}-${paddedDay}`;

      // Helper to compute local midnight representation in absolute UTC
      const getUTCMidnight = (dateStr, timeStr, tz) => {
        const combined = `${dateStr}T${timeStr}`;
        const locDate = new Date(new Date(combined).toLocaleString('en-US', { timeZone: tz }));
        const diff = new Date(combined).getTime() - locDate.getTime();
        return new Date(new Date(combined).getTime() + diff);
      };

      startOfDay = getUTCMidnight(dateString, '00:00:00.000', clientTimezone);
      endOfDay = getUTCMidnight(dateString, '23:59:59.999', clientTimezone);
    } catch (e) {
      // Safe fallback to server UTC boundaries
      const dateString = now.toISOString().split('T')[0];
      startOfDay = new Date(`${dateString}T00:00:00.000Z`);
      endOfDay = new Date(`${dateString}T23:59:59.999Z`);
    }

    // Overlap query: startDateTime <= endOfDay && endDateTime >= startOfDay
    const events = await Event.find({
      createdBy: req.user.id,
      startDateTime: { $lte: endOfDay },
      endDateTime: { $gte: startOfDay }
    }).sort({ startDateTime: 1 }).lean();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    handleControllerError(res, error, "Failed to retrieve today's events");
  }
};

/**
 * Get all upcoming events (starting from current moment onwards).
 */
export const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      createdBy: req.user.id,
      startDateTime: { $gte: now }
    }).sort({ startDateTime: 1 }).lean();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to retrieve upcoming events');
  }
};

/**
 * Get a quick list of upcoming dashboard events (limited to next 5 events).
 */
export const getDashboardEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      createdBy: req.user.id,
      endDateTime: { $gte: now } // Include events currently ongoing or upcoming
    })
      .sort({ startDateTime: 1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to retrieve dashboard events');
  }
};
