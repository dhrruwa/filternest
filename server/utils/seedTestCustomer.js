const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const seedTestCustomer = async () => {
  try {
    const testCustomerEmail = 'test.customer@filternest.com';
    
    // Check if test customer already exists
    const existingCustomer = await Customer.findOne({ email: testCustomerEmail });
    if (existingCustomer) {
      console.log(`✓ Test customer already exists: ${testCustomerEmail}`);
      return;
    }

    // Create test customer (DO NOT hash password manually - let the pre-save middleware do it)
    const testCustomer = new Customer({
      firstName: 'Test',
      lastName: 'Customer',
      email: testCustomerEmail,
      phone: '+919876543210',
      password: '12345678', // Pre-save middleware will hash this
      role: 'customer',
      verified: true, // Pre-verified so they can login immediately
      isActive: true,
    });

    await testCustomer.save();
    console.log('✓ Test customer account created successfully');
    console.log(`  Email: ${testCustomerEmail}`);
    console.log(`  Password: 12345678`);
    console.log(`  Role: customer`);
  } catch (error) {
    console.error('Error seeding test customer:', error.message);
  }
};

module.exports = seedTestCustomer;
