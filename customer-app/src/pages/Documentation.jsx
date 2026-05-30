import React from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiSettings, FiActivity, FiLayers } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Documentation = () => {
  return (
    <div className="bg-[#faf9f6] min-h-screen text-on-surface">
      <Navbar />

      <section className="pt-16 pb-24 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 md:p-12 rounded-3xl border border-outline-variant/30 relative overflow-hidden shadow-[0_20px_50px_rgba(108,47,0,0.04)]"
        >
          {/* Header */}
          <div className="border-b border-[#753401]/10 pb-6 mb-8 text-center sm:text-left">
            <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Knowledge Base
            </span>
            <h1 className="text-4xl font-bold text-primary mt-4 font-headline-xl flex items-center justify-center sm:justify-start gap-3">
              <FiBookOpen className="text-primary" /> System Documentation
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              Technical specifications, operating indices, and installation parameters for FilterNest residential reverse osmosis technology.
            </p>
          </div>

          {/* Doc Content */}
          <div className="space-y-10 text-sm leading-relaxed text-gray-700">
            {/* Stage 1: Technology Overview */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2 flex items-center gap-2">
                <FiLayers className="text-primary" /> 1. Multi-Stage Purification Architecture
              </h2>
              <p>
                FilterNest systems implement a specialized six-stage membrane sequence engineered to bring municipal source water to pharmaceutical-grade wellness index readings:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">STAGES 1 - 2</span>
                  <h4 className="font-bold text-xs text-gray-900 mt-2">Sediment & Pre-Carbon</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Filters physical debris, dust, and rust particles. Adsorbs dissolved chlorine gases and synthetic chemicals.</p>
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">STAGES 3 - 4</span>
                  <h4 className="font-bold text-xs text-gray-900 mt-2">Reverse Osmosis Core</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Forced high-pressure sweeps separate heavy metals, microplastics, fluorides, and molecular pathogens.</p>
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">STAGES 5 - 6</span>
                  <h4 className="font-bold text-xs text-gray-900 mt-2">Post-Carbon & Mineralizer</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Polishes drinking taste while re-infusing pure alkaline traces of calcium and magnesium minerals.</p>
                </div>
              </div>
            </div>

            {/* Stage 2: Technical Specifications */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2 flex items-center gap-2">
                <FiSettings className="text-primary" /> 2. System Specifications
              </h2>
              <p>
                To maintain physical stability and architectural flow standards, keep source feeds aligned with the following margins:
              </p>
              
              <div className="overflow-x-auto border border-outline-variant/30 rounded-xl bg-white/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf9f6] border-b border-outline-variant/20 text-[10px] uppercase font-bold text-secondary">
                      <th className="p-4">Parameter</th>
                      <th className="p-4">Under-Sink Sanctuary</th>
                      <th className="p-4">Countertop RO Pure</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-gray-100">
                    <tr>
                      <td className="p-4 font-bold text-gray-900">Optimal Inlet Pressure</td>
                      <td className="p-4 text-gray-600">30 - 60 PSI</td>
                      <td className="p-4 text-gray-600">20 - 45 PSI</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-900">Daily Production Rate</td>
                      <td className="p-4 text-gray-600">75 Gallons/day</td>
                      <td className="p-4 text-gray-600">50 Gallons/day</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-900">TDS Reduction Index</td>
                      <td className="p-4 text-gray-600">95% - 98.5%</td>
                      <td className="p-4 text-gray-600">92% - 97.2%</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-900">Flow Rate</td>
                      <td className="p-4 text-gray-600">2.8 Liters/min</td>
                      <td className="p-4 text-gray-600">2.1 Liters/min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stage 3: Operational Diagnostics */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-primary border-b border-[#753401]/5 pb-2 flex items-center gap-2">
                <FiActivity className="text-primary" /> 3. Diagnostics & Troubleshooting Guidelines
              </h2>
              <p>
                Our Customer Dashboard updates to display diagnostic scheduling requirements automatically. Review minor system alerts before scheduling a diagnostic consultation:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-gray-900">Drastic Flow Reduction:</strong> Typically highlights pre-filtration sediment loading. Schedule a sediment core swap booking.
                </li>
                <li>
                  <strong className="text-gray-900">Waste-Water Drain Run-on:</strong> Often caused by municipal pressure drops under 30 PSI. Contact our support lines to configure an inline booster pump module.
                </li>
                <li>
                  <strong className="text-gray-900">TDS Index Shifts:</strong> Indicates the reverse osmosis membrane is approaching its 12-month depletion barrier. Schedule a signature RO core replacement.
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-[#753401]/10 text-xs text-on-surface-variant text-center">
              <p>For custom CAD schematics or architectural cabinetry fit dimensions, contact filternest.service@gmail.com.</p>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Documentation;
