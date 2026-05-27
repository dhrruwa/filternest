require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Agent = require('./models/Agent');
const Customer = require('./models/Customer');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-filter-service');
    
    console.log('\n=== DATABASE CHECK ===\n');
    
    // Check customers
    const customers = await Customer.find().limit(3);
    console.log(`Total Customers: ${await Customer.countDocuments()}`);
    console.log('Sample Customers:', customers.map(c => ({ id: c._id, name: c.firstName + ' ' + c.lastName, email: c.email })));
    
    // Check agents
    const agents = await Agent.find().limit(3);
    console.log(`\nTotal Agents: ${await Agent.countDocuments()}`);
    console.log('Sample Agents:', agents.map(a => ({ id: a._id, name: a.firstName + ' ' + a.lastName })));
    
    // Check bookings
    const allBookings = await Booking.find().limit(5)
      .populate('customer', 'firstName lastName email')
      .populate('assignedAgent', 'firstName lastName agentId');
    
    console.log(`\nTotal Bookings: ${await Booking.countDocuments()}`);
    console.log('Sample Bookings:');
    allBookings.forEach(b => {
      console.log(`  - ID: ${b._id}`);
      console.log(`    Customer: ${b.customer?.firstName} ${b.customer?.lastName}`);
      console.log(`    Assigned Agent: ${b.assignedAgent?.firstName || 'NOT ASSIGNED'}`);
      console.log(`    Status: ${b.status}`);
    });
    
    // Check assigned bookings
    const assignedBookings = await Booking.find({ assignedAgent: { $ne: null } })
      .populate('customer', 'firstName lastName email')
      .populate('assignedAgent', 'firstName lastName agentId');
    
    console.log(`\n✓ Bookings with assigned agents: ${assignedBookings.length}`);
    assignedBookings.forEach(b => {
      console.log(`  - Customer: ${b.customer?.firstName} → Agent: ${b.assignedAgent?.firstName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkData();
