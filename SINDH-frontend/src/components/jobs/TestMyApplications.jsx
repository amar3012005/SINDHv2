import React from 'react';

const TestMyApplications = () => {
  console.log('TestMyApplications component loaded successfully!');
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🎉 My Jobs Page Working!
        </h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-lg text-gray-700">
            If you can see this page, the routing is working correctly.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            This is a test version of the MyApplications component.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestMyApplications;
