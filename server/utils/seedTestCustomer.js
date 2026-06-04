const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

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
      },
    ];

    for (const customerData of customersToSeed) {
      const existingCustomer = await prisma.customer.findUnique({ where: { email: customerData.email } });
      if (existingCustomer) {
        console.log(`✓ Customer already exists: ${customerData.email}`);
      } else {
        const hashedPassword = await bcrypt.hash(customerData.password, 10);
        await prisma.customer.create({
          data: { ...customerData, password: hashedPassword },
        });
        console.log(`✓ Default customer account created successfully: ${customerData.email} (${customerData.password})`);
      }
    }
  } catch (error) {
    console.error('Error seeding test customer:', error.message);
  }
};

module.exports = seedTestCustomer;
