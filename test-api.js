#!/usr/bin/env node

/**
 * Simple API test script for FRC 7790 backend
 * Run with: node test-api.js [BASE_URL]
 * 
 * Example: node test-api.js http://localhost:8788
 */

const BASE_URL = process.argv[2] || 'http://localhost:8788';

async function testAPI() {
  console.log(`🧪 Testing FRC 7790 API at ${BASE_URL}\n`);

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const health = await healthResponse.json();
    console.log('✅ Health check:', health.status);

    // Test API info
    console.log('\n2. Testing API info...');
    const infoResponse = await fetch(`${BASE_URL}/api/`);
    const info = await infoResponse.json();
    console.log('✅ API Info:', info.message);

    // Test registration
    console.log('\n3. Testing user registration...');
    const testUser = {
      username: `testuser_${Date.now()}`,
      password: 'testpass123'
    };

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('✅ Registration:', registerResult.message);
    } else {
      const error = await registerResponse.json();
      console.log('❌ Registration failed:', error.error);
    }

    // Test login
    console.log('\n4. Testing user login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    let token = null;
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      token = loginResult.token;
      console.log('✅ Login successful, user:', loginResult.user.username);
    } else {
      const error = await loginResponse.json();
      console.log('❌ Login failed:', error.error);
      
      // Try default admin login
      console.log('\n4b. Trying default admin login...');
      const adminLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });

      if (adminLoginResponse.ok) {
        const adminResult = await adminLoginResponse.json();
        token = adminResult.token;
        console.log('✅ Admin login successful');
      } else {
        console.log('❌ Admin login also failed');
      }
    }

    if (token) {
      // Test protected endpoint
      console.log('\n5. Testing protected endpoint (calendar)...');
      const calendarResponse = await fetch(`${BASE_URL}/api/calendar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (calendarResponse.ok) {
        const events = await calendarResponse.json();
        console.log('✅ Calendar access successful, events count:', events.length);
      } else {
        const error = await calendarResponse.json();
        console.log('❌ Calendar access failed:', error.error);
      }

      // Test creating a calendar event
      console.log('\n6. Testing calendar event creation...');
      const eventData = {
        title: 'Test Event',
        start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        end_time: new Date(Date.now() + 90000000).toISOString() // Tomorrow + 1 hour
      };

      const createEventResponse = await fetch(`${BASE_URL}/api/calendar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(eventData)
      });

      if (createEventResponse.ok) {
        const result = await createEventResponse.json();
        console.log('✅ Event creation:', result.message);
      } else {
        const error = await createEventResponse.json();
        console.log('❌ Event creation failed:', error.error);
      }

      // Test tasks
      console.log('\n7. Testing task creation...');
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        due_date: new Date(Date.now() + 604800000).toISOString() // Next week
      };

      const createTaskResponse = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(taskData)
      });

      if (createTaskResponse.ok) {
        const result = await createTaskResponse.json();
        console.log('✅ Task creation:', result.message);
      } else {
        const error = await createTaskResponse.json();
        console.log('❌ Task creation failed:', error.error);
      }
    }

    console.log('\n🎉 API testing completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Change the default admin password');
    console.log('2. Update JWT_SECRET in production');
    console.log('3. Configure CORS origins for your domain');
    console.log('4. Set up proper SSL certificates');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running');
    console.log('2. Check the database is set up');
    console.log('3. Verify environment variables');
  }
}

testAPI();
