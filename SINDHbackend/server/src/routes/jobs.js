const express = require('express');
const router = express.Router();
const JobController = require('../controllers/JobController');

// Create a new job
router.post('/', JobController.createJob);

// Get job by ID
router.get('/:jobId', JobController.getJobById);

// Apply for a job
router.post('/:jobId/apply', JobController.applyForJob);

// Get matching jobs for a worker
router.get('/worker/:workerId/matches', JobController.getMatchingJobs);

module.exports = router; 