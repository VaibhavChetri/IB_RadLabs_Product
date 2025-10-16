/**
 * Simple test script to verify the login API endpoint
 * Run with: node test-api.js
 */

const https = require('https');
const http = require('http');

const testLogin = () => {
  const postData = 'username=ch-mumbai&password=ch-mumbai';
  
  const options = {
    hostname: 'localhost',
    port: 3099,
    path: '/v1/api/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': 'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUyMywiaWF0IjoxNzYwNDU4Njg4LCJleHAiOjE3NjMwNTA2ODgsInR5cGUiOiJyZWZyZXNoIn0.3eGR4s6u8224Ej0CwNH-AzvbxcOiAua4uN-GgOChHnM'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Body:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
        
        if (jsonData.access_token) {
          console.log('✅ Login successful! Access token received.');
          console.log('Access Token:', jsonData.access_token);
        } else {
          console.log('❌ Login failed: No access token in response');
        }
      } catch (e) {
        console.log('❌ Failed to parse JSON response:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
    console.log('Make sure your API server is running on localhost:3099');
  });

  req.write(postData);
  req.end();
};

console.log('🧪 Testing Login API Endpoint...');
console.log('Endpoint: http://localhost:3099/v1/api/oauth/access_token');
console.log('Credentials: ch-mumbai / ch-mumbai');
console.log('---');

testLogin();
