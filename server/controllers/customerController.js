const Customer = require('../models/Customer');

// Get Customer Profile
const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Customer Profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, preferences } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      {
        firstName,
        lastName,
        phone,
        address,
        preferences,
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      customer: customer.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      {
        'location.type': 'Point',
        'location.coordinates': [longitude, latitude],
      },
      { new: true }
    );

    res.json({
      message: 'Location updated successfully',
      location: customer.location,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateLocation,
};
