const mongoose = require('mongoose');
const axios = require('axios');
const Agent = require('./models/Agent');
const { generateToken } = require('./utils/tokenUtils');

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/water-filter-service');
    console.log('Connected to MongoDB');

    const agent = await Agent.findOne({ email: 'harsha@gmail.com' });
    if (!agent) {
      console.error('Agent harsha@gmail.com not found in DB');
      await mongoose.disconnect();
      return;
    }

    const token = generateToken(agent._id, 'agent');
    console.log('Generated JWT Token for Harsha:', token);

    await mongoose.disconnect();

    console.log('Sending PUT request to http://localhost:5001/api/agents/status...');
    const response = await axios.put('http://localhost:5001/api/agents/status', 
      { status: 'available' },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('API Response Status:', response.status);
    console.log('API Response Data:', response.data);

  } catch (error) {
    console.error('API Call Failed!');
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

run();
