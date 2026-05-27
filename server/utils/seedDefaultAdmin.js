const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedDefaultAdmin = async () => {
  try {
    const defaultAdminEmail = 'dhruwa@gmail.com';
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: defaultAdminEmail });
    if (existingAdmin) {
      console.log(`✓ Default admin already exists: ${defaultAdminEmail}`);
      return;
    }

    // Create default admin (DO NOT hash password manually - let the pre-save middleware do it)
    const defaultAdmin = new Admin({
      firstName: 'Dhruva',
      lastName: 'Admin',
      email: defaultAdminEmail,
      phone: '+919999999999',
      password: '12345678', // Pre-save middleware will hash this
      role: 'admin',
      isActive: true,
    });

    await defaultAdmin.save();
    console.log('✓ Default admin account created successfully');
    console.log(`  Email: ${defaultAdminEmail}`);
    console.log(`  Password: 12345678`);
    console.log(`  Role: admin`);
  } catch (error) {
    console.error('Error seeding default admin:', error.message);
  }
};

module.exports = seedDefaultAdmin;
