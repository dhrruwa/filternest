const logger = require('../lib/logger');
require('dotenv').config();
const prisma = require('../lib/prisma');

const services = [
  {
    name: 'General Service',
    serviceType: 'general_service',
    description: 'Regular maintenance and cleaning of your water purifier system',
    basePrice: 49.99,
    estimatedDuration: 45,
    partsRequired: [
      { partName: 'Filter Cartridge', quantity: 1, cost: 20 }
    ],
    tools: ['Screwdriver', 'Wrench', 'Container'],
    precautions: ['Switch off the system', 'Release water pressure'],
    steps: [
      'Turn off the purifier',
      'Release pressure from tank',
      'Inspect filter cartridges',
      'Clean housing units',
      'Reassemble and test'
    ],
    isActive: true,
    tags: ['maintenance', 'regular', 'cleaning']
  },
  {
    name: 'Pre-filter Replacement',
    serviceType: 'prefilter_replacement',
    description: 'Replace the pre-filter cartridge to maintain water quality',
    basePrice: 39.99,
    estimatedDuration: 30,
    partsRequired: [
      { partName: 'Pre-filter Cartridge', quantity: 1, cost: 25 }
    ],
    tools: ['Wrench', 'Container'],
    precautions: ['Switch off the system'],
    steps: [
      'Turn off the purifier',
      'Release system pressure',
      'Unscrew pre-filter housing',
      'Replace with new cartridge',
      'Reassemble and flush system'
    ],
    isActive: true,
    tags: ['replacement', 'prefilter', 'quarterly']
  },
  {
    name: 'Membrane Replacement',
    serviceType: 'membrane_replacement',
    description: 'Replace the RO membrane for optimal water purification',
    basePrice: 89.99,
    estimatedDuration: 60,
    partsRequired: [
      { partName: 'RO Membrane', quantity: 1, cost: 60 }
    ],
    tools: ['Wrench', 'Screwdriver', 'Container'],
    precautions: ['Switch off the system', 'Release all pressure'],
    steps: [
      'Turn off the purifier',
      'Shut off water supply',
      'Release system pressure',
      'Remove old membrane',
      'Install new membrane',
      'Run system flush cycle'
    ],
    isActive: true,
    tags: ['replacement', 'membrane', 'biannual']
  },
  {
    name: 'Installation Service',
    serviceType: 'installation',
    description: 'Professional installation of your new water purifier system',
    basePrice: 129.99,
    estimatedDuration: 120,
    partsRequired: [
      { partName: 'Installation Kit', quantity: 1, cost: 30 }
    ],
    tools: ['Drill', 'Wrench', 'Screwdriver', 'Adapter'],
    precautions: ['Check water pressure', 'Ensure proper ventilation'],
    steps: [
      'Assess installation location',
      'Install water inlet adapter',
      'Mount system securely',
      'Connect water and power',
      'Test all connections',
      'Run system test'
    ],
    isActive: true,
    tags: ['installation', 'new', 'setup']
  },
  {
    name: 'Repair Service',
    serviceType: 'repair',
    description: 'Repair and troubleshooting for your water purifier',
    basePrice: 59.99,
    estimatedDuration: 60,
    partsRequired: [],
    tools: ['Multimeter', 'Screwdriver', 'Wrench'],
    precautions: ['Switch off before repair'],
    steps: [
      'Diagnose the issue',
      'Identify faulty component',
      'Repair or replace component',
      'Test system functionality',
      'Provide maintenance tips'
    ],
    isActive: true,
    tags: ['repair', 'troubleshooting', 'maintenance']
  }
];

const seedServices = async () => {
  try {
    // Clear existing services
    await prisma.service.deleteMany({});

    // Insert new services
    const result = await prisma.service.createMany({ data: services });
    logger.info(`✅ ${result.count} services seeded successfully!`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding services:', error);
    process.exit(1);
  }
};

seedServices();
