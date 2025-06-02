const Job = require('../models/Job');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create new job
exports.createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = new Job({
      ...req.body,
      employer: req.user.userId
    });

    await job.save();

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Error in createJob:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all jobs with filters
exports.getJobs = async (req, res) => {
  try {
    const {
      category,
      skills,
      minWage,
      maxWage,
      location,
      radius,
      status = 'open'
    } = req.query;

    let query = { status };

    // Apply filters
    if (category) {
      query.category = category;
    }

    if (skills) {
      query.skills = { $in: skills.split(',') };
    }

    if (minWage || maxWage) {
      query['wage.amount'] = {};
      if (minWage) query['wage.amount'].$gte = Number(minWage);
      if (maxWage) query['wage.amount'].$lte = Number(maxWage);
    }

    // Location-based search
    if (location && radius) {
      const [longitude, latitude] = location.split(',').map(Number);
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: Number(radius) * 1000 // Convert km to meters
        }
      };
    }

    const jobs = await Job.find(query)
      .populate('employer', 'profile.name profile.location')
      .sort({ createdAt: -1 });

    res.status(200).json({ jobs });
  } catch (error) {
    console.error('Error in getJobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'profile.name profile.location')
      .populate('applications.worker', 'profile.name profile.skills shakthiScore.score');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ job });
  } catch (error) {
    console.error('Error in getJobById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Post a new job
exports.postJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      employer: req.user.userId
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      message: 'Job posted successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ message: 'Error posting job', error: error.message });
  }
};

// Search jobs
exports.searchJobs = async (req, res) => {
  try {
    const {
      query,
      location,
      employmentType,
      minSalary,
      maxSalary,
      skills,
      page = 1,
      limit = 10
    } = req.query;

    const searchQuery = { status: 'active' };

    if (query) {
      searchQuery.$text = { $search: query };
    }

    if (location) {
      searchQuery['location.address'] = { $regex: location, $options: 'i' };
    }

    if (employmentType) {
      searchQuery.employmentType = employmentType;
    }

    if (minSalary || maxSalary) {
      searchQuery.salary = {};
      if (minSalary) searchQuery.salary.$gte = Number(minSalary);
      if (maxSalary) searchQuery.salary.$lte = Number(maxSalary);
    }

    if (skills) {
      searchQuery.requiredSkills = { $in: skills.split(',') };
    }

    const jobs = await Job.find(searchQuery)
      .populate('employer', 'profile.name profile.headline profile.avatar')
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Job.countDocuments(searchQuery);

    res.json({
      jobs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching jobs', error: error.message });
  }
};

// Get job details
exports.getJobDetails = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'profile.name profile.headline profile.avatar')
      .populate('applications.applicant', 'profile.name profile.headline profile.avatar');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment views
    job.views += 1;
    await job.save();

    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job details', error: error.message });
  }
};

// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const { resume, coverLetter } = req.body;
    const job = await Job.findById(req.params.id);
    const user = await User.findById(req.user.userId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const hasApplied = job.applications.some(
      app => app.applicant.toString() === req.user.userId
    );

    if (hasApplied) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Add application
    job.applications.push({
      applicant: req.user.userId,
      resume,
      coverLetter
    });

    job.applicationsCount += 1;
    await job.save();

    // Add to user's applied jobs
    user.appliedJobs.push({
      job: job._id,
      status: 'applied'
    });

    await user.save();

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error applying for job', error: error.message });
  }
};

// Save job
exports.saveJob = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const jobId = req.params.id;

    if (user.savedJobs.includes(jobId)) {
      return res.status(400).json({ message: 'Job already saved' });
    }

    user.savedJobs.push(jobId);
    await user.save();

    res.json({ message: 'Job saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving job', error: error.message });
  }
};

// Update job status
exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the employer
    if (job.employer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    job.status = status;
    await job.save();

    res.json({ message: 'Job status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating job status', error: error.message });
  }
};

// Get recommended jobs for worker
exports.getRecommendedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const jobs = await Job.matchWithWorker(req.user.userId);

    res.status(200).json({ jobs });
  } catch (error) {
    console.error('Error in getRecommendedJobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 