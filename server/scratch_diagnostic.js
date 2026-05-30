const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('./models/Customer');
const Booking = require('./models/Booking');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const SupportTicket = require('./models/SupportTicket');
const MaintenanceSchedule = require('./models/MaintenanceSchedule');
const Agent = require('./models/Agent');

const runDiagnostic = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/water-filter-service';
    console.log('Connecting to MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✓ Connected successfully!\n');

    console.log('--- Checking Collections Document Counts ---');
    const counts = {
      Customer: await Customer.countDocuments().catch(e => ({ error: e.message })),
      Agent: await Agent.countDocuments().catch(e => ({ error: e.message })),
      Booking: await Booking.countDocuments().catch(e => ({ error: e.message })),
      Invoice: await Invoice.countDocuments().catch(e => ({ error: e.message })),
      Payment: await Payment.countDocuments().catch(e => ({ error: e.message })),
      Notification: await Notification.countDocuments().catch(e => ({ error: e.message })),
      SupportTicket: await SupportTicket.countDocuments().catch(e => ({ error: e.message })),
      MaintenanceSchedule: await MaintenanceSchedule.countDocuments().catch(e => ({ error: e.message })),
    };
    console.log(JSON.stringify(counts, null, 2));

    console.log('\n--- Checking Customer Dashboard Stats Query Logic ---');
    // Find a test customer
    const testCustomer = await Customer.findOne();
    if (!testCustomer) {
      console.log('⚠ No customers found in DB. Seeding may have been bypassed or skipped.');
    } else {
      console.log(`Testing with Customer ID: ${testCustomer._id} (${testCustomer.email})`);
      const customerId = testCustomer._id;

      try {
        console.log('Simulating getDashboard baseline fetches...');
        const [bookings, invoices, upcomingSchedules, unreadNotifications, activeTickets] = await Promise.all([
          Booking.find({ customer: customerId }),
          Invoice.find({ customer: customerId }),
          MaintenanceSchedule.find({ customer: customerId, status: { $ne: 'completed' } }),
          Notification.find({ recipient: customerId, isRead: false }),
          SupportTicket.find({ customer: customerId, status: { $ne: 'closed' } }),
        ]);
        console.log('✓ Baseline fetches succeeded.');

        const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
        console.log(`Bookings count: ${bookings.length}, active: ${activeBookings.length}`);

        if (activeBookings.length > 0) {
          console.log('Testing active tracker population...');
          const trackedBooking = activeBookings.find(b => ['assigned', 'agent_assigned', 'on_the_way', 'in_progress'].includes(b.status)) || activeBookings[0];
          const activeTracker = await Booking.findById(trackedBooking._id)
            .populate('assignedAgent')
            .populate('invoice');
          console.log('✓ Active tracker population succeeded:', !!activeTracker);
        }
      } catch (err) {
        console.error('✗ Error in getDashboard logic simulation:', err);
      }
    }

    console.log('\n--- Checking Admin Dashboard Stats Query Logic ---');
    try {
      const totalCustomers = await Customer.countDocuments();
      const totalAgents = await Agent.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const completedBookings = await Booking.countDocuments({ status: 'completed' });
      const pendingBookings = await Booking.countDocuments({ status: 'pending' });
      const activeAgents = await Agent.countDocuments({ status: 'available' });
      const upcomingReminders = await MaintenanceSchedule.countDocuments({
        status: 'pending',
        nextServiceDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });
      console.log('✓ Admin dashboard stats calculations succeeded:');
      console.log({
        totalCustomers,
        totalAgents,
        totalBookings,
        completedBookings,
        pendingBookings,
        activeAgents,
        upcomingReminders,
      });
    } catch (err) {
      console.error('✗ Error in getDashboardStats logic simulation:', err);
    }

    await mongoose.disconnect();
    console.log('\nDiagnostic completed.');
  } catch (error) {
    console.error('✗ Global diagnostic error:', error);
  }
};

runDiagnostic();
