const mongoose = require('mongoose');
require('dotenv').config();

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📡 MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    
    // Test creating a simple document
    const TestSchema = new mongoose.Schema({ name: String, test: Boolean });
    const TestModel = mongoose.model('Test', TestSchema);
    
    const testDoc = new TestModel({ name: 'test', test: true });
    await testDoc.save();
    console.log('✅ Document creation test passed');
    
    await TestModel.deleteOne({ name: 'test' });
    console.log('✅ Document deletion test passed');
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Test registration endpoints
async function testRegistrationEndpoints() {
  const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://sindh-backend.onrender.com'
  : 'http://localhost:10000';
  
  // Test worker registration
  const workerData = {
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
  
  try {
    console.log('\n🧪 Testing worker registration...');
    const workerResponse = await fetch(`${baseUrl}/api/workers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerData)
    });
    
    console.log('📡 Worker registration status:', workerResponse.status);
    
    if (workerResponse.ok) {
      const result = await workerResponse.json();
      console.log('✅ Worker registration successful:', result.worker?.name);
    } else {
      const error = await workerResponse.json();
      console.log('❌ Worker registration failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Worker registration error:', error.message);
  }
  
  // Test employer registration
  const employerData = {
    name: 'Test Employer',
    phone: '9876543211',
    email: 'employer@example.com',
    company: {
      name: 'Test Company',
      type: 'Private Limited',
      industry: 'Construction'
    },
    location: {
      village: 'Test Village',
      district: 'Test District',
      state: 'Test State',
      pincode: '000000'
    },
    businessDescription: 'Test business description',
    verificationDocuments: {
      aadharNumber: '123456789013'
    }
  };
  
  try {
    console.log('\n🧪 Testing employer registration...');
    const employerResponse = await fetch(`${baseUrl}/api/employers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employerData)
    });
    
    console.log('📡 Employer registration status:', employerResponse.status);
    
    if (employerResponse.ok) {
      const result = await employerResponse.json();
      console.log('✅ Employer registration successful:', result.employer?.name);
    } else {
      const error = await employerResponse.json();
      console.log('❌ Employer registration failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Employer registration error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting registration tests...\n');
  
  await testDatabaseConnection();
  await testRegistrationEndpoints();
  
  console.log('\n✅ Tests completed');
}

runTests().catch(console.error); 