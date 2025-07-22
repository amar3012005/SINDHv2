// Simple test to check backend connectivity
const testBackendConnection = async () => {
  const baseUrl = 'https://sindh-backend.onrender.com';
  
  try {
    console.log('🧪 Testing backend connection...');
    
    // Test health endpoint
    console.log('📡 Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log('Health status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is healthy:', healthData);
    } else {
      console.log('❌ Backend health check failed');
    }
    
    // Test worker registration endpoint
    console.log('\n📡 Testing worker registration endpoint...');
    const testData = {
      name: 'Test Worker',
      age: 25,
      phone: '9876543210',
      email: 'test@example.com',
      gender: 'Male',
      aadharNumber: '123456789012',
      skills: ['Construction'],
      experience: 'Less than 1 year',
      preferredCategory: 'Construction',
      expectedSalary: '₹500 per day',
      languages: ['Hindi'],
      location: {
        village: 'Test Village',
        district: 'Test District',
        state: 'Test State',
        pincode: '000000'
      },
      preferredWorkType: 'Full-time daily work',
      availability: 'Available immediately',
      workRadius: 10,
      bio: 'Test bio'
    };
    
    const registerResponse = await fetch(`${baseUrl}/api/workers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Registration status:', registerResponse.status);
    
    if (registerResponse.ok) {
      const result = await registerResponse.json();
      console.log('✅ Registration successful:', result.message);
    } else {
      const error = await registerResponse.json();
      console.log('❌ Registration failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testBackendConnection(); 