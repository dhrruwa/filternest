const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

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
