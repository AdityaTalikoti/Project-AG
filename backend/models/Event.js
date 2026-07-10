import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  time: {
    type: Date,
    required: true
  },
  method: {
    type: String,
    enum: ['popup', 'email', 'push'],
    default: 'email'
  },
  sent: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const recurrenceSchema = new mongoose.Schema({
  pattern: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  interval: {
    type: Number,
    default: 1
  },
  endDate: {
    type: Date
  }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  startDateTime: {
    type: Date,
    required: [true, 'Start date and time is required'],
    index: true
  },
  endDateTime: {
    type: Date,
    required: [true, 'End date and time is required'],
    index: true
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  color: {
    type: String,
    trim: true,
    default: '#10B981' // Tailwind emerald-500 default hex
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator User reference is required'],
    index: true
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    default: null
  },
  isRoadmapEvent: {
    type: Boolean,
    default: false
  },
  reminderEnabled: {
    type: Boolean,
    default: false
  },
  reminders: {
    type: [reminderSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  recurrence: {
    type: recurrenceSchema,
    default: () => ({ pattern: 'none', interval: 1 })
  },
  googleCalendarEventId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Composite index for fast filtering of a user's events by range
eventSchema.index({ createdBy: 1, startDateTime: 1, endDateTime: 1 });

export default mongoose.model('Event', eventSchema);
