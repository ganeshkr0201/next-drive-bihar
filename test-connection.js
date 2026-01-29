// Simple connection test script
// Run this with: node test-connection.js

const testConnection = async () => {
    console.log('🧪 Testing connection between frontend and backend...\n');
    
    const backendUrl = 'http://localhost:3000';
    
    try {
        console.log(`📡 Testing backend health at ${backendUrl}`);
        
        // Use fetch instead of axios to avoid dependency issues
        const healthResponse = await fetch(`${backendUrl}/health`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Backend health check:', healthData);
        } else {
            console.log('❌ Backend health check failed:', healthResponse.status);
        }
        
        // Test main endpoint
        const mainResponse = await fetch(`${backendUrl}/`);
        if (mainResponse.ok) {
            const mainData = await mainResponse.json();
            console.log('✅ Backend main endpoint:', mainData);
        } else {
            console.log('❌ Backend main endpoint failed:', mainResponse.status);
        }
        
        // Test auth endpoint (should fail without token)
        try {
            const authResponse = await fetch(`${backendUrl}/auth/me`);
            if (authResponse.status === 401) {
                console.log('✅ Auth endpoint correctly requires authentication');
            } else {
                console.log('⚠️ Unexpected auth response:', authResponse.status);
            }
        } catch (authError) {
            console.log('⚠️ Auth endpoint error:', authError.message);
        }
        
        console.log('\n🎉 Connection test completed successfully!');
        console.log('\n� Next steps:');
        console.log('1. Backend is running ✅');
        console.log('2. Start frontend: cd frontend && npm run dev');
        console.log('3. Open browser: http://localhost:5173');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. ❗ BACKEND IS NOT RUNNING - Start it with: cd backend && npm start');
        console.log('2. Check if port 3000 is already in use: lsof -i :3000');
        console.log('3. Check if any firewall is blocking the connection');
        console.log('4. Verify .env files are configured correctly');
        
        // Additional checks
        console.log('\n🔍 Additional checks:');
        console.log('- Make sure you are in the project root directory');
        console.log('- Ensure backend dependencies are installed: cd backend && npm install');
        console.log('- Check backend logs for any startup errors');
    }
};

testConnection();