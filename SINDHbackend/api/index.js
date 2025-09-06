// Serverless entry point for Vercel
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const workerRoutes = require('./routes/workerRoutes');
const Worker = require('./models/Worker');
const employerRoutes = require('./routes/employerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const translationRoutes = require('./routes/translationRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Dynamic CORS configuration
const getCorsOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:8080',
    'capacitor://localhost',
    'ionic://localhost',
    // Vercel frontend domains
    'https://sindh-frontend.vercel.app',
    'https://sindh-frontend-git-production.vercel.app',
    'https://sindh-frontend-amar3012005s-projects.vercel.app',
    // Legacy Netlify domains (backup)
    'https://splendid-travesseiro-45ebea.netlify.app',
    'https://sindh-frontend.netlify.app',
    'https://sindh-app.netlify.app'
  ];
  
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(','));
  }
  
  return origins;
};

// Database connection (singleton pattern for serverless)
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await connectDB();
    isConnected = true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// CORS configuration
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Type', 'User-ID']
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.status(200).json({ 
      status: 'ok',
      services: {
        database: 'connected',
        server: 'running'
      },
      environment: process.env.NODE_ENV || 'production',
      corsOrigins: getCorsOrigins(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Initialize database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Ensure Worker indexes
const ensureIndexes = async () => {
  try {
    if (Worker && typeof Worker.ensureIndexes === 'function') {
      await Worker.ensureIndexes();
    }
  } catch (error) {
    console.warn('Worker index ensure skipped:', error?.message);
  }
};

// Initialize indexes
ensureIndexes();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/translate', translationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Export for Vercel
module.exports = app;
