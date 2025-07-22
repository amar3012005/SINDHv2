const fetch = require('node-fetch');

const LOCALHOST_API = 'https://sindh-backend.onrender.com/api';

async function testLocalhostConnection() {
  console.log('🔧 TESTING LOCALHOST BACKEND CONNECTION\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${LOCALHOST_API}/health`);
    
    console.log(`📡 Health Status: ${healthResponse.status}`);
    console.log(`📡 Health OK: ${healthResponse.ok}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check successful:', healthData);
    } else {
      console.log('❌ Health check failed');
    }

    console.log('');

    // Test 2: Jobs endpoint
    console.log('2️⃣ Testing jobs endpoint...');
    const jobsResponse = await fetch(`${LOCALHOST_API}/jobs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 Jobs Status: ${jobsResponse.status}`);
    console.log(`📡 Jobs OK: ${jobsResponse.ok}`);
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log(`✅ Jobs endpoint successful, found ${jobsData.length} jobs`);
      
      if (jobsData.length > 0) {
        console.log('📋 Sample job:', {
          id: jobsData[0]._id,
          title: jobsData[0].title,
          company: jobsData[0].companyName,
          location: jobsData[0].location
        });
      }
    } else {
      const errorText = await jobsResponse.text();
      console.log('❌ Jobs endpoint failed:', errorText);
    }

    console.log('');

    // Test 3: Job count endpoint
    console.log('3️⃣ Testing job count endpoint...');
    const countResponse = await fetch(`${LOCALHOST_API}/jobs/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 Count Status: ${countResponse.status}`);
    console.log(`📡 Count OK: ${countResponse.ok}`);
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('✅ Job count successful:', countData);
    } else {
      const errorText = await countResponse.text();
      console.log('❌ Job count failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('💡 Make sure the backend is running on https://sindh-backend.onrender.com');
  }
}

testLocalhostConnection(); 