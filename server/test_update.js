const mongoose = require('mongoose');
const Agent = require('./models/Agent');

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/water-filter-service');
    console.log('Connected to MongoDB');

    const userId = "6a12ad241a3a6c163a3c5b12"; // harsha's ID
    const status = "available";

    console.log('Attempting findByIdAndUpdate...');
    const agent = await Agent.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );
    console.log('Update success:', agent);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during update:', error);
  }
}

run();
