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
const PORT = process.env.PORT || 5000;

// Initialize server with database connection
const initializeServer = async () => {
  try {
    // First, ensure MongoDB is running
    await connectDB();

    // CORS configuration - Allow frontend connections
    app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'https://splendid-travesseiro-45ebea.netlify.app'],
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
        }
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

    // Start server only after successful DB connection
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Server initialization failed:', error.message);
    process.exit(1);
  }
};

// Start server
initializeServer();