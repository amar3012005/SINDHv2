const express = require('express');
const router = express.Router();
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// Register a new employer
router.post('/register', async (req, res) => {
  console.log('Received employer registration request:', req.body);
  try {
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
    res.status(201).json({
      message: 'Employer registered successfully',
      employer: {
        _id: employer._id,
        name: employer.name,
        phone: employer.phone,
        company: { name: employer.company.name }
      },
      // token
    });
    console.log('Employer registration response sent', res.statusCode);

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

// Get employer profile by ID
router.get('/:id', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id)
      .populate('documents')
      .populate('reviews')
      .lean(); // Use lean() for better performance since we don't need Mongoose documents

    if (!employer) {
      console.log('Employer not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Format the response to ensure all fields are present
    const formattedEmployer = {
      ...employer,
      company: {
        name: employer.company?.name || '',
        type: employer.company?.type || '',
        industry: employer.company?.industry || '',
        description: employer.company?.description || '',
        registrationNumber: employer.company?.registrationNumber || ''
      },
      location: {
        village: employer.location?.village || '',
        district: employer.location?.district || '',
        state: employer.location?.state || '',
        pincode: employer.location?.pincode || '',
        address: employer.location?.address || ''
      },
      verificationDocuments: {
        aadharNumber: employer.verificationDocuments?.aadharNumber || '',
        panNumber: employer.verificationDocuments?.panNumber || '',
        businessLicense: employer.verificationDocuments?.businessLicense || ''
      },
      documents: employer.documents || [],
      preferredLanguages: employer.preferredLanguages || [],
      rating: employer.rating || { average: 0, count: 0 },
      reviews: employer.reviews || [],
      verificationStatus: employer.verificationStatus || 'pending',
      isLoggedIn: employer.isLoggedIn || 0,
      registrationDate: employer.registrationDate || new Date().toISOString(),
      lastLogin: employer.lastLogin || new Date().toISOString()
    };

    console.log('Fetched employer by ID:', employer._id);
    res.json(formattedEmployer);
  } catch (error) {
    console.error('Error fetching employer by ID:', error);
    res.status(500).json({ message: error.message });
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
  console.log('Received request for logged-in employer profile');
  try {
    // Assuming auth middleware adds employer to req.user or similar
    const employer = await Employer.findById(req.user._id);
    if (!employer) {
      console.log('Logged-in employer not found with ID:', req.user._id);
      return res.status(404).json({ message: 'Employer not found' });
    }
     console.log('Fetched logged-in employer profile for ID:', employer._id);
    res.json(employer);
  } catch (error) {
    console.error('Error fetching logged-in employer profile:', error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = router; 