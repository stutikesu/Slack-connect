import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/db';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import { initializeScheduler } from './services/scheduler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
} else {
  // In development mode, redirect root to frontend URL
  app.get('/', (req, res) => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  });
}

// Initialize the database
initializeDatabase().then(() => {
  console.log('Database initialized');
  
  // Start the message scheduler
  initializeScheduler();
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});