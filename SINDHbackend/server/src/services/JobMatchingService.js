const Worker = require('../models/Worker');
const Job = require('../models/Job');
const NotificationService = require('./NotificationService');

class JobMatchingService {
  // Calculate match score between worker and job
  calculateMatchScore(worker, job) {
    let score = 0;
    const weights = {
      skills: 0.4,
      experience: 0.3,
      location: 0.3
    };

    // Skills match
    if (worker.skills && worker.skills.length > 0) {
      const skillScore = 1; // Basic skill match
      score += skillScore * weights.skills;
    }

    // Experience match
    if (worker.experience_years) {
      const experienceScore = worker.experience_years > 0 ? 1 : 0;
      score += experienceScore * weights.experience;
    }

    // Location match (using city and state)
    const locationScore = this.calculateLocationScore(worker, job);
    score += locationScore * weights.location;

    return score;
  }

  // Calculate location match score based on city and state
  calculateLocationScore(worker, job) {
    let score = 0;
    
    // Check if state matches
    if (worker.location.state === job.location.state) {
      score += 0.6;
      
      // If city also matches, add more points
      if (worker.location.district === job.location.city) {
        score += 0.4;
      }
    }
    
    return score;
  }

  // Find matching workers for a job
  async findMatchingWorkers(job, minMatchScore = 0.6) {
    try {
      // Find workers in the same state
      const nearbyWorkers = await Worker.find({
        'location.state': job.location.state,
        available: true
      });

      // Calculate match scores for nearby workers
      const matchedWorkers = nearbyWorkers
        .map(worker => ({
          worker,
          score: this.calculateMatchScore(worker, job)
        }))
        .filter(match => match.score >= minMatchScore)
        .sort((a, b) => b.score - a.score);

      return matchedWorkers;
    } catch (error) {
      console.error('Error finding matching workers:', error);
      throw error;
    }
  }

  // Find matching jobs for a worker
  async findMatchingJobs(worker, minMatchScore = 0.6) {
    try {
      // Find jobs in the same state
      const nearbyJobs = await Job.find({
        'location.state': worker.location.state,
        status: 'active'
      });

      // Calculate match scores for nearby jobs
      const matchedJobs = nearbyJobs
        .map(job => ({
          job,
          score: this.calculateMatchScore(worker, job)
        }))
        .filter(match => match.score >= minMatchScore)
        .sort((a, b) => b.score - a.score);

      return matchedJobs;
    } catch (error) {
      console.error('Error finding matching jobs:', error);
      throw error;
    }
  }

  // Notify matching workers about a new job
  async notifyMatchingWorkers(job) {
    try {
      const matches = await this.findMatchingWorkers(job);
      
      // Notify workers with high match scores
      for (const match of matches) {
        if (match.score >= 0.8) { // Only notify workers with very good matches
          await NotificationService.notifyWorkerAboutJob(match.worker, job);
        }
      }

      return matches.length;
    } catch (error) {
      console.error('Error notifying matching workers:', error);
      throw error;
    }
  }
}

module.exports = new JobMatchingService(); 