require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const workerRoutes = require('./routes/workerRoutes');
const employerRoutes = require('./routes/employerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Use Render's dynamic port or fallback to 10000 for local development
const PORT = process.env.PORT || 10000;

// Dynamic CORS configuration based on environment
const getCorsOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:8080', // For Capacitor development
    'capacitor://localhost', // For Capacitor iOS
    'ionic://localhost' // For Capacitor Android
  ];
  
  // Add production origins
  if (process.env.NODE_ENV === 'production') {
    origins.push(
      'https://splendid-travesseiro-45ebea.netlify.app',
      'https://sindh-frontend.netlify.app',
      'https://sindh-app.netlify.app'
    );
  }
  
  // Add custom origins from environment variables
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(','));
  }
  
  return origins;
};

// Initialize server with database connection
const initializeServer = async () => {
  try {
    // First, ensure MongoDB is running
    await connectDB();

    // CORS configuration - Allow frontend connections
    app.use(cors({
      origin: getCorsOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'User-Type', 'User-ID']
    }));

    // Middleware
    app.use(express.json());

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok',
        services: {
          database: 'connected',
          server: 'running'
        },
        environment: process.env.NODE_ENV || 'development',
        corsOrigins: getCorsOrigins()
      });
    });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/workers', workerRoutes);
    app.use('/api/employers', employerRoutes);
    app.use('/api/jobs', jobRoutes);
    app.use('/api/job-applications', jobApplicationRoutes);
    app.use('/api/notifications', notificationRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Something went wrong!' });
    });

    // Bind to 0.0.0.0 to accept connections from any IP (required for Render)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Allowed CORS origins:`, getCorsOrigins());
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`📡 API available at https://sindh-backend.onrender.com/api`);
      } else {
        console.log(`📡 API available at http://localhost:${PORT}/api`);
        console.log(`🔗 Local development URL: http://localhost:${PORT}/api`);
      }
      
      console.log('🎉 Your service is live!');
    });
  } catch (error) {
    console.error('❌ Server initialization failed:', error.message);
    process.exit(1);
  }
};

// Start server
initializeServer();