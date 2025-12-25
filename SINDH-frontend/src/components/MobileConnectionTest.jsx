import React, { useState, useEffect } from 'react';
import { testMobileDetection } from '../config/api';
import { testApiConfiguration } from '../utils/apiUtils';
import mobileService from '../services/mobileService';

const MobileConnectionTest = () => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);
  const [activeTest, setActiveTest] = useState(null);

  useEffect(() => {
    // Auto-run tests on mount
    runAllTests();
  }, []);

  const runAllTests = async () => {
    setTesting(true);
    const results = {};

    try {
      // Test 1: Mobile Detection
      setActiveTest('Mobile Detection');
      results.mobileDetection = testMobileDetection();

      // Test 2: API Configuration
      setActiveTest('API Configuration');
      results.apiConfig = await testApiConfiguration();

      // Test 3: Capacitor Plugins
      setActiveTest('Capacitor Plugins');
      results.plugins = await mobileService.testAllPlugins();

      // Test 4: Network Status
      setActiveTest('Network Status');
      results.network = await mobileService.testNetworkMonitoring();

      // Test 5: Backend Connectivity
      setActiveTest('Backend Connection');
      results.backend = await testBackendConnection();

      setTestResults(results);
    } catch (error) {
      console.error('Test error:', error);
      results.error = error.message;
      setTestResults(results);
    } finally {
      setTesting(false);
      setActiveTest(null);
    }
  };

  const testBackendConnection = async () => {
    try {
      const { getApiUrl } = await import('../utils/apiUtils');
      const apiUrl = getApiUrl();
      const startTime = Date.now();
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      return {
        connected: response.ok,
        status: response.status,
        responseTime: `${responseTime}ms`,
        backendVersion: data.version || 'unknown',
        url: apiUrl
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        url: 'Failed to determine'
      };
    }
  };

  const copyResults = () => {
    const text = JSON.stringify(testResults, null, 2);
    navigator.clipboard.writeText(text);
    alert('Results copied to clipboard!');
  };

  const getStatusIcon = (test) => {
    if (!testResults[test]) return '⏳';
    if (testResults[test].error) return '❌';
    return '✅';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
          <h1 className="text-3xl font-bold mb-2">📱 Mobile Connection Test</h1>
          <p className="text-white/70">Comprehensive testing for SINDH mobile integration</p>
        </div>

        {/* Test Actions */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runAllTests}
              disabled={testing}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? '🔄 Testing...' : '🧪 Run All Tests'}
            </button>
            <button
              onClick={copyResults}
              disabled={!Object.keys(testResults).length}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              � Copy Results
            </button>
          </div>
          {activeTest && (
            <div className="mt-4 text-sm text-white/80">
              Currently testing: <span className="font-semibold">{activeTest}</span>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {/* Mobile Detection */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {getStatusIcon('mobileDetection')} Mobile Detection
            </h2>
            {testResults.mobileDetection && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/60">Environment:</span> <span className="font-mono">{testResults.mobileDetection.environment}</span></div>
                <div><span className="text-white/60">Is Mobile:</span> <span className={testResults.mobileDetection.isMobileApp ? 'text-green-400' : 'text-red-400'}>{testResults.mobileDetection.isMobileApp ? 'Yes' : 'No'}</span></div>
                <div><span className="text-white/60">Platform:</span> <span className="font-mono">{testResults.mobileDetection.platform || 'N/A'}</span></div>
                <div><span className="text-white/60">Backend:</span> <span className={testResults.mobileDetection.isProduction ? 'text-green-400' : 'text-yellow-400'}>{testResults.mobileDetection.isProduction ? 'Production' : 'Development'}</span></div>
              </div>
            )}
          </div>

          {/* API Configuration */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {getStatusIcon('apiConfig')} API Configuration
            </h2>
            {testResults.apiConfig && (
              <div className="space-y-2 text-sm">
                <div><span className="text-white/60">API URL:</span> <span className="font-mono text-blue-400">{testResults.apiConfig.apiUrl}</span></div>
                <div><span className="text-white/60">Using Production:</span> <span className={testResults.apiConfig.isUsingProduction ? 'text-green-400' : 'text-yellow-400'}>{testResults.apiConfig.isUsingProduction ? 'Yes' : 'No'}</span></div>
              </div>
            )}
          </div>

          {/* Plugins */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {getStatusIcon('plugins')} Capacitor Plugins
            </h2>
            {testResults.plugins?.tests && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {Object.entries(testResults.plugins.tests).map(([name, result]) => (
                  <div key={name} className="bg-white/5 p-3 rounded-lg">
                    <div className="font-semibold mb-1">{result.available ? '✅' : '❌'} {name}</div>
                    <div className="text-white/60 text-xs">{result.status || result.error}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Network */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {getStatusIcon('network')} Network Status
            </h2>
            {testResults.network && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/60">Connected:</span> <span className={testResults.network.connected ? 'text-green-400' : 'text-red-400'}>{testResults.network.connected ? 'Yes' : 'No'}</span></div>
                <div><span className="text-white/60">Type:</span> <span className="font-mono">{testResults.network.connectionType || 'N/A'}</span></div>
              </div>
            )}
          </div>

          {/* Backend */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {getStatusIcon('backend')} Backend Connection
            </h2>
            {testResults.backend && (
              <div className="space-y-2 text-sm">
                <div><span className="text-white/60">Status:</span> <span className={testResults.backend.connected ? 'text-green-400' : 'text-red-400'}>{testResults.backend.connected ? 'Connected' : 'Disconnected'}</span></div>
                <div><span className="text-white/60">Response Time:</span> <span className="font-mono">{testResults.backend.responseTime || 'N/A'}</span></div>
                <div><span className="text-white/60">URL:</span> <span className="font-mono text-xs break-all">{testResults.backend.url}</span></div>
              </div>
            )}
          </div>

          {/* Raw Results */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">📄 Raw Results</h2>
            <pre className="text-xs bg-black/30 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileConnectionTest; 