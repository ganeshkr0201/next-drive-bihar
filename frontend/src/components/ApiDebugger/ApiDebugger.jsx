import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import bookingService from '../../services/bookingService';
import authService from '../../services/authService';
import envConfig from '../../config/env';

const ApiDebugger = () => {
  const { user, isAuthenticated } = useAuth();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testApi = async (apiName, apiCall) => {
    setLoading(prev => ({ ...prev, [apiName]: true }));
    try {
      const result = await apiCall();
      setResults(prev => ({ 
        ...prev, 
        [apiName]: { 
          success: true, 
          data: result,
          timestamp: new Date().toLocaleTimeString()
        } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [apiName]: { 
          success: false, 
          error: error.message,
          status: error.response?.status,
          timestamp: new Date().toLocaleTimeString()
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [apiName]: false }));
    }
  };

  const testSessionStatus = async () => {
    try {
      const response = await fetch(`${envConfig.apiUrl}/debug/session`, {
        credentials: 'include'
      });
      const data = await response.json();
      setResults(prev => ({ 
        ...prev, 
        sessionStatus: { 
          success: true, 
          data,
          timestamp: new Date().toLocaleTimeString()
        } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        sessionStatus: { 
          success: false, 
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        } 
      }));
    }
  };

  const testCurrentUser = () => testApi('currentUser', () => authService.checkSession());
  const testAdminStats = () => testApi('adminStats', () => adminService.getStats());
  const testAdminUsers = () => testApi('adminUsers', () => adminService.getUsers());
  const testAdminQueries = () => testApi('adminQueries', () => adminService.getQueries());
  const testTourBookings = () => testApi('tourBookings', () => adminService.getTourBookings());
  const testUserBookings = () => testApi('userBookings', () => bookingService.getUserBookings());

  const clearResults = () => {
    setResults({});
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">API Debugger</h2>
        <p className="text-gray-600">Test API endpoints to diagnose authentication and data loading issues</p>
      </div>

      {/* User Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current User Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User:</strong> {user?.name || 'Not logged in'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
          </div>
          <div>
            <p><strong>API URL:</strong> {envConfig.apiUrl}</p>
            <p><strong>Environment:</strong> {envConfig.isProduction() ? 'Production' : 'Development'}</p>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">API Tests</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={testSessionStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Session Status
          </button>
          
          <button
            onClick={testCurrentUser}
            disabled={loading.currentUser}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading.currentUser ? 'Testing...' : 'Current User'}
          </button>

          <button
            onClick={testAdminStats}
            disabled={loading.adminStats}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            {loading.adminStats ? 'Testing...' : 'Admin Stats'}
          </button>

          <button
            onClick={testAdminUsers}
            disabled={loading.adminUsers}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            {loading.adminUsers ? 'Testing...' : 'Admin Users'}
          </button>

          <button
            onClick={testAdminQueries}
            disabled={loading.adminQueries}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            {loading.adminQueries ? 'Testing...' : 'Admin Queries'}
          </button>

          <button
            onClick={testTourBookings}
            disabled={loading.tourBookings}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading.tourBookings ? 'Testing...' : 'Tour Bookings'}
          </button>

          <button
            onClick={testUserBookings}
            disabled={loading.userBookings}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {loading.userBookings ? 'Testing...' : 'User Bookings'}
          </button>

          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test Results</h3>
        {Object.keys(results).length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click the buttons above to test APIs.</p>
        ) : (
          Object.entries(results).map(([apiName, result]) => (
            <div key={apiName} className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold capitalize">
                  {result.success ? '✅' : '❌'} {apiName.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <span className="text-sm text-gray-500">{result.timestamp}</span>
              </div>
              
              {result.success ? (
                <div>
                  <p className="text-green-700 mb-2">✅ Success</p>
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-green-800">View Response Data</summary>
                    <pre className="mt-2 p-2 bg-green-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <p className="text-red-700 mb-1">❌ Failed</p>
                  <p className="text-sm text-red-600">
                    <strong>Status:</strong> {result.status || 'Unknown'}
                  </p>
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {result.error}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Use</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Session Status:</strong> Check if your session is valid on the backend</li>
          <li>• <strong>Current User:</strong> Test the /auth/me endpoint</li>
          <li>• <strong>Admin APIs:</strong> Test admin endpoints (requires admin role)</li>
          <li>• <strong>User APIs:</strong> Test user-specific endpoints</li>
          <li>• Look for ✅ success or ❌ failure indicators</li>
          <li>• Check error messages for 401 (auth required) or 403 (permission denied)</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiDebugger;