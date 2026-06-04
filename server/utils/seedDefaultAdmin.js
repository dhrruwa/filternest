const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const seedDefaultAdmin = async () => {
  try {
    const adminsToSeed = [
      {
        firstName: 'Dhruva',
        lastName: 'Admin',
        email: 'dhrruwa@gmail.com',
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
      },
    ];

    for (const adminData of adminsToSeed) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      const existingAdmin = await prisma.admin.findUnique({ where: { email: adminData.email } });
      if (existingAdmin) {
        // Update existing admin with new password and data
        await prisma.admin.update({
          where: { id: existingAdmin.id },
          data: {
            firstName: adminData.firstName,
            lastName: adminData.lastName,
            password: hashedPassword,
            phone: adminData.phone,
            isActive: adminData.isActive,
          },
        });
        console.log(`✓ Admin updated: ${adminData.email} (${adminData.password})`);
      } else {
        await prisma.admin.create({
          data: { ...adminData, password: hashedPassword },
        });
        console.log(`✓ Default admin account created successfully: ${adminData.email} (${adminData.password})`);
      }
    }
  } catch (error) {
    console.error('Error seeding default admin:', error.message);
  }
};

module.exports = seedDefaultAdmin;
