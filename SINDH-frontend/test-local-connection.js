// Test script to verify frontend-backend local connection
console.log('🧪 Testing local backend connection...');

async function testLocalConnection() {
  try {
    // Test 1: Check if backend is running
    console.log('📡 Testing backend connection...');
    const response = await fetch('https://sindh-backend.onrender.com/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running!');
      console.log('📊 Health check response:', data);
    } else {
      console.log('❌ Backend is not responding');
      console.log('Status:', response.status);
      return;
    }
    
    // Test 2: Check jobs endpoint
    console.log('\n📋 Testing jobs endpoint...');
    const jobsResponse = await fetch('https://sindh-backend.onrender.com/api/jobs');
    
    if (jobsResponse.ok) {
      const jobs = await jobsResponse.json();
      console.log('✅ Jobs endpoint working!');
      console.log('📊 Jobs found:', jobs.length);
      if (jobs.length > 0) {
        console.log('📋 Sample job:', {
          id: jobs[0]._id,
          title: jobs[0].title,
          status: jobs[0].status
        });
      }
    } else {
      console.log('❌ Jobs endpoint failed');
      console.log('Status:', jobsResponse.status);
    }
    
    // Test 3: Check job applications endpoint
    console.log('\n📝 Testing job applications endpoint...');
    const applicationsResponse = await fetch('https://sindh-backend.onrender.com/api/job-applications');
    
    if (applicationsResponse.ok) {
      console.log('✅ Job applications endpoint working!');
    } else {
      console.log('❌ Job applications endpoint failed');
      console.log('Status:', applicationsResponse.status);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Make sure:');
    console.log('1. Backend is running on https://sindh-backend.onrender.com');
    console.log('2. MongoDB is connected');
    console.log('3. No firewall blocking the connection');
  }
}

// Run the test
testLocalConnection();

// Export for manual testing
window.testLocalConnection = testLocalConnection; 