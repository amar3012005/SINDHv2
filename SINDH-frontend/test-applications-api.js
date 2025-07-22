// Test script to verify frontend-backend connection for applications
const API_URL = 'https://sindh-backend.onrender.com/api';

async function testApplicationsAPI() {
  try {
    console.log('🧪 Testing applications API...');
    
    // Test 1: Check if backend is running
    console.log('📡 Testing backend connection...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend is not responding');
      return;
    }
    
    // Test 2: Get a worker ID (you'll need to replace this with a real worker ID)
    const workerId = '507f1f77bcf86cd799439011'; // Replace with actual worker ID
    
    // Test 3: Test the applications endpoint
    console.log('📝 Testing applications endpoint...');
    const applicationsResponse = await fetch(`${API_URL}/jobs/worker/${workerId}/accepted-jobs`);
    
    console.log('Response status:', applicationsResponse.status);
    
    if (applicationsResponse.ok) {
      const applications = await applicationsResponse.json();
      console.log('✅ Applications endpoint working');
      console.log('📊 Applications found:', applications.length);
      console.log('📋 Sample application:', applications[0]);
    } else {
      const errorText = await applicationsResponse.text();
      console.log('❌ Applications endpoint error:', errorText);
    }
    
    // Test 4: Test job application creation
    console.log('📝 Testing job application creation...');
    const testJobId = '507f1f77bcf86cd799439012'; // Replace with actual job ID
    
    const applicationResponse = await fetch(`${API_URL}/job-applications/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: testJobId,
        workerId: workerId,
        workerDetails: {
          name: 'Test Worker',
          phone: '1234567890',
          skills: ['Test Skill'],
          experience: '1 year'
        }
      })
    });
    
    console.log('Application response status:', applicationResponse.status);
    
    if (applicationResponse.ok) {
      const result = await applicationResponse.json();
      console.log('✅ Application created successfully');
      console.log('📊 Application result:', result);
    } else {
      const errorText = await applicationResponse.text();
      console.log('❌ Application creation error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testApplicationsAPI(); 