require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Agent = require('./models/Agent');
const Booking = require('./models/Booking');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-filter-service');
    const bookingsWithFeedback = await Booking.find({ 'feedback.rating': { $exists: true } })
      .populate('customer', 'firstName lastName')
      .populate('assignedAgent', 'firstName lastName');
    
    console.log(`\n=== BOOKINGS WITH FEEDBACK: ${bookingsWithFeedback.length} ===\n`);
    bookingsWithFeedback.forEach(b => {
      console.log(`ID: ${b._id}`);
      console.log(`Customer: ${b.customer?.firstName} ${b.customer?.lastName}`);
      console.log(`Agent: ${b.assignedAgent?.firstName} ${b.assignedAgent?.lastName}`);
      console.log(`Rating: ${b.feedback?.rating}`);
      console.log(`Review: "${b.feedback?.review}"`);
      console.log(`Submitted At: ${b.feedback?.submittedAt}`);
      console.log('-----------------------------------');
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
