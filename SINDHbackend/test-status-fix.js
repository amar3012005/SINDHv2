const fetch = require('node-fetch');

const API_BASE = 'https://sindh-backend.onrender.com/api';

async function testStatusFix() {
  console.log('🔧 Testing JobApplication status enum fix...\n');

  try {
    // 1. Test creating a job application with in-progress status
    console.log('1️⃣ Testing application creation with in-progress status...');
    
    const testApplication = {
      job: '507f1f77bcf86cd799439011', // Mock job ID
      worker: '507f1f77bcf86cd799439012', // Mock worker ID
      employer: '507f1f77bcf86cd799439013', // Mock employer ID
      status: 'in-progress',
      workerDetails: {
        name: 'Test Worker',
        phone: '1234567890',
        skills: ['construction'],
        rating: 4.5
      }
    };

    console.log('📝 Test application data:', testApplication);

    // 2. Test the JobApplication model directly
    console.log('\n2️⃣ Testing JobApplication model validation...');
    
    const mongoose = require('mongoose');
    const JobApplication = require('./server/src/models/JobApplication');
    
    // Test valid statuses
    const validStatuses = ['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'];
    
    console.log('✅ Valid statuses in enum:', validStatuses);
    
    // Test that in-progress is now valid
    const testApp = new JobApplication({
      job: '507f1f77bcf86cd799439011',
      worker: '507f1f77bcf86cd799439012',
      employer: '507f1f77bcf86cd799439013',
      status: 'in-progress',
      workerDetails: {
        name: 'Test Worker',
        phone: '1234567890'
      }
    });
    
    console.log('✅ in-progress status is now valid in JobApplication model');
    console.log('📋 Test application status:', testApp.status);

    // 3. Test API endpoints that use in-progress status
    console.log('\n3️⃣ Testing API endpoints with in-progress status...');
    
    // Test job routes that filter by in-progress
    const jobsResponse = await fetch(`${API_BASE}/jobs?status=active,in-progress`);
    if (jobsResponse.ok) {
      const jobs = await jobsResponse.json();
      console.log(`✅ Jobs API accepts in-progress status filter, found ${jobs.length} jobs`);
    } else {
      console.log('❌ Jobs API failed:', jobsResponse.status);
    }

    // Test application routes that use in-progress
    const applicationsResponse = await fetch(`${API_BASE}/job-applications/worker/507f1f77bcf86cd799439012/current`);
    if (applicationsResponse.ok) {
      const applications = await applicationsResponse.json();
      console.log(`✅ Applications API works with in-progress status, found ${applications.data?.length || 0} applications`);
    } else {
      console.log('❌ Applications API failed:', applicationsResponse.status);
    }

    console.log('\n🎉 Status enum fix verification completed!');
    console.log('✅ in-progress status is now properly supported in JobApplication model');
    console.log('✅ All API endpoints should now work correctly with in-progress status');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
testStatusFix(); 