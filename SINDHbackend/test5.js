const axios = require('axios');
const API_URL = 'http://localhost:5000';

// Generate unique phone numbers for testing
const getUniquePhone = () => Math.floor(Math.random() * 9000000000) + 1000000000;

async function testDifferentScenarios() {
  try {
    console.log('\n=== Test 5: Different Scenarios for Notification System ===\n');

    // Step 1: Register workers with different profiles
    console.log('Registering workers with different profiles:');
    const workers = [];
    const workerData = [
      {
        name: 'Senior Electrician',
        skills: ['electrical', 'wiring', 'solar installation', 'maintenance'],
        experience: 10,
        languages: ['Hindi', 'English', 'Marathi'],
        age: 45
      },
      {
        name: 'Junior Carpenter',
        skills: ['woodworking', 'furniture making'],
        experience: 2,
        languages: ['Hindi'],
        age: 25
      },
      {
        name: 'Experienced Mason',
        skills: ['bricklaying', 'concrete work', 'tile setting', 'plastering'],
        experience: 7,
        languages: ['Hindi', 'Punjabi'],
        age: 35
      },
      {
        name: 'Apprentice Painter',
        skills: ['painting'],
        experience: 1,
        languages: ['Hindi', 'Bengali'],
        age: 22
      }
    ];

    for (const data of workerData) {
      const worker = {
        ...data,
        phone: getUniquePhone().toString(),
        location: {
          address: 'Mumbai, Maharashtra',
          coordinates: {
            type: 'Point',
            coordinates: [72.8777, 19.0760]  // Mumbai coordinates
          }
        }
      };

      const workerResponse = await axios.post(`${API_URL}/api/workers/register`, worker);
      workers.push(workerResponse.data);
      console.log(`✅ Registered ${data.name} with ShaktiScore:`, workerResponse.data.shaktiScore);

      // Test welcome notification
      try {
        await axios.post(`${API_URL}/api/notifications/sms`, {
          to: workerResponse.data.phone,
          message: `Welcome to Sindh! Your profile has been registered successfully. Your ShaktiScore is ${workerResponse.data.shaktiScore}.`
        });
        console.log(`✅ Welcome notification sent to ${data.name}`);
      } catch (error) {
        console.log(`❌ Failed to send welcome notification:`, error.response?.data?.message || error.message);
      }
    }

    // Step 2: Register multiple employers
    console.log('\nRegistering employers:');
    const employers = [];
    const employerData = [
      {
        name: 'Green Energy Solutions',
        company: {
          name: 'Green Energy Solutions Pvt Ltd',
          description: 'Solar and renewable energy installations',
          registrationNumber: 'GES2024'
        }
      },
      {
        name: 'Modern Interiors',
        company: {
          name: 'Modern Interiors & Furniture',
          description: 'Custom furniture and interior work',
          registrationNumber: 'MIF2024'
        }
      }
    ];

    for (const data of employerData) {
      const employer = {
        ...data,
        phone: getUniquePhone().toString(),
        email: `${data.name.toLowerCase().replace(/\s+/g, '.')}${getUniquePhone()}@test.com`,
        location: {
          address: 'Mumbai, Maharashtra',
          coordinates: {
            type: 'Point',
            coordinates: [72.8777, 19.0760]
          }
        }
      };

      const response = await axios.post(`${API_URL}/api/employers/register`, employer);
      employers.push(response.data);
      console.log(`✅ Registered employer: ${data.name}`);
    }

    // Step 3: Create different types of jobs
    console.log('\nCreating different types of jobs:');
    const jobsData = [
      {
        title: 'Solar Panel Installation Project',
        description: 'Installation of solar panels for a commercial building',
        employer: employers[0]._id,
        requiredSkills: ['electrical', 'solar installation'],
        wage: { amount: 2000, period: 'daily' },
        duration: '15 days',
        requiredExperience: 5,
        preferredLanguages: ['Hindi', 'English']
      },
      {
        title: 'Custom Furniture Workshop',
        description: 'Creating custom furniture for a luxury hotel',
        employer: employers[1]._id,
        requiredSkills: ['woodworking', 'furniture making'],
        wage: { amount: 1500, period: 'daily' },
        duration: '30 days',
        requiredExperience: 3,
        preferredLanguages: ['Hindi']
      }
    ];

    const jobs = [];
    for (const data of jobsData) {
      const jobData = {
        ...data,
        location: employers[0].location,
        startDate: new Date(Date.now() + 86400000) // Tomorrow
      };

      const job = (await axios.post(`${API_URL}/api/jobs`, jobData)).data;
      jobs.push(job);
      console.log(`✅ Created job: ${job.title}`);
    }

    // Step 4: Test job applications and notifications
    console.log('\nTesting job applications and notifications:');
    
    // Senior Electrician applies for solar panel job
    await axios.post(`${API_URL}/api/jobs/${jobs[0]._id}/apply`, {
      workerId: workers[0]._id
    });
    console.log('✅ Senior Electrician applied for Solar Panel Installation');

    // Junior Carpenter applies for both jobs
    for (const job of jobs) {
      await axios.post(`${API_URL}/api/jobs/${job._id}/apply`, {
        workerId: workers[1]._id
      });
    }
    console.log('✅ Junior Carpenter applied for both jobs');

    // Step 5: Process applications with different statuses
    console.log('\nProcessing applications with different statuses:');
    
    // Get updated job details
    for (const job of jobs) {
      const jobDetails = (await axios.get(`${API_URL}/api/jobs/${job._id}`)).data;
      
      for (const application of jobDetails.applications) {
        try {
          const workerId = application.worker._id || application.worker;
          const workerResponse = await axios.get(`${API_URL}/api/workers/${workerId}`);
          const worker = workerResponse.data;
          
          // Different acceptance criteria for different jobs
          let status;
          if (job.title.includes('Solar Panel')) {
            status = worker.experience >= 5 ? 'accepted' : 'rejected';
          } else {
            status = worker.skills.includes('woodworking') ? 'accepted' : 'rejected';
          }
          
          // Update application status
          await axios.patch(`${API_URL}/api/jobs/${job._id}/applications/${application._id}`, {
            status: status
          });
          
          // Send status notification
          await axios.post(`${API_URL}/api/notifications/worker/status-update`, {
            workerId: worker._id,
            jobId: job._id,
            status: status
          });
          
          console.log(`✅ ${worker.name} - ${job.title} - Status: ${status}`);
          
          // Send reminder for accepted applications
          if (status === 'accepted') {
            await axios.post(`${API_URL}/api/notifications/worker/job-reminder`, {
              workerId: worker._id,
              jobId: job._id
            });
            console.log(`✅ Job reminder sent to ${worker.name} for ${job.title}`);
          }
        } catch (error) {
          console.log('❌ Error processing application:', error.response?.data?.message || error.message);
        }
      }
    }

    // Step 6: Test missed call notifications
    console.log('\nTesting missed call notifications for all workers:');
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

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

// Run the test
testDifferentScenarios(); 