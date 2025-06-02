const axios = require('axios');
const API_URL = 'http://localhost:5000';

// Generate unique phone numbers for testing
const getUniquePhone = () => Math.floor(Math.random() * 9000000000) + 1000000000;

async function testJobApplicationWorkflow() {
  try {
    console.log('\n=== Test 4: Job Application and Hiring Workflow with Notifications ===\n');

    // Step 1: Register multiple workers
    console.log('Registering multiple workers:');
    const workers = [];
    const workerData = [
      {
        name: 'Worker 1',
        skills: ['plumbing', 'pipe fitting'],
        experience: 5,
        languages: ['Hindi', 'English']
      },
      {
        name: 'Worker 2',
        skills: ['plumbing'],
        experience: 3,
        languages: ['Hindi']
      },
      {
        name: 'Worker 3',
        skills: ['plumbing', 'welding', 'pipe fitting'],
        experience: 8,
        languages: ['Hindi', 'English', 'Punjabi']
      }
    ];

    for (const data of workerData) {
      const worker = {
        ...data,
        age: 30,
        phone: getUniquePhone().toString(),
        location: {
          address: 'Test Location',
          coordinates: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          }
        }
      };

      const workerResponse = await axios.post(`${API_URL}/api/workers/register`, worker);
      workers.push(workerResponse.data);
      console.log(`✅ Registered ${data.name} with ShaktiScore:`, workerResponse.data.shaktiScore);

      // Test SMS notification
      console.log(`Testing SMS notification for ${data.name}:`);
      try {
        const smsResponse = await axios.post(`${API_URL}/api/notifications/sms`, {
          to: workerResponse.data.phone,
          message: 'Welcome to Sindh! Your registration is complete.'
        });
        console.log('✅ Welcome SMS sent');
      } catch (error) {
        console.log('❌ SMS sending failed:', error.response?.data?.message || error.message);
      }
    }

    // Step 2: Register an employer
    console.log('\nRegistering employer:');
    const employerData = {
      name: 'Building Solutions',
      phone: getUniquePhone().toString(),
      email: `test${getUniquePhone()}@test.com`,
      company: {
        name: 'Building Solutions Ltd',
        description: 'Construction and maintenance company',
        registrationNumber: 'BS505'
      },
      location: {
        address: 'Test Location',
        coordinates: {
          type: 'Point',
          coordinates: [77.2090, 28.6139]
        }
      }
    };

    const employer = (await axios.post(`${API_URL}/api/employers/register`, employerData)).data;
    console.log('✅ Registered employer:', employer.name);

    // Step 3: Create a job
    console.log('\nCreating job:');
    const jobData = {
      title: 'Commercial Plumbing Project',
      description: 'Need experienced plumbers for commercial building project',
      employer: employer._id,
      requiredSkills: ['plumbing', 'pipe fitting'],
      location: employerData.location,
      wage: { amount: 1200, period: 'daily' },
      duration: '20 days',
      requiredExperience: 4,
      preferredLanguages: ['Hindi', 'English'],
      startDate: new Date(Date.now() + 86400000)
    };

    const job = (await axios.post(`${API_URL}/api/jobs`, jobData)).data;
    console.log('✅ Created job:', job.title);

    // Step 4: Notify workers about new job
    console.log('\nNotifying workers about new job:');
    for (const worker of workers) {
      try {
        await axios.post(`${API_URL}/api/notifications/worker/job-alert`, {
          workerId: worker._id,
          jobId: job._id
        });
        console.log(`✅ Job notification sent to ${worker.name}`);
      } catch (error) {
        console.log(`❌ Failed to notify ${worker.name}:`, error.response?.data?.message || error.message);
      }
    }

    // Step 5: Workers apply for the job
    console.log('\nTesting job applications:');
    for (const worker of workers) {
      try {
        await axios.post(`${API_URL}/api/jobs/${job._id}/apply`, {
          workerId: worker._id
        });
        console.log(`✅ ${worker.name} applied successfully`);

        // Notify employer about the application
        await axios.post(`${API_URL}/api/notifications/employer/application-alert`, {
          employerId: employer._id,
          workerId: worker._id,
          jobId: job._id
        });
        console.log(`✅ Employer notified about ${worker.name}'s application`);
      } catch (error) {
        console.log(`❌ ${worker.name} application failed:`, error.response?.data?.message || error.message);
      }
    }

    // Step 6: Get job applications
    console.log('\nChecking job applications:');
    const jobDetails = (await axios.get(`${API_URL}/api/jobs/${job._id}`)).data;
    console.log(`Total applications: ${jobDetails.applications.length}`);

    // Step 7: Update application statuses and notify workers
    console.log('\nProcessing applications and sending notifications:');
    for (const application of jobDetails.applications) {
      try {
        // Get worker details directly from the database
        const workerId = application.worker._id || application.worker;
        const workerResponse = await axios.get(`${API_URL}/api/workers/${workerId}`);
        const worker = workerResponse.data;
        
        if (!worker) {
          console.log(`❌ Worker not found for application: ${workerId}`);
          continue;
        }

        const status = worker.shaktiScore >= 35 ? 'accepted' : 'rejected';
        
        // Update application status
        await axios.patch(`${API_URL}/api/jobs/${job._id}/applications/${application._id}`, {
          status: status
        });
        
        // Send status notification to worker
        await axios.post(`${API_URL}/api/notifications/worker/status-update`, {
          workerId: worker._id,
          jobId: job._id,
          status: status
        });
        
        console.log(`✅ ${worker.name} - Status: ${status}, Notification sent`);
        
        // If accepted, send a reminder for tomorrow
        if (status === 'accepted') {
          await axios.post(`${API_URL}/api/notifications/worker/job-reminder`, {
            workerId: worker._id,
            jobId: job._id
          });
          console.log(`✅ Job reminder sent to ${worker.name}`);
        }
      } catch (error) {
        console.log('❌ Error processing application:', error.response?.data?.message || error.message);
      }
    }

    // Step 8: Test missed call functionality
    console.log('\nTesting missed call functionality:');
    for (const worker of workers) {
      try {
        await axios.post(`${API_URL}/api/notifications/missed-call`, {
          to: worker.phone
        });
        console.log(`✅ Missed call triggered for ${worker.name}`);
      } catch (error) {
        console.log(`❌ Missed call failed for ${worker.name}:`, error.response?.data?.message || error.message);
      }
    }

    // Step 9: Complete the job
    console.log('\nCompleting the job:');
    try {
      await axios.patch(`${API_URL}/api/jobs/${job._id}/complete`);
      console.log('✅ Job marked as completed');
    } catch (error) {
      console.log('❌ Failed to complete job:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('Test Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

// Run the test
testJobApplicationWorkflow(); 