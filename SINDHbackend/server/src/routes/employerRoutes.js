const express = require('express');
const router = express.Router();
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Register a new employer
router.post('/register', async (req, res) => {
  try {
    console.log('\n=== New Employer Registration ===');
    console.log('Received employer registration request:', req.body);
    const { name, phone, email, company, location, businessDescription, verificationDocuments } = req.body;

    // Check if employer already exists
    let employer = await Employer.findOne({ phone });
    if (employer) {
      console.log('Employer already exists with phone:', phone);
      return res.status(400).json({ message: 'Employer already exists with this phone number' });
    }

    // Format location data to match schema (address: String)
    const formattedLocationAddress = 
      `${location.village}, ${location.district}, ${location.state} - ${location.pincode}`; // Combine into a string

    console.log('Formatted Location Address:', formattedLocationAddress);

    // Format company data to ensure all required fields are present
    const formattedCompany = {
      name: company.name || '',
      type: company.type || '',
      industry: company.industry || '',
      description: company.description || '',
      registrationNumber: company.registrationNumber || ''
    };

    const employerData = {
      ...req.body,
      type: 'employer', // Explicitly set type
      isLoggedIn: 1
    };

    employer = new Employer({
      name,
      phone,
      email,
      company: formattedCompany,
      location: {
        village: location.village || '',
        district: location.district || '',
        state: location.state || '',
        pincode: location.pincode || '',
        address: formattedLocationAddress
      },
      businessDescription,
      verificationDocuments,
      documents: req.body.documents || [],
      preferredLanguages: req.body.preferredLanguages || [],
      rating: req.body.rating || { average: 0, count: 0 },
      reviews: req.body.reviews || [],
      otp: req.body.otp,
      verificationStatus: req.body.verificationStatus || 'pending'
    });

    console.log('Employer object before validation:', employer);

    // Validate against Mongoose schema before saving
    await employer.validate();
    console.log('Validation successful');

    await employer.save();
    console.log('Employer saved to database', employer);

    // Generate JWT token (optional)
    // const token = await employer.generateAuthToken();

    // Send response similar to worker registration
    const responseData = {
      success: true,
      message: 'Employer registered successfully',
      employer: {
        ...employer.toObject(),
        id: employer._id,
        _id: employer._id,
        type: 'employer', // Ensure type is included in response
        isLoggedIn: 1
      }
    };

    console.log('✅ Employer registered successfully:', {
      id: employer._id,
      name: employer.name,
      type: 'employer'
    });

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Employer registration error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', messages);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employer by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`=== Fetching Employer Profile ===`);
    console.log(`Employer ID: ${req.params.id}`);
    console.log(`User Type: ${req.headers['user-type'] || req.query.userType || 'Not specified'}`);
    
    // If user is not an employer, only return public data
    const isEmployerUser = (req.headers['user-type'] || req.query.userType) === 'employer';
    
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      console.log('❌ Employer not found');
      return res.status(404).json({ 
        success: false,
        message: 'Employer not found' 
      });
    }
    
    // Find all jobs posted by this employer
    const jobs = await Job.find({ employer: req.params.id });
    console.log(`Found ${jobs.length} jobs matching the criteria`);
    
    if (jobs.length > 0) {
      console.log('First job sample:', {
        id: jobs[0]._id,
        title: jobs[0].title,
        status: jobs[0].status,
        location: jobs[0].location,
        employer: jobs[0].employer
      });
    }
    
    console.log('✅ Employer data found:', {
      id: employer._id,
      name: employer.name,
      jobsCount: jobs.length
    });
    
    // If not an employer user, return limited data
    if (!isEmployerUser) {
      const publicData = {
        _id: employer._id,
        name: employer.name,
        company: {
          name: employer.company?.name,
          industry: employer.company?.industry
        },
        location: employer.location,
        rating: employer.rating,
        jobsCount: jobs.length
      };
      
      console.log('Returning public employer data (limited)');
      return res.json(publicData);
    }
    
    // For employer users, return full data
    const enrichedEmployer = {
      ...employer.toObject(),
      postedJobs: jobs.map(job => job._id)
    };
    
    res.json(enrichedEmployer);
  } catch (error) {
    console.error('❌ Error fetching employer:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update employer profile by ID
router.put('/:id', async (req, res) => {
  console.log('Received update employer request for ID:', req.params.id, ', data:', req.body);
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      console.log('Employer not found for update with ID:', req.params.id);
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Handle potential nested updates like location.address if frontend sends structured location
    if (req.body.location && typeof req.body.location === 'object' && req.body.location.address !== undefined) {
       // Assuming frontend sends { location: { address: '...' } } or similar
       employer.location.address = req.body.location.address;
       // If frontend sends nested village, district, etc., you might need to re-format here too
       // For now, assuming frontend sends formatted address for PUT
    } else if (req.body.location && typeof req.body.location === 'string') {
       employer.location.address = req.body.location;
    }

    // Update company name if sent
    if (req.body.company && req.body.company.name !== undefined) {
        employer.company.name = req.body.company.name;
    }
     // Update other top-level fields and potentially other nested fields
     Object.keys(req.body).forEach(key => {
        if (key !== 'location' && key !== 'company') {
             employer[key] = req.body[key];
        }
     });


    await employer.save();
    console.log('Employer updated successfully:', employer._id);
    res.json(employer);
  } catch (error) {
    console.error('Error updating employer profile:', error);
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors during update:', messages);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
});

// Get all jobs posted by an employer
router.get('/:id/jobs', async (req, res) => {
  console.log('Received request to get jobs for employer ID:', req.params.id);
  try {
    const jobs = await Job.find({ employer: req.params.id })
      .populate('selectedWorker', 'name phone shaktiScore')
      .populate('applications.worker', 'name phone shaktiScore');
    console.log(`Found ${jobs.length} jobs for employer ${req.params.id}`);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs for employer:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add a review for a worker
router.post('/:id/reviews', async (req, res) => {
  console.log('Received review request for employer ID:', req.params.id, ', review data:', req.body);
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      console.log('Employer not found for review with ID:', req.params.id);
      return res.status(404).json({ message: 'Employer not found' });
    }

    employer.reviews.push(req.body);
    await employer.save();
    console.log('Review added for employer:', employer._id);
    res.status(201).json(employer);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(400).json({ message: error.message });
  }
});

// Upload verification documents
router.post('/:id/documents', async (req, res) => {
   console.log('Received document upload request for employer ID:', req.params.id, ', document data:', req.body);
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
       console.log('Employer not found for document upload with ID:', req.params.id);
      return res.status(404).json({ message: 'Employer not found' });
    }

    const { type, url } = req.body;
    employer.documents.push({ type, url });
    await employer.save();
    console.log('Document added for employer:', employer._id);
    res.json(employer);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get employer statistics
router.get('/:id/stats', async (req, res) => {
   console.log('Received stats request for employer ID:', req.params.id);
  try {
    const jobs = await Job.find({ employer: req.params.id });
    
    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.status === 'open' || job.status === 'in-progress').length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      totalApplications: jobs.reduce((sum, job) => sum + job.applications.length, 0),
      averageApplicationsPerJob: jobs.length ? 
        jobs.reduce((sum, job) => sum + job.applications.length, 0) / jobs.length : 0
    };
    console.log('Generated stats for employer ID:', req.params.id, ':', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching employer stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Example: Get logged-in employer profile (requires auth middleware)
router.get('/profile', auth, async (req, res) => {
  try {
    const employer = await Employer.findById(req.user?.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    res.json(employer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post a new job
router.post('/jobs', auth, async (req, res) => {
  console.log('Received request to post job from employer:', req.user._id, ', job data:', req.body);
  try {
    const employerId = req.user._id;
    const jobData = { ...req.body, employer: employerId };
    
    // Create and save the new job
    const newJob = new Job(jobData);
    await newJob.save();
    
    // Update employer's postedJobs array
    await Employer.findByIdAndUpdate(
      employerId,
      { $push: { postedJobs: newJob._id } }
    );
    
    console.log('Job saved successfully:', newJob._id);
    res.status(201).json({ 
      message: 'Job posted successfully', 
      job: newJob 
    });
  } catch (error) {
    console.error('Error posting job:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors during job post:', messages);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employer's job status
router.patch('/:employerId/update-job', async (req, res) => {
  try {
    const { employerId } = req.params;
    const { jobId, status, applicantId, applicationId } = req.body;

    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Update the job status in employer's posted jobs
    if (!employer.postedJobs) {
      employer.postedJobs = [];
    }

    const jobIndex = employer.postedJobs.findIndex(job => job.jobId.toString() === jobId);
    if (jobIndex > -1) {
      employer.postedJobs[jobIndex].status = status;
      employer.postedJobs[jobIndex].applicantId = applicantId;
      employer.postedJobs[jobIndex].applicationId = applicationId;
    }

    await employer.save();
    res.json(employer);
  } catch (error) {
    console.error('Error updating employer job:', error);
    res.status(500).json({ message: error.message });
  }
});

// Logout employer
router.post('/:id/logout', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    employer.isLoggedIn = 0;
    await employer.save();

    console.log('Employer logged out:', employer._id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add job to employer's postedJobs array - separate endpoint for better error handling
router.post('/:employerId/addJob/:jobId', async (req, res) => {
  try {
    const { employerId, jobId } = req.params;
    
    console.log(`Adding job ${jobId} to employer ${employerId}`);
    
    // Validate that both IDs are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(employerId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer or job ID format'
      });
    }
    
    // Check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if the employer exists
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    // Check if the job is already in the employer's postedJobs array
    if (employer.postedJobs.includes(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Job already linked to this employer'
      });
    }
    
    // Add the job ID to the employer's postedJobs array
    employer.postedJobs.push(jobId);
    await employer.save();
    
    console.log(`✅ Successfully added job ${jobId} to employer ${employerId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Job added to employer successfully'
    });
  } catch (error) {
    console.error('❌ Error adding job to employer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add job to employer',
      error: error.message
    });
  }
});

// Add authorization middleware to check user type
const checkEmployerAccess = (req, res, next) => {
  // Get user type from request headers or query params
  const userType = req.headers['user-type'] || req.query.userType;
  const userId = req.headers['user-id'] || req.query.userId;
  const targetEmployerId = req.params.id;
  
  console.log('=== Employer Route Authorization Check ===');
  console.log(`User Type: ${userType}`);
  console.log(`User ID: ${userId}`);
  console.log(`Target Employer ID: ${targetEmployerId}`);
  
  // If user is not an employer, block access unless they are accessing public data
  if (userType !== 'employer' && req.method !== 'GET') {
    console.log('❌ Access Denied: Non-employer trying to modify employer data');
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized: Only employers can access this endpoint' 
    });
  }
  
  // If user is an employer but accessing another employer's data, block access
  if (userType === 'employer' && userId !== targetEmployerId && req.method !== 'GET') {
    console.log('❌ Access Denied: Employer trying to access another employer\'s data');
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized: You can only access your own profile' 
    });
  }
  
  console.log('✅ Access Granted');
  next();
};

// Apply middleware to routes that need protection
router.get('/:id', async (req, res) => {
  try {
    console.log(`=== Fetching Employer Profile ===`);
    console.log(`Employer ID: ${req.params.id}`);
    console.log(`User Type: ${req.headers['user-type'] || req.query.userType || 'Not specified'}`);
    
    // If user is not an employer, only return public data
    const isEmployerUser = (req.headers['user-type'] || req.query.userType) === 'employer';
    
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      console.log('❌ Employer not found');
      return res.status(404).json({ 
        success: false,
        message: 'Employer not found' 
      });
    }
    
    // Find all jobs posted by this employer
    const jobs = await Job.find({ employer: req.params.id });
    console.log(`Found ${jobs.length} jobs matching the criteria`);
    
    if (jobs.length > 0) {
      console.log('First job sample:', {
        id: jobs[0]._id,
        title: jobs[0].title,
        status: jobs[0].status,
        location: jobs[0].location,
        employer: jobs[0].employer
      });
    }
    
    console.log('✅ Employer data found:', {
      id: employer._id,
      name: employer.name,
      jobsCount: jobs.length
    });
    
    // If not an employer user, return limited data
    if (!isEmployerUser) {
      const publicData = {
        _id: employer._id,
        name: employer.name,
        company: {
          name: employer.company?.name,
          industry: employer.company?.industry
        },
        location: employer.location,
        rating: employer.rating,
        jobsCount: jobs.length
      };
      
      console.log('Returning public employer data (limited)');
      return res.json(publicData);
    }
    
    // For employer users, return full data
    const enrichedEmployer = {
      ...employer.toObject(),
      postedJobs: jobs.map(job => job._id)
    };
    
    res.json(enrichedEmployer);
  } catch (error) {
    console.error('❌ Error fetching employer:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Apply middleware to update/delete routes
router.put('/:id', checkEmployerAccess, async (req, res) => {
  console.log('Received update employer request for ID:', req.params.id, ', data:', req.body);
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      console.log('Employer not found for update with ID:', req.params.id);
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Handle potential nested updates like location.address if frontend sends structured location
    if (req.body.location && typeof req.body.location === 'object' && req.body.location.address !== undefined) {
       // Assuming frontend sends { location: { address: '...' } } or similar
       employer.location.address = req.body.location.address;
       // If frontend sends nested village, district, etc., you might need to re-format here too
       // For now, assuming frontend sends formatted address for PUT
    } else if (req.body.location && typeof req.body.location === 'string') {
       employer.location.address = req.body.location;
    }

    // Update company name if sent
    if (req.body.company && req.body.company.name !== undefined) {
        employer.company.name = req.body.company.name;
    }
     // Update other top-level fields and potentially other nested fields
     Object.keys(req.body).forEach(key => {
        if (key !== 'location' && key !== 'company') {
             employer[key] = req.body[key];
        }
     });


    await employer.save();
    console.log('Employer updated successfully:', employer._id);
    res.json(employer);
  } catch (error) {
    console.error('Error updating employer profile:', error);
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors during update:', messages);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
});

// Get all jobs posted by an employer
router.get('/:id/jobs', async (req, res) => {
  console.log('Received request to get jobs for employer ID:', req.params.id);
  try {
    const jobs = await Job.find({ employer: req.params.id })
      .populate('selectedWorker', 'name phone shaktiScore')
      .populate('applications.worker', 'name phone shaktiScore');
    console.log(`Found ${jobs.length} jobs for employer ${req.params.id}`);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs for employer:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add a review for a worker
router.post('/:id/reviews', async (req, res) => {
  console.log('Received review request for employer ID:', req.params.id, ', review data:', req.body);
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      console.log('Employer not found for review with ID:', req.params.id);
      return res.status(404).json({ message: 'Employer not found' });
    }

    employer.reviews.push(req.body);
    await employer.save();
    console.log('Review added for employer:', employer._id);
    res.status(201).json(employer);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(400).json({ message: error.message });
  }
});

// Upload verification documents
router.post('/:id/documents', async (req, res) => {
   console.log('Received document upload request for employer ID:', req.params.id, ', document data:', req.body);
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
       console.log('Employer not found for document upload with ID:', req.params.id);
      return res.status(404).json({ message: 'Employer not found' });
    }

    const { type, url } = req.body;
    employer.documents.push({ type, url });
    await employer.save();
    console.log('Document added for employer:', employer._id);
    res.json(employer);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get employer statistics
router.get('/:id/stats', async (req, res) => {
   console.log('Received stats request for employer ID:', req.params.id);
  try {
    const jobs = await Job.find({ employer: req.params.id });
    
    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.status === 'open' || job.status === 'in-progress').length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      totalApplications: jobs.reduce((sum, job) => sum + job.applications.length, 0),
      averageApplicationsPerJob: jobs.length ? 
        jobs.reduce((sum, job) => sum + job.applications.length, 0) / jobs.length : 0
    };
    console.log('Generated stats for employer ID:', req.params.id, ':', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching employer stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Example: Get logged-in employer profile (requires auth middleware)
router.get('/profile', auth, async (req, res) => {
  try {
    const employer = await Employer.findById(req.user?.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    res.json(employer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post a new job
router.post('/jobs', auth, async (req, res) => {
  console.log('Received request to post job from employer:', req.user._id, ', job data:', req.body);
  try {
    const employerId = req.user._id;
    const jobData = { ...req.body, employer: employerId };
    
    // Create and save the new job
    const newJob = new Job(jobData);
    await newJob.save();
    
    // Update employer's postedJobs array
    await Employer.findByIdAndUpdate(
      employerId,
      { $push: { postedJobs: newJob._id } }
    );
    
    console.log('Job saved successfully:', newJob._id);
    res.status(201).json({ 
      message: 'Job posted successfully', 
      job: newJob 
    });
  } catch (error) {
    console.error('Error posting job:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors during job post:', messages);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employer's job status
router.patch('/:employerId/update-job', async (req, res) => {
  try {
    const { employerId } = req.params;
    const { jobId, status, applicantId, applicationId } = req.body;

    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Update the job status in employer's posted jobs
    if (!employer.postedJobs) {
      employer.postedJobs = [];
    }

    const jobIndex = employer.postedJobs.findIndex(job => job.jobId.toString() === jobId);
    if (jobIndex > -1) {
      employer.postedJobs[jobIndex].status = status;
      employer.postedJobs[jobIndex].applicantId = applicantId;
      employer.postedJobs[jobIndex].applicationId = applicationId;
    }

    await employer.save();
    res.json(employer);
  } catch (error) {
    console.error('Error updating employer job:', error);
    res.status(500).json({ message: error.message });
  }
});

// Logout employer
router.post('/:id/logout', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    employer.isLoggedIn = 0;
    await employer.save();

    console.log('Employer logged out:', employer._id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add job to employer's postedJobs array - separate endpoint for better error handling
router.post('/:employerId/addJob/:jobId', async (req, res) => {
  try {
    const { employerId, jobId } = req.params;
    
    console.log(`Adding job ${jobId} to employer ${employerId}`);
    
    // Validate that both IDs are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(employerId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer or job ID format'
      });
    }
    
    // Check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if the employer exists
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    // Check if the job is already in the employer's postedJobs array
    if (employer.postedJobs.includes(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Job already linked to this employer'
      });
    }
    
    // Add the job ID to the employer's postedJobs array
    employer.postedJobs.push(jobId);
    await employer.save();
    
    console.log(`✅ Successfully added job ${jobId} to employer ${employerId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Job added to employer successfully'
    });
  } catch (error) {
    console.error('❌ Error adding job to employer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add job to employer',
      error: error.message
    });
  }
});

module.exports = router;