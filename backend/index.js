import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js';
import dashboardRoutes from './routes/dashboard.js';
import goalsRoutes from './routes/goals.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/goals', goalsRoutes);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ScholarSync API is running' });
});

// ── Static frontend serving (production) ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ── MongoDB + Server Start ──
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholarsync';

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