const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const seedTestCustomer = async () => {
  try {
    const customersToSeed = [
      {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test.customer@filternest.com',
        phone: '+919876543210',
        password: '12345678',
        role: 'customer',
        verified: true,
        isActive: true,
      },
      {
        firstName: 'Customer',
        lastName: 'Test',
        email: 'customer@test.com',
        phone: '+917777777777',
        password: 'password123',
        role: 'customer',
        verified: true,
        isActive: true,
      }
    ];

    for (const customerData of customersToSeed) {
      const existingCustomer = await Customer.findOne({ email: customerData.email });
      if (existingCustomer) {
        console.log(`✓ Customer already exists: ${customerData.email}`);
      } else {
        const newCustomer = new Customer(customerData);
        await newCustomer.save();
        console.log(`✓ Default customer account created successfully: ${customerData.email} (${customerData.password})`);
      }
    }
  } catch (error) {
    console.error('Error seeding test customer:', error.message);
  }
};

module.exports = seedTestCustomer;
