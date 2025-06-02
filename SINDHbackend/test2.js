const axios = require('axios');
const API_URL = 'http://localhost:5000';

// Generate unique phone numbers for testing
const getUniquePhone = () => Math.floor(Math.random() * 9000000000) + 1000000000;

async function testHighSkilledMatching() {
  try {
    console.log('\n=== Test 2: High-Skilled Worker and Complex Job Requirements ===\n');

    // Test Worker Registration - Highly skilled industrial worker
    const workerData = {
      name: 'Rajesh Mehta',
      age: 42,
      phone: getUniquePhone().toString(),
      skills: [
        'industrial welding',
        'CNC operation',
        'metal fabrication',
        'blueprint reading',
        'quality control',
        'team leadership',
        'safety management',
        'preventive maintenance'
      ],
      experience: 15,
      languages: ['Hindi', 'English', 'Gujarati', 'Marathi'],
      location: {
        address: 'GIDC Vatva, Ahmedabad',
        coordinates: {
          type: 'Point',
          coordinates: [72.6343, 22.9675] // Ahmedabad industrial area
        }
      }
    };

    console.log('Registering highly skilled worker:', {
      name: workerData.name,
      skills: workerData.skills.length,
      experience: workerData.experience,
      languages: workerData.languages.length
    });

    const workerResponse = await axios.post(`${API_URL}/api/workers/register`, workerData);
    console.log('\nWorker registered successfully:', {
      id: workerResponse.data._id,
      name: workerResponse.data.name,
      shaktiScore: workerResponse.data.shaktiScore
    });

    // Test Employer Registration - Industrial Manufacturing Company
    const employerData = {
      name: 'Precision Engineering Industries',
      phone: getUniquePhone().toString(),
      email: `test${getUniquePhone()}@test.com`,
      company: {
        name: 'Precision Engineering Pvt Ltd',
        description: 'High-precision manufacturing and industrial solutions',
        registrationNumber: 'PE101'
      },
      location: {
        address: 'GIDC Vatva Phase IV, Ahmedabad',
        coordinates: {
          type: 'Point',
          coordinates: [72.6343, 22.9675]
        }
      }
    };

    const employerResponse = await axios.post(`${API_URL}/api/employers/register`, employerData);
    console.log('\nIndustrial employer registered:', {
      id: employerResponse.data._id,
      name: employerResponse.data.name
    });

    // Test Complex Job Creation
    const jobData = {
      title: 'Senior Industrial Welder & Team Lead',
      description: 'Need experienced welder for high-precision manufacturing with team leadership responsibilities',
      employer: employerResponse.data._id,
      requiredSkills: ['industrial welding', 'quality control', 'team leadership'],
      location: employerData.location,
      wage: { amount: 2500, period: 'daily' },
      duration: '6 months',
      requiredExperience: 10,
      preferredLanguages: ['English', 'Gujarati'],
      startDate: new Date(Date.now() + 86400000) // Tomorrow
    };

    const jobResponse = await axios.post(`${API_URL}/api/jobs`, jobData);
    console.log('\nComplex job created:', {
      id: jobResponse.data._id,
      title: jobResponse.data.title,
      requiredSkills: jobResponse.data.requiredSkills
    });

    // Test Job Matching for High-Skilled Position
    const matchingJobsResponse = await axios.get(`${API_URL}/api/workers/${workerResponse.data._id}/jobs`);
    console.log('\nMatching jobs found:', matchingJobsResponse.data.length);
    
    if (matchingJobsResponse.data.length > 0) {
      console.log('Match details:', matchingJobsResponse.data.map(match => ({
        jobTitle: match.job.title,
        score: match.score,
        analysis: analyzeMatch(match.score, workerData, match.job)
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

// Helper function to analyze match quality
function analyzeMatch(score, worker, job) {
  const analysis = [];
  
  if (score >= 0.9) {
    analysis.push('Perfect match for high-skilled position');
  }
  
  const skillMatch = job.requiredSkills.every(skill => worker.skills.includes(skill));
  if (skillMatch) {
    analysis.push('All required skills present');
  }
  
  if (worker.experience >= job.requiredExperience) {
    analysis.push('Exceeds experience requirements');
  }
  
  const languageMatch = job.preferredLanguages.every(lang => worker.languages.includes(lang));
  if (languageMatch) {
    analysis.push('Preferred languages matched');
  }
  
  return analysis.join(', ');
}

// Run the test
testHighSkilledMatching(); 