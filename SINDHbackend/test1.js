const axios = require('axios');
const API_URL = 'http://localhost:5000';

// Generate unique phone numbers for testing
const getUniquePhone = () => Math.floor(Math.random() * 9000000000) + 1000000000;

async function testBasicWorkflow() {
  try {
    console.log('\n=== Test 1: Basic Worker Registration and Job Matching ===\n');

    // Test Worker Registration
    const workerData = {
      name: 'Amit Kumar',
      age: 28,
      phone: getUniquePhone().toString(),
      skills: ['carpentry', 'furniture making', 'wood polishing'],
      experience: 5,
      languages: ['Hindi', 'English'],
      location: {
        address: 'Sector 62, Noida',
        coordinates: {
          type: 'Point',
          coordinates: [77.3710, 28.6139] // Noida coordinates
        }
      }
    };

    console.log('Registering worker with data:', {
      name: workerData.name,
      skills: workerData.skills.length,
      experience: workerData.experience
    });

    const workerResponse = await axios.post(`${API_URL}/api/workers/register`, workerData);
    console.log('\nWorker registered successfully:', {
      id: workerResponse.data._id,
      name: workerResponse.data.name,
      shaktiScore: workerResponse.data.shaktiScore
    });

    // Test Employer Registration
    const employerData = {
      name: 'Modern Furniture Works',
      phone: getUniquePhone().toString(),
      email: `test${getUniquePhone()}@test.com`,
      company: {
        name: 'Modern Furniture Pvt Ltd',
        description: 'Custom furniture manufacturer',
        registrationNumber: 'MF789'
      },
      location: {
        address: 'Sector 63, Noida',
        coordinates: {
          type: 'Point',
          coordinates: [77.3760, 28.6270]
        }
      }
    };

    const employerResponse = await axios.post(`${API_URL}/api/employers/register`, employerData);
    console.log('\nEmployer registered successfully:', {
      id: employerResponse.data._id,
      name: employerResponse.data.name
    });

    // Test Job Creation
    const jobData = {
      title: 'Custom Furniture Maker',
      description: 'Need experienced carpenter for custom furniture making',
      employer: employerResponse.data._id,
      requiredSkills: ['carpentry', 'furniture making'],
      location: employerData.location,
      wage: { amount: 1000, period: 'daily' },
      duration: '15 days',
      requiredExperience: 3,
      preferredLanguages: ['Hindi', 'English'],
      startDate: new Date(Date.now() + 86400000) // Tomorrow
    };

    const jobResponse = await axios.post(`${API_URL}/api/jobs`, jobData);
    console.log('\nJob created successfully:', {
      id: jobResponse.data._id,
      title: jobResponse.data.title
    });

    // Test Job Matching
    const matchingJobsResponse = await axios.get(`${API_URL}/api/workers/${workerResponse.data._id}/jobs`);
    console.log('\nMatching jobs found:', matchingJobsResponse.data.length);
    
    if (matchingJobsResponse.data.length > 0) {
      console.log('Match scores:', matchingJobsResponse.data.map(match => ({
        jobTitle: match.job.title,
        score: match.score,
        matchReason: getMatchReason(match.score)
      })));
    }

  } catch (error) {
    console.error('Test Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

// Helper function to explain match scores
function getMatchReason(score) {
  if (score >= 0.9) return 'Excellent match - skills and location align perfectly';
  if (score >= 0.8) return 'Very good match - most requirements met';
  if (score >= 0.6) return 'Good match - core requirements met';
  return 'Basic match - some requirements met';
}

// Run the test
testBasicWorkflow(); 