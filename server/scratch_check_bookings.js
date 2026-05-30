const mongoose = require('mongoose');
require('dotenv').config();
const Booking = require('./models/Booking');

const checkBookings = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/water-filter-service';
    await mongoose.connect(mongoURI);
    console.log('✓ Connected to MongoDB');

    const bookings = await Booking.find({});
    console.log(`Total bookings found: ${bookings.length}`);

    let invalidBookingsCount = 0;
    for (const b of bookings) {
      if (!b.serviceType) {
        console.log(`✗ Booking ${b._id} has missing serviceType! Customer ID: ${b.customer}`);
        invalidBookingsCount++;
      }
      if (!b.status) {
        console.log(`✗ Booking ${b._id} has missing status!`);
        invalidBookingsCount++;
      }
    }

    if (invalidBookingsCount === 0) {
      console.log('✓ All bookings have valid serviceType and status.');
    } else {
      console.log(`⚠ Found ${invalidBookingsCount} invalid bookings.`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

checkBookings();
