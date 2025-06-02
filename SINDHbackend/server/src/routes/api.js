const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const jobController = require('../controllers/jobController');
const workerRoutes = require('./workerRoutes');
const auth = require('../middleware/auth');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Worker routes
router.use('/workers', workerRoutes);

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', auth, authController.getProfile);
router.put('/auth/profile', auth, authController.updateProfile);
router.post('/auth/connect', auth, authController.sendConnectionRequest);
router.put('/auth/connect/:requestId', auth, authController.handleConnectionRequest);

// Job routes
router.post('/jobs', auth, jobController.postJob);
router.get('/jobs', jobController.searchJobs);
router.get('/jobs/:id', jobController.getJobDetails);
router.post('/jobs/:id/apply', auth, jobController.applyForJob);
router.post('/jobs/:id/save', auth, jobController.saveJob);
router.put('/jobs/:id/status', auth, jobController.updateJobStatus);

module.exports = router; 