import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js';
import dashboardRoutes from './routes/dashboard.js';
import goalsRoutes from './routes/goals.js';
import focusSessionRoutes from './routes/focusSession.js';
import roadmapRoutes from './routes/roadmaps.js';
import eventRoutes from './routes/events.js';
import aiRoutes from './routes/aiRoutes.js';
import taskRoutes from './routes/tasks.js';
import taskSubmissionRoutes from './routes/taskSubmissions.js';
import { errorHandler } from './middleware/errorHandler.js';
import { originVerification } from './middleware/csrfProtection.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';
import { mongoSanitizerMiddleware } from './validation/sanitizer.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 8080;

// Normalize frontend URL origin
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5174')
  .replace(/\/$/, '')
  .replace(/\/auth$/, '');

// ─────────────────────────────
// Middleware
// ─────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Anti-CSRF Origin verification & Mongo operator sanitizer
app.use(originVerification);
app.use(mongoSanitizerMiddleware);

// Rate Limiting
app.use('/api/', generalApiLimiter);

// ─────────────────────────────
// Routes
// ─────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/focus-session', focusSessionRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks', taskSubmissionRoutes);

// ─────────────────────────────
// Root Route
// ─────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 ScholarSync Backend API is running successfully!',
    version: '1.0.0',
  });
});

// ─────────────────────────────
// Health Check
// ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'ScholarSync API is healthy',
  });
});

// ─────────────────────────────
// Global Error Handler
// ─────────────────────────────
app.use(errorHandler);

// ─────────────────────────────
// MongoDB Connection
// ─────────────────────────────
const MONGODB_URI =
  process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });