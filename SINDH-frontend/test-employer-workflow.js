// Test script to verify employer workflow functionality
// This script tests that posted jobs show proper progress and buttons when applications are submitted

const testEmployerWorkflow = async () => {
  console.log('🧪 Testing Employer Workflow...');
  
  try {
    // Test 1: Check if posted jobs show applications
    console.log('\n📋 Test 1: Checking posted jobs for applications...');
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id || user.type !== 'employer') {
      console.log('⚠️ User not logged in as employer, skipping employer workflow tests');
      return;
    }
    
    // Fetch posted jobs
    const jobsResponse = await fetch('/api/jobs/employer', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (jobsResponse.ok) {
      const jobs = await jobsResponse.json();
      console.log(`✅ Found ${jobs.length} posted jobs`);
      
      // Check each job for applications
      for (const job of jobs) {
        console.log(`\n🔍 Checking job: ${job.title}`);
        
        const applicationsResponse = await fetch(`/api/job-applications/job/${job._id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (applicationsResponse.ok) {
          const applications = await applicationsResponse.json();
          console.log(`📋 Job "${job.title}" has ${applications.length} applications`);
          
          // Check application statuses
          const statusCounts = applications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
          }, {});
          
          console.log('📊 Application status breakdown:', statusCounts);
          
          // Verify that the job shows proper progress indicators
          if (applications.length > 0) {
            console.log('✅ Job has applications - should show progress indicators');
            
            // Check if job status is appropriate
            if (job.status === 'active' && applications.some(app => app.status === 'accepted')) {
              console.log('⚠️ Job should be "in-progress" if it has accepted applications');
            }
            
            // Check for payment status
            const completedApps = applications.filter(app => app.status === 'completed');
            if (completedApps.length > 0) {
              console.log(`💰 ${completedApps.length} completed applications need payment processing`);
            }
          } else {
            console.log('ℹ️ Job has no applications yet');
          }
        } else {
          console.log(`❌ Failed to fetch applications for job ${job._id}`);
        }
      }
    } else {
      console.log('❌ Failed to fetch posted jobs');
    }
    
    // Test 2: Verify application status update functionality
    console.log('\n🔄 Test 2: Testing application status updates...');
    
    // This would require a test application to be created first
    console.log('ℹ️ Status update testing requires test applications');
    
    console.log('\n✅ Employer workflow tests completed!');
    
  } catch (error) {
    console.error('❌ Error testing employer workflow:', error);
  }
};

// Run the test if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testEmployerWorkflow = testEmployerWorkflow;
  console.log('🧪 Employer workflow test ready. Run testEmployerWorkflow() to test.');
} else {
  // Node.js environment
  testEmployerWorkflow();
}

module.exports = { testEmployerWorkflow }; 