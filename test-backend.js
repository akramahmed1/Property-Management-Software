const http = require('http');

// Test the backend server
const testBackend = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/company?region=INDIA',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Backend is running! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📊 Response:', JSON.stringify(response, null, 2));
        console.log('🎉 Backend test successful!');
      } catch (error) {
        console.log('📄 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Backend test failed:', error.message);
    console.log('💡 Make sure the backend server is running on port 3000');
  });

  req.end();
};

// Wait a moment for server to start, then test
setTimeout(() => {
  console.log('🧪 Testing backend server...');
  testBackend();
}, 2000);
