const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Generate unique phone numbers for testing
const getUniquePhone = () => Math.floor(Math.random() * 9000000000) + 1000000000;

// Helper function to get job details
async function getJobDetails(jobId) {
  try {
    const response = await axios.get(`${API_URL}/api/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting job details:', error.response?.data || error.message);
    return null;
  }
}

// Test data variations
const testCases = [
  {
    description: "Young worker with multiple skills but less experience",
    worker: {
      name: 'John Worker',
      age: 25,
      skills: ['painting', 'plumbing', 'carpentry', 'tiling'],
      experience: 3,
      languages: ['Hindi', 'English', 'Punjabi'],
      location: {
        address: '123 Test Street',
        coordinates: [77.2090, 28.6139] // Delhi
      }
    },
    employer: {
      name: 'Test Company',
      company: {
        name: 'Test Company Ltd',
        description: 'A testing company',
        registrationNumber: 'TEST123'
      },
      location: {
        address: '456 Test Avenue',
        coordinates: [77.2090, 28.6139] // Delhi
      }
    },
    job: {
      title: 'House Painting',
      description: 'Need to paint 2BHK apartment',
      requiredSkills: ['painting'],
      wage: { amount: 800, period: 'daily' },
      duration: '5 days',
      requiredExperience: 2
    }
  },
  {
    description: "Peak age worker with focused skills and good experience",
    worker: {
      name: 'Raj Kumar',
      age: 35,
      skills: ['electrical', 'electronics repair'],
      experience: 12,
      languages: ['Hindi', 'Marathi', 'English'],
      location: {
        address: '789 Mumbai Road',
        coordinates: [72.8777, 19.0760] // Mumbai
      }
    },
    employer: {
      name: 'Mumbai Builders',
      company: {
        name: 'Mumbai Builders Pvt Ltd',
        description: 'Construction company',
        registrationNumber: 'MB456'
      },
      location: {
        address: '101 Marine Drive',
        coordinates: [72.8777, 19.0760] // Mumbai
      }
    },
    job: {
      title: 'Electrical Wiring',
      description: 'Complete electrical wiring for new 3BHK flat',
      requiredSkills: ['electrical'],
      wage: { amount: 1200, period: 'daily' },
      duration: '3 days',
      requiredExperience: 1
    }
  },
  {
    description: "Senior worker with extensive experience",
    worker: {
      name: 'Mohan Singh',
      age: 45,
      skills: ['masonry', 'concrete work', 'construction', 'tiling', 'plastering'],
      experience: 20,
      languages: ['Hindi', 'Punjabi', 'English', 'Urdu'],
      location: {
        address: '567 Chandigarh Road',
        coordinates: [76.7794, 30.7333] // Chandigarh
      }
    },
    employer: {
      name: 'Punjab Constructions',
      company: {
        name: 'Punjab Constructions Ltd',
        description: 'Building contractor',
        registrationNumber: 'PC789'
      },
      location: {
        address: '890 Sector 17',
        coordinates: [76.7794, 30.7333] // Chandigarh
      }
    },
    job: {
      title: 'Building Construction',
      description: 'Need experienced mason for commercial building construction',
      requiredSkills: ['masonry', 'concrete work'],
      wage: { amount: 1500, period: 'daily' },
      duration: '30 days',
      requiredExperience: 10
    }
  },
  {
    description: "Minimum qualified worker (edge case)",
    worker: {
      name: 'Amit Kumar',
      age: 18,
      skills: ['helper'],
      experience: 0,
      languages: ['Hindi'],
      location: {
        address: '123 Noida Sector 18',
        coordinates: [77.3910, 28.5355] // Noida
      }
    },
    employer: {
      name: 'Noida Builders',
      company: {
        name: 'Noida Builders Ltd',
        description: 'Construction company',
        registrationNumber: 'NB101'
      },
      location: {
        address: 'Sector 18, Noida',
        coordinates: [77.3910, 28.5355]
      }
    },
    job: {
      title: 'Construction Helper',
      description: 'Need helper for construction site',
      requiredSkills: ['helper'],
      wage: { amount: 500, period: 'daily' },
      duration: '15 days',
      requiredExperience: 0
    }
  },
  {
    description: "Maximum qualified worker (edge case)",
    worker: {
      name: 'Rajesh Mehta',
      age: 35,
      skills: ['welding', 'metal work', 'fabrication', 'industrial equipment', 'machinery', 'safety', 'quality control', 'team lead', 'training', 'maintenance'],
      experience: 20,
      languages: ['Hindi', 'English', 'Gujarati', 'Marathi', 'Telugu'],
      location: {
        address: '456 GIDC Ahmedabad',
        coordinates: [72.5714, 23.0225] // Ahmedabad
      }
    },
    employer: {
      name: 'Industrial Solutions',
      company: {
        name: 'Industrial Solutions Pvt Ltd',
        description: 'Industrial manufacturing',
        registrationNumber: 'IS202'
      },
      location: {
        address: 'GIDC Vatva, Ahmedabad',
        coordinates: [72.5714, 23.0225]
      }
    },
    job: {
      title: 'Senior Welder',
      description: 'Need experienced welder for industrial equipment',
      requiredSkills: ['welding', 'metal work'],
      wage: { amount: 2000, period: 'daily' },
      duration: '60 days',
      requiredExperience: 10
    }
  },
  {
    description: "Mid-career worker with specialized skills",
    worker: {
      name: 'Priya Sharma',
      age: 30,
      skills: ['HVAC', 'refrigeration', 'electrical', 'maintenance'],
      experience: 8,
      languages: ['Hindi', 'English', 'Tamil'],
      location: {
        address: '789 Anna Nagar, Chennai',
        coordinates: [80.2707, 13.0827] // Chennai
      }
    },
    employer: {
      name: 'Chennai Facilities',
      company: {
        name: 'Chennai Facilities Management Ltd',
        description: 'Facility management company',
        registrationNumber: 'CF303'
      },
      location: {
        address: 'T Nagar, Chennai',
        coordinates: [80.2707, 13.0827]
      }
    },
    job: {
      title: 'HVAC Technician',
      description: 'Need experienced HVAC technician for mall maintenance',
      requiredSkills: ['HVAC', 'electrical'],
      wage: { amount: 1800, period: 'daily' },
      duration: '45 days',
      requiredExperience: 5
    }
  }
];

async function runTest(testCase, index) {
  try {
      console.log(`\n=== Test Case ${index + 1}: ${testCase.description} ===\n`);
      
      // Test 1: Create a worker
      console.log('Testing worker registration:');
      const workerData = {
        ...testCase.worker,
        phone: getUniquePhone().toString(),
        location: {
          ...testCase.worker.location,
          coordinates: {
            type: 'Point',
            coordinates: testCase.worker.location.coordinates
          }
        }
      };
      
      console.log('Worker profile:', {
        name: workerData.name,
        age: workerData.age,
        skills: workerData.skills.length,
        experience: workerData.experience,
        languages: workerData.languages.length
      });
      
    try {
      const workerResponse = await axios.post(`${API_URL}/api/workers/register`, workerData);
      console.log('Worker registered successfully:', workerResponse.data);

      // Test 2: Create an employer
      console.log('\nTesting employer registration:');
      const employerData = {
        ...testCase.employer,
        phone: getUniquePhone().toString(),
        email: `test${getUniquePhone()}@test.com`,
        location: {
          ...testCase.employer.location,
          coordinates: {
            type: 'Point',
            coordinates: testCase.employer.location.coordinates
          }
        }
      };

      const employerResponse = await axios.post(`${API_URL}/api/employers/register`, employerData);
      console.log('Employer registered successfully:', employerResponse.data);

      // Test 3: Create a job
      console.log('\nTesting job creation:');
      const jobData = {
        ...testCase.job,
        employer: employerResponse.data._id,
        location: employerData.location,
        preferredLanguages: testCase.worker.languages.slice(0, 2),
        startDate: new Date(Date.now() + 86400000) // Tomorrow
      };

      const jobResponse = await axios.post(`${API_URL}/api/jobs`, jobData);
      console.log('Job created successfully:', jobResponse.data);

      // Test 4: Check job matching
      console.log('\nTesting job matching:');
      const matchingJobsResponse = await axios.get(`${API_URL}/api/workers/${workerResponse.data._id}/jobs`);
      console.log('Matching jobs found:', matchingJobsResponse.data.length);
      
      if (matchingJobsResponse.data.length > 0) {
        console.log('Match scores:', matchingJobsResponse.data.map(match => ({
          jobTitle: match.job.title,
          score: match.score
        })));
      }

    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data
      });
      console.error('Request Data:', workerData);
    }

  } catch (error) {
    console.error('Test case error:', error.message);
  }
}

async function testEndpoints() {
  try {
    console.log('\n=== Starting ShaktiScore System Tests ===\n');
    
    // Run multiple test cases
    console.log('Running Test Case 1: Young worker with multiple skills');
    await runTest(testCases[0], 0);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('Running Test Case 2: Peak age worker with focused skills');
    await runTest(testCases[1], 1);
    
} catch (error) {
    console.error('Error during testing:', error.message);
  }
}

// Run the tests
testEndpoints(); 