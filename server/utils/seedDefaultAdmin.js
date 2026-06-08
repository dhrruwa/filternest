const logger = require('../lib/logger');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

/**
 * Seeds a single default admin account from environment variables.
 * No credentials are hardcoded and the password is never logged.
 *
 * Required env vars:  ADMIN_EMAIL, ADMIN_PASSWORD
 * Optional env vars:  ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_PHONE
 *
 * If ADMIN_EMAIL or ADMIN_PASSWORD is missing, seeding is skipped with a
 * warning rather than crashing the server.
 */
const seedDefaultAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn('⚠️ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping default admin seeding.');
    return;
  }

  const adminData = {
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'User',
    email,
    phone: process.env.ADMIN_PHONE || null,
    role: 'admin',
    isActive: true,
  };

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });

    if (existingAdmin) {
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: { ...adminData, password: hashedPassword },
      });
      logger.info(`✓ Default admin updated: ${email}`);
    } else {
      await prisma.admin.create({
        data: { ...adminData, password: hashedPassword },
      });
      logger.info(`✓ Default admin created: ${email}`);
    }
  } catch (error) {
    logger.error('Error seeding default admin:', error.message);
  }
};

module.exports = seedDefaultAdmin;
