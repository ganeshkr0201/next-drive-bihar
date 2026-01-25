import { useState, useEffect } from 'react';
import envConfig from '../../config/env';

const DebugInfo = () => {
  const [apiTest, setApiTest] = useState('Testing...');
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    // Test API connection
    const testApi = async () => {
      try {
        const response = await fetch(`${envConfig.apiUrl}/`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiTest(`✅ Connected: ${JSON.stringify(data)}`);
        } else {
          setApiTest(`❌ HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        setApiTest(`❌ Error: ${error.message}`);
      }
    };

    // Get environment variables
    setEnvVars({
      VITE_API_URL: import.meta.env.VITE_API_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
    });

    testApi();
  }, []);

  // Only show in development or when debug is enabled
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_DEBUG_LOGS !== 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔧 Debug Info</h3>
      
      <div className="mb-2">
        <strong>API URL:</strong> {envConfig.apiUrl}
      </div>
      
      <div className="mb-2">
        <strong>API Test:</strong> {apiTest}
      </div>
      
      <div className="mb-2">
        <strong>Environment:</strong>
        <pre className="text-xs mt-1 bg-gray-800 p-2 rounded">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      
      <button 
        onClick={() => window.location.reload()} 
        className="bg-blue-600 px-2 py-1 rounded text-xs"
      >
        Reload
      </button>
    </div>
  );
};

export default DebugInfo;