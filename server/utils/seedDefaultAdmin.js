const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedDefaultAdmin = async () => {
  try {
    const adminsToSeed = [
      {
        firstName: 'Dhruva',
        lastName: 'Admin',
        email: 'dhruwa@gmail.com',
        phone: '+919999999999',
        password: '12345678',
        role: 'admin',
        isActive: true,
      },
      {
        firstName: 'FilterNest',
        lastName: 'Admin',
        email: 'admin@filternest.com',
        phone: '+918888888888',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      }
    ];

    for (const adminData of adminsToSeed) {
      const existingAdmin = await Admin.findOne({ email: adminData.email });
      if (existingAdmin) {
        console.log(`✓ Admin already exists: ${adminData.email}`);
      } else {
        const newAdmin = new Admin(adminData);
        await newAdmin.save();
        console.log(`✓ Default admin account created successfully: ${adminData.email} (${adminData.password})`);
      }
    }
  } catch (error) {
    console.error('Error seeding default admin:', error.message);
  }
};

module.exports = seedDefaultAdmin;
