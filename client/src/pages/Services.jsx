import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

const Services = () => {
  const navigate = useNavigate();
  const services = [
    {
      title: 'General Service',
      price: '200 RS',
      duration: '45 min',
      description: 'Regular maintenance and cleaning of your water purifier system. Includes filter inspection and housing cleaning.',
      features: ['Filter inspection', 'Housing cleaning', 'System test', 'Maintenance tips']
    },
    {
      title: 'Pre-filter Replacement',
      price: '250 RS',
      duration: '30 min',
      description: 'Replace the pre-filter cartridge to maintain water quality and system performance.',
      features: ['Pre-filter replacement', 'System flush', 'Quality check', 'Warranty included']
    },
    {
      title: 'Membrane Replacement',
      price: '700 rs',
      duration: '60 min',
      description: 'Replace the RO membrane for optimal water purification and mineral removal.',
      features: ['RO membrane replacement', 'System calibration', 'Performance test', '6-month warranty']
    },
    {
      title: 'Installation',
      price: '500 RS',
      duration: '2 hours',
      description: 'Professional installation of your new water purifier system at home.',
      features: ['Site assessment', 'System setup', 'Full installation', 'User training']
    },
    {
      title: 'Repair Service',
      price: '500 rs',
      duration: '60 min',
      description: 'Repair and troubleshooting for your water purifier system.',
      features: ['Diagnosis', 'Repair/replacement', 'System test', 'Support']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl opacity-90">Professional water purifier maintenance and service</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-lg p-8 hover:shadow-xl transition"
              >
                <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-3xl font-bold text-primary">{service.price}</span>
                  <span className="text-gray-600">{service.duration}</span>
                </div>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center space-x-2 text-gray-700">
                      <span className="text-primary">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => navigate('/book-service', { state: { serviceTitle: service.title, servicePrice: service.price } })}
                  className="w-full bg-gradient-primary text-white py-2 rounded-lg hover:shadow-lg transition cursor-pointer hover:opacity-90">
                  Book Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
