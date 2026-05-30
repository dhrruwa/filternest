const axios = require('axios');

const testLogin = async () => {
  const BASE_URL = 'http://localhost:5001/api';

  console.log('--- TEST 1: CUSTOMER LOGIN & DASHBOARD STATS ---');
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login/customer`, {
      email: 'customer@test.com',
      password: 'password123'
    });
    console.log('✓ Customer Login successful!');
    const token = loginRes.data.token;
    console.log('Received Token:', token.substring(0, 30) + '...');

    const dashboardRes = await axios.get(`${BASE_URL}/customers/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✓ Customer Dashboard fetch successful!');
    console.log('Stats:', dashboardRes.data.stats);
  } catch (err) {
    console.error('✗ Customer test failed:', err.response?.status, err.response?.data || err.message);
  }

  console.log('\n--- TEST 2: ADMIN LOGIN & DASHBOARD STATS ---');
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login/admin`, {
      email: 'admin@filternest.com',
      password: 'admin123'
    });
    console.log('✓ Admin Login successful!');
    const token = loginRes.data.token;
    console.log('Received Token:', token.substring(0, 30) + '...');

    const statsRes = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✓ Admin Stats fetch successful!');
    console.log('Stats:', statsRes.data);
  } catch (err) {
    console.error('✗ Admin test failed:', err.response?.status, err.response?.data || err.message);
  }
};

testLogin();
