const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedDefaultAdmin = async () => {
  try {
    const adminsToSeed = [
      {
        firstName: 'Dhruva',
        lastName: 'Admin',
        email: 'filternest.service@gmail.com',
        phone: '+917483550914',
        password: '13572468',
        role: 'admin',
        isActive: true,
      },
      {
        firstName: 'FilterNest',
        lastName: 'Admin',
        email: 'dhrruwa.work@gmail.com',
        phone: '+918660434621',
        password: 'Filter@Nest1',
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
