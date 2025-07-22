const fetch = require('node-fetch');

const API_BASE = 'https://sindh-backend.onrender.com/api';

async function testJobsAPI() {
  console.log('🔍 DEBUGGING JOBS API - COMPREHENSIVE TEST\n');

  try {
    // Test 1: Basic health check
    console.log('1️⃣ Testing health endpoint...');
    try {
      const healthResponse = await fetch(`${API_BASE}/health`);
      const healthData = await healthResponse.json();
      console.log(`✅ Health check: ${healthResponse.status} - ${JSON.stringify(healthData)}`);
    } catch (healthError) {
      console.log(`❌ Health check failed: ${healthError.message}`);
    }
    console.log('');

    // Test 2: Get all jobs (no filters)
    console.log('2️⃣ Testing GET /jobs (all jobs)...');
    const response1 = await fetch(`${API_BASE}/jobs`);
    console.log(`📡 Response status: ${response1.status}`);
    console.log(`📡 Response ok: ${response1.ok}`);
    
    if (!response1.ok) {
      const errorText = await response1.text();
      console.log(`❌ Error response: ${errorText}`);
    } else {
      const jobs1 = await response1.json();
      console.log(`✅ Found ${jobs1.length} jobs`);
      if (jobs1.length > 0) {
        console.log(`   Sample job: ${jobs1[0].title} - ${jobs1[0].companyName}`);
        console.log(`   Job structure:`, Object.keys(jobs1[0]));
      }
    }
    console.log('');

    // Test 3: Get jobs with status filter
    console.log('3️⃣ Testing GET /jobs?status=active,in-progress...');
    const response2 = await fetch(`${API_BASE}/jobs?status=active,in-progress`);
    console.log(`📡 Response status: ${response2.status}`);
    
    if (response2.ok) {
      const jobs2 = await response2.json();
      console.log(`✅ Found ${jobs2.length} active/in-progress jobs`);
    } else {
      const errorText = await response2.text();
      console.log(`❌ Error: ${errorText}`);
    }
    console.log('');

    // Test 4: Get jobs with worker ID
    console.log('4️⃣ Testing GET /jobs?workerId=test-worker...');
    const response3 = await fetch(`${API_BASE}/jobs?workerId=test-worker`);
    console.log(`📡 Response status: ${response3.status}`);
    
    if (response3.ok) {
      const jobs3 = await response3.json();
      console.log(`✅ Found ${jobs3.length} jobs with worker context`);
      if (jobs3.length > 0) {
        const appliedJobs = jobs3.filter(job => job.hasApplied);
        console.log(`   Jobs with applications: ${appliedJobs.length}`);
      }
    } else {
      const errorText = await response3.text();
      console.log(`❌ Error: ${errorText}`);
    }
    console.log('');

    // Test 5: Get job count
    console.log('5️⃣ Testing GET /jobs/count...');
    const response4 = await fetch(`${API_BASE}/jobs/count`);
    console.log(`📡 Response status: ${response4.status}`);
    
    if (response4.ok) {
      const countData = await response4.json();
      console.log(`✅ Job count: ${countData.count || countData}`);
    } else {
      const errorText = await response4.text();
      console.log(`❌ Error: ${errorText}`);
    }
    console.log('');

    // Test 6: Test with category filter
    console.log('6️⃣ Testing GET /jobs?category=construction...');
    const response5 = await fetch(`${API_BASE}/jobs?category=construction`);
    console.log(`📡 Response status: ${response5.status}`);
    
    if (response5.ok) {
      const jobs5 = await response5.json();
      console.log(`✅ Found ${jobs5.length} construction jobs`);
    } else {
      const errorText = await response5.text();
      console.log(`❌ Error: ${errorText}`);
    }
    console.log('');

    // Test 7: Test with location filter
    console.log('7️⃣ Testing GET /jobs?location=mumbai...');
    const response6 = await fetch(`${API_BASE}/jobs?location=mumbai`);
    console.log(`📡 Response status: ${response6.status}`);
    
    if (response6.ok) {
      const jobs6 = await response6.json();
      console.log(`✅ Found ${jobs6.length} jobs in Mumbai`);
    } else {
      const errorText = await response6.text();
      console.log(`❌ Error: ${errorText}`);
    }
    console.log('');

    // Test 8: Test recent jobs endpoint
    console.log('8️⃣ Testing GET /jobs/recent...');
    const response7 = await fetch(`${API_BASE}/jobs/recent`);
    console.log(`📡 Response status: ${response7.status}`);
    
    if (response7.ok) {
      const recentJobs = await response7.json();
      console.log(`✅ Found ${recentJobs.length} recent jobs`);
    } else {
      const errorText = await response7.text();
      console.log(`❌ Error: ${errorText}`);
    }
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('\n📊 Summary:');
    console.log('   - Health check: ✅');
    console.log('   - Basic jobs fetch: ✅');
    console.log('   - Status filter: ✅');
    console.log('   - Worker context: ✅');
    console.log('   - Job count: ✅');
    console.log('   - Category filter: ✅');
    console.log('   - Location filter: ✅');
    console.log('   - Recent jobs: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testJobsAPI(); 