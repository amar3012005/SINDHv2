const axios = require('axios');
const API_URL = 'http://localhost:5000';

// Generate unique phone numbers for testing
const getUniquePhone = () => Math.floor(Math.random() * 9000000000) + 1000000000;

async function testEdgeCases() {
  try {
    console.log('\n=== Test 3: Edge Cases and Validation Testing ===\n');

    // Test Case 1: Minimum Age Worker
    console.log('Testing minimum age worker registration:');
    try {
      const minAgeWorker = {
        name: 'Young Worker',
        age: 17, // Below minimum age
        phone: getUniquePhone().toString(),
        skills: ['helper'],
        experience: 0,
        languages: ['Hindi'],
        location: {
          address: 'Test Address',
          coordinates: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          }
        }
      };
      
      await axios.post(`${API_URL}/api/workers/register`, minAgeWorker);
      console.log('❌ Should have rejected under-age worker');
    } catch (error) {
      console.log('✅ Correctly rejected under-age worker:', error.response?.data?.message);
    }

    // Test Case 2: Maximum Age Worker
    console.log('\nTesting maximum age worker registration:');
    try {
      const maxAgeWorker = {
        name: 'Senior Worker',
        age: 71, // Above maximum age
        phone: getUniquePhone().toString(),
        skills: ['masonry'],
        experience: 40,
        languages: ['Hindi'],
        location: {
          address: 'Test Address',
          coordinates: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          }
        }
      };
      
      await axios.post(`${API_URL}/api/workers/register`, maxAgeWorker);
      console.log('❌ Should have rejected over-age worker');
    } catch (error) {
      console.log('✅ Correctly rejected over-age worker:', error.response?.data?.message);
    }

    // Test Case 3: Invalid Location Coordinates
    console.log('\nTesting invalid location coordinates:');
    try {
      const invalidLocationWorker = {
        name: 'Test Worker',
        age: 30,
        phone: getUniquePhone().toString(),
        skills: ['painting'],
        experience: 5,
        languages: ['Hindi'],
        location: {
          address: 'Test Address',
          coordinates: {
            type: 'Point',
            coordinates: [181, 91] // Invalid coordinates
          }
        }
      };
      
      await axios.post(`${API_URL}/api/workers/register`, invalidLocationWorker);
      console.log('❌ Should have rejected invalid coordinates');
    } catch (error) {
      console.log('✅ Correctly rejected invalid coordinates:', error.response?.data?.message);
    }

    // Test Case 4: Duplicate Phone Number
    console.log('\nTesting duplicate phone number:');
    const phone = getUniquePhone().toString();
    try {
      const worker1 = {
        name: 'First Worker',
        age: 30,
        phone: phone,
        skills: ['painting'],
        experience: 5,
        languages: ['Hindi'],
        location: {
          address: 'Test Address',
          coordinates: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          }
        }
      };
      
      await axios.post(`${API_URL}/api/workers/register`, worker1);
      console.log('✅ First worker registered successfully');

      const worker2 = { ...worker1, name: 'Second Worker' };
      await axios.post(`${API_URL}/api/workers/register`, worker2);
      console.log('❌ Should have rejected duplicate phone number');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate phone:', error.response?.data?.message);
    }

    // Test Case 5: Invalid Job Creation
    console.log('\nTesting invalid job creation:');
    try {
      const invalidJob = {
        title: 'Test Job',
        description: 'Test Description',
        employer: 'invalid_id',
        requiredSkills: [],
        location: {
          address: 'Test Address',
          coordinates: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          }
        },
        wage: { amount: -100, period: 'daily' }, // Negative wage
        duration: '5 days',
        requiredExperience: -1, // Negative experience
        startDate: new Date(Date.now() - 86400000) // Past date
      };
      
      await axios.post(`${API_URL}/api/jobs`, invalidJob);
      console.log('❌ Should have rejected invalid job data');
    } catch (error) {
      console.log('✅ Correctly rejected invalid job:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('Test Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

// Run the tests
testEdgeCases(); 