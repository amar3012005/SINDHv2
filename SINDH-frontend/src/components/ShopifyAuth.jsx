import React, { useEffect, useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge-utils';

/**
 * Example component that fetches data from your backend using Shopify authentication
 * This demonstrates how to use the session token for authenticated API calls
 */
function ShopifyAuth() {
  const app = useAppBridge();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch data securely using the session token
  const fetchSecureData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get session token from App Bridge
      const token = await getSessionToken(app);
      
      // Use token for authentication in API request
      const response = await fetch('https://sindh-backend.onrender.comapi/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Shopify Integration</h2>
      
      <button 
        onClick={fetchSecureData}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Fetch Secure Data'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {data && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Response:</h3>
          <pre className="bg-gray-900 p-4 rounded overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ShopifyAuth;