import express from 'express';
import FocusSession from '../models/FocusSession.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

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

function getTimezoneOffsetMs(date, timezone) {
  try {
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    return tzDate.getTime() - utcDate.getTime();
  } catch (e) {
    return 0;
  }
}

// @route   POST /api/focus-session
// @desc    Log a new completed focus session
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { duration, timezone } = req.body;
    const clientTimezone = timezone || 'UTC';
    const studentId = req.user.id;

    if (duration === undefined || typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid duration. Duration must be a positive number of seconds.' 
      });
    }

    const endTimeMs = Date.now();
    const startTimeMs = endTimeMs - duration * 1000;
    
    const startDateStr = getLocalDateStr(new Date(startTimeMs), clientTimezone);
    const endDateStr = getLocalDateStr(new Date(endTimeMs), clientTimezone);

    if (startDateStr !== endDateStr) {
      // Crossed midnight!
      // Find the midnight timestamp in the user's timezone
      const tempDate = new Date(endTimeMs);
      const endYear = tempDate.toLocaleString('en-US', { timeZone: clientTimezone, year: 'numeric' });
      const endMonth = tempDate.toLocaleString('en-US', { timeZone: clientTimezone, month: '2-digit' });
      const endDay = tempDate.toLocaleString('en-US', { timeZone: clientTimezone, day: '2-digit' });
      
      const midnightUtc = Date.UTC(parseInt(endYear, 10), parseInt(endMonth, 10) - 1, parseInt(endDay, 10), 0, 0, 0);
      const offsetMs = getTimezoneOffsetMs(new Date(midnightUtc), clientTimezone);
      const midnightEpoch = midnightUtc - offsetMs;

      // Splitting
      const durationBeforeMidnight = Math.max(0, Math.round((midnightEpoch - startTimeMs) / 1000));
      const durationAfterMidnight = Math.max(0, Math.round((endTimeMs - midnightEpoch) / 1000));

      const sessionsToSave = [];
      if (durationBeforeMidnight > 0) {
        sessionsToSave.push(new FocusSession({
          studentId,
          duration: durationBeforeMidnight,
          createdAt: new Date(midnightEpoch - 1000) // just before midnight
        }));
      }
      if (durationAfterMidnight > 0) {
        sessionsToSave.push(new FocusSession({
          studentId,
          duration: durationAfterMidnight,
          createdAt: new Date(endTimeMs)
        }));
      }

      await Promise.all(sessionsToSave.map(s => s.save()));

      return res.status(201).json({ 
        success: true, 
        message: 'Focus session split and recorded successfully across midnight', 
        data: sessionsToSave[sessionsToSave.length - 1]
      });
    }

    const session = new FocusSession({
      studentId,
      duration: Math.round(duration)
    });

    await session.save();

    res.status(201).json({ 
      success: true, 
      message: 'Focus session recorded successfully', 
      data: session 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
