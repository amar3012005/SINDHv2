const axios = require('axios');

const API_BASE = 'https://sindh-backend.onrender.com/api';

async function testApplyEndpoint() {
  try {
    console.log('🧪 Testing job application endpoint...');
    
    // First, get a list of jobs to find an active one
    console.log('📋 Fetching jobs...');
    const jobsResponse = await axios.get(`${API_BASE}/jobs`);
    const jobs = jobsResponse.data;
    
    const activeJob = jobs.find(job => job.status === 'active');
    if (!activeJob) {
      console.log('❌ No active jobs found');
      return;
    }
    
    console.log('✅ Found active job:', {
      id: activeJob._id,
      title: activeJob.title,
      status: activeJob.status
    });
    
    // Test the apply endpoint
    console.log('📝 Testing application submission...');
    const applicationData = {
      jobId: activeJob._id,
      workerId: '507f1f77bcf86cd799439011', // Replace with actual worker ID
      workerDetails: {
        name: 'Test Worker',
        phone: '1234567890',
        skills: ['Test Skill'],
        experience: '1 year'
      }
    };
    
    console.log('📤 Sending application data:', applicationData);
    
    const applyResponse = await axios.post(`${API_BASE}/job-applications/apply`, applicationData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Application submitted successfully!');
    console.log('📊 Response:', applyResponse.data);
    
    // Check if job status was updated
    console.log('🔄 Checking if job status was updated...');
    const updatedJobResponse = await axios.get(`${API_BASE}/jobs/${activeJob._id}`);
    const updatedJob = updatedJobResponse.data;
    
    console.log('📊 Job status after application:', {
      id: updatedJob._id,
      title: updatedJob.title,
      status: updatedJob.status
    });
    
    if (updatedJob.status === 'in-progress') {
      console.log('✅ Job status successfully updated to in-progress!');
    } else {
      console.log('❌ Job status not updated. Current status:', updatedJob.status);
    }
    
    // Check if application was created
    console.log('📝 Checking if application was created...');
    const applicationsResponse = await axios.get(`${API_BASE}/jobs/worker/507f1f77bcf86cd799439011/accepted-jobs`);
    const applications = applicationsResponse.data;
    
    console.log('📊 Applications found:', applications.length);
    if (applications.length > 0) {
      console.log('✅ Application created successfully!');
      console.log('📋 Latest application:', applications[0]);
    } else {
      console.log('❌ No applications found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testApplyEndpoint(); 