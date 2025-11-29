// tests/test-server.js
const http = require('http');
const { exec } = require('child_process');

function checkServer() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Testing server connection...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Status Code: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          console.log('✅ Response Data:', parsedData);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          console.log('✅ Raw Response:', data);
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      console.log('💡 This usually means:');
      console.log('   - Server is not running');
      console.log('   - Wrong port number');
      console.log('   - Firewall blocking connection');
      console.log('   - Network issues');
      reject(error);
    });

    req.on('timeout', () => {
      console.log('⏰ Request timeout - server may not be running');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

function checkPort(port = 3000) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`✅ Port ${port} is in use (server might be running)`);
        resolve(true);
      } else {
        console.log(`❌ Port ${port} error:`, err.message);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      console.log(`❌ Port ${port} is free (server not running)`);
      resolve(false);
    });
    
    server.listen(port);
  });
}

function checkProcess() {
  return new Promise((resolve) => {
    console.log('🔍 Checking for Node.js processes...');
    exec('ps aux | grep node', (error, stdout, stderr) => {
      if (stdout.includes('src/server.js') || stdout.includes('src/app.js')) {
        console.log('✅ Node.js application process found');
        resolve(true);
      } else {
        console.log('❌ No Node.js application process found');
        resolve(false);
      }
    });
  });
}

async function comprehensiveTest() {
  console.log('🚀 Starting comprehensive server test...\n');
  
  try {
    // Check if server process is running
    const isProcessRunning = await checkProcess();
    
    // Check if port is in use
    const isPortInUse = await checkPort(3000);
    
    // Try to connect to server
    if (isPortInUse) {
      await checkServer();
    } else {
      console.log('\n💡 Solution: Start the server first:');
      console.log('   npm start');
      console.log('   or');
      console.log('   npm run dev');
    }
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    suggestSolutions();
  }
}

function suggestSolutions() {
  console.log('\n🔧 Troubleshooting Solutions:');
  console.log('1. Start the server:');
  console.log('   npm start');
  console.log('');
  console.log('2. Check if the server is running on a different port:');
  console.log('   netstat -tulpn | grep node');
  console.log('');
  console.log('3. Check server logs for errors:');
  console.log('   tail -f npm-debug.log (if exists)');
  console.log('');
  console.log('4. Try a different port:');
  console.log('   PORT=3001 npm start');
  console.log('');
  console.log('5. Check MongoDB connection:');
  console.log('   mongosh --eval "db.adminCommand(\'ismaster\')"');
}

// Run the test
comprehensiveTest();