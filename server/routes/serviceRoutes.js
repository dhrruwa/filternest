const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true } });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get service by type
router.get('/:serviceType', async (req, res) => {
  try {
    const service = await prisma.service.findFirst({ where: { serviceType: req.params.serviceType } });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
