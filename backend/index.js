import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js';
import dashboardRoutes from './routes/dashboard.js';
import goalsRoutes from './routes/goals.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/goals', goalsRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ScholarSync API is running' });
});

// Setup static directory serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve the React app for any other requests
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholarsync';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
