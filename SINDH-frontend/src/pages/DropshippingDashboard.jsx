import React, { useState, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge-utils';
import ShopifyAuth from '../components/ShopifyAuth';

function DropshippingDashboard() {
  const app = useAppBridge();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch shop data on component mount
    const fetchShopData = async () => {
      try {
        const token = await getSessionToken(app);
        
        // Replace with your actual backend endpoint
        const response = await fetch('https://sindh-backend.onrender.comapi/products', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch shop data: ${response.status}`);
        }
        
        const data = await response.json();
        setShopData(data);
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopData();
  }, [app]);

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white">Enigma Dropshipping Dashboard</h1>
          <p className="mt-2 text-gray-400">Manage your dropshipping products and orders</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Panel */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Store Overview</h2>
            {loading ? (
              <p className="text-gray-400">Loading store data...</p>
            ) : error ? (
              <p className="text-red-400">Error: {error}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div>
                  <p className="text-gray-400">Active Orders</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div>
                  <p className="text-gray-400">Revenue (30 days)</p>
                  <p className="text-2xl font-bold text-white">$0.00</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded">
                Import Products
              </button>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded">
                Create Supplier
              </button>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded">
                Manage Orders
              </button>
            </div>
          </div>
          
          {/* Authentication Status */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Authentication</h2>
            <ShopifyAuth />
          </div>
        </div>
        
        {/* Recent Orders */}
        <div className="mt-8 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-gray-400">No recent orders found.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DropshippingDashboard;