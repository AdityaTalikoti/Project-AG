import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { validateEventInput } from '../validation/eventValidation.js';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getAllUserEvents,
  getTodayEvents,
  getUpcomingEvents,
  getDashboardEvents
} from '../controllers/eventController.js';

const router = express.Router();

// Enforce authentication for all calendar operations
router.use(authMiddleware);

// Static GET queries (ordered BEFORE parameter-based :id to prevent matching clashes)
router.get('/today', getTodayEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/dashboard', getDashboardEvents);

// List and single fetch operations
router.get('/', getAllUserEvents);
router.get('/:id', getEventById);

// Write and edit operations
router.post('/', validateEventInput, createEvent);
router.put('/:id', validateEventInput, updateEvent);
router.delete('/:id', deleteEvent);

export default router;
