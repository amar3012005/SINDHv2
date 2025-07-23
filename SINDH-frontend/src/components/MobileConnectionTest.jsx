import React, { useState, useEffect } from 'react';
import { mobileApi, testMobileConnection } from '../config/mobileApi';

const MobileConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [testResults, setTestResults] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're in a mobile environment
    const mobileCheck = !!(window.Capacitor || window.cordova);
    setIsMobile(mobileCheck);
    
    if (mobileCheck) {
      performConnectionTest();
    } else {
      setConnectionStatus('not-mobile');
    }
  }, []);

  const performConnectionTest = async () => {
    setConnectionStatus('testing');
    
    try {
      // Test 1: Basic health check
      const healthResponse = await mobileApi.get('/health');
      
      // Test 2: Try to get jobs (if authenticated)
      let jobsResponse = null;
      try {
        jobsResponse = await mobileApi.get('/jobs');
      } catch (error) {
        // Jobs might require authentication, which is expected
        console.log('Jobs endpoint requires authentication (expected)');
      }
      
      setTestResults({
        health: healthResponse.data,
        jobs: jobsResponse?.data || 'Requires authentication',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: window.Capacitor?.getPlatform?.() || 'unknown'
      });
      
      setConnectionStatus('success');
    } catch (error) {
      setTestResults({
        error: error.message,
        code: error.code,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: window.Capacitor?.getPlatform?.() || 'unknown'
      });
      setConnectionStatus('failed');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      case 'not-mobile': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success': return '✅ Connected Successfully';
      case 'failed': return '❌ Connection Failed';
      case 'testing': return '🔄 Testing Connection...';
      case 'not-mobile': return '📱 Not in Mobile Environment';
      default: return '❓ Unknown Status';
    }
  };

  if (!isMobile) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          📱 Mobile Connection Test
        </h3>
        <p className="text-blue-600">
          This component is designed for mobile app testing. 
          You're currently running in a web browser.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        📱 Mobile Connection Test
      </h3>
      
      <div className="mb-4">
        <p className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </p>
      </div>

      {connectionStatus === 'testing' && (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      )}

      {testResults && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">
              Test Results
            </h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
          
          <button
            onClick={performConnectionTest}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔄 Retest Connection
          </button>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        <p><strong>Platform:</strong> {window.Capacitor?.getPlatform?.() || 'unknown'}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
        <p><strong>API URL:</strong> http://localhost:10000/api</p>
      </div>
    </div>
  );
};

export default MobileConnectionTest; 