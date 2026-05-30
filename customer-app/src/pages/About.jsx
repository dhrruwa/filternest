import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

const About = () => {
  const values = [
    {
      title: 'Quality',
      description: 'We ensure highest quality of service with trained professionals'
    },
    {
      title: 'Reliability',
      description: 'Dependable service that you can count on, every time'
    },
    {
      title: 'Innovation',
      description: 'Latest technology and methods for water purification'
    },
    {
      title: 'Customer Focus',
      description: 'Your satisfaction is our top priority'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl opacity-90">Trusted water purifier service provider for over a decade</p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-lg p-12 mb-12"
          >
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Water Filter Service has been serving families and businesses for over 10 years, 
              providing reliable water purification solutions. We understand that clean water is 
              essential to your health and well-being.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our mission is to make professional water purifier maintenance accessible and 
              convenient for everyone. We combine expertise, technology, and customer care to 
              deliver exceptional service.
            </p>
          </motion.div>

          {/* Values Grid */}
          <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-lg p-6"
              >
                <h3 className="text-2xl font-bold text-primary mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            {[
              { label: 'Happy Customers', value: '10,000+' },
              { label: 'Services Completed', value: '50,000+' },
              { label: 'Expert Technicians', value: '200+' },
              { label: 'Cities Covered', value: '50+' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
