export const validateEventInput = (req, res, next) => {
  const { title, startDateTime, endDateTime } = req.body;

  const errors = {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.title = 'Title is required and must be a valid string';
  }

  if (!startDateTime) {
    errors.startDateTime = 'Start date and time is required';
  } else if (isNaN(Date.parse(startDateTime))) {
    errors.startDateTime = 'Invalid start date and time format';
  }

  if (!endDateTime) {
    errors.endDateTime = 'End date and time is required';
  } else if (isNaN(Date.parse(endDateTime))) {
    errors.endDateTime = 'Invalid end date and time format';
  }

  if (startDateTime && endDateTime && !errors.startDateTime && !errors.endDateTime) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end < start) {
      errors.endDateTime = 'End date/time cannot be before start date/time';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};
