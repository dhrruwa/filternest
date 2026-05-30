import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiPhone, FiMail, FiClock, FiUser, FiNavigation2 } from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const JobDetailsModal = ({ isOpen, onClose, job }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (isOpen && job?.serviceLocation?.coordinates && mapRef.current) {
      // Initialize or reinitialize the map
      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      const [lng, lat] = job.serviceLocation.coordinates;
      mapInstance.current = L.map(mapRef.current).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      // Add marker
      L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup(`<b>${job.serviceLocation?.address?.street}</b><br/>${job.serviceLocation?.address?.city}`)
        .addTo(mapInstance.current)
        .openPopup();
    }

    return () => {
      if (mapInstance.current && !isOpen) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isOpen, job]);

  const getGoogleMapsUrl = () => {
    if (!job?.serviceLocation?.coordinates) return '#';
    const [lng, lat] = job.serviceLocation.coordinates;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const getAppleMapsUrl = () => {
    if (!job?.serviceLocation?.coordinates) return '#';
    const [lng, lat] = job.serviceLocation.coordinates;
    return `maps://maps.apple.com/?daddr=${lat},${lng}`;
  };

  if (!job) return null;

  const customerName = job.customer?.firstName && job.customer?.lastName 
    ? `${job.customer.firstName} ${job.customer.lastName}`
    : 'Customer';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="bg-white w-full md:w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold capitalize mb-1">
                  {job.serviceType?.replace(/_/g, ' ')}
                </h2>
                <p className="text-blue-100">Booking ID: {job.bookingId}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-600 rounded-lg transition"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div>
                <span
                  className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm ${
                    job.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : job.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : job.status === 'in_progress'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {job.status?.toUpperCase()}
                </span>
              </div>

              {/* Customer Information */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUser size={20} className="text-blue-600" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Name</p>
                    <p className="text-gray-900 font-medium">{customerName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold flex items-center gap-2">
                        <FiPhone size={14} /> Phone
                      </p>
                      <a
                        href={`tel:${job.customer?.phone}`}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        {job.customer?.phone}
                      </a>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold flex items-center gap-2">
                        <FiMail size={14} /> Email
                      </p>
                      <a
                        href={`mailto:${job.customer?.email}`}
                        className="text-blue-600 font-medium hover:underline truncate"
                      >
                        {job.customer?.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiClock size={20} className="text-blue-600" />
                  Booking Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Date & Time</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(job.bookingDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(job.bookingDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {job.estimatedDuration && (
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Estimated Duration</p>
                      <p className="text-gray-900 font-medium">{job.estimatedDuration} minutes</p>
                    </div>
                  )}
                  {job.priority && (
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Priority</p>
                      <p className={`font-medium capitalize ${
                        job.priority === 'high' ? 'text-red-600' :
                        job.priority === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {job.priority}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Description */}
              {job.description && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700">{job.description}</p>
                </div>
              )}

              {/* Location Section */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiMapPin size={20} className="text-blue-600" />
                  Service Location
                </h3>

                {/* Map */}
                <div
                  ref={mapRef}
                  className="w-full h-64 rounded-lg mb-4 border-2 border-gray-300"
                />

                {/* Address Details */}
                <div className="space-y-2 mb-4">
                  <p className="text-gray-900 font-medium text-lg">
                    {job.serviceLocation?.address?.street}
                  </p>
                  <p className="text-gray-600">
                    {job.serviceLocation?.address?.city}
                    {job.serviceLocation?.address?.state && `, ${job.serviceLocation.address.state}`}
                    {job.serviceLocation?.address?.pincode && ` - ${job.serviceLocation.address.pincode}`}
                  </p>
                  {job.serviceLocation?.address?.landmark && (
                    <p className="text-gray-600 text-sm flex items-center gap-1.5">
                      <FiMapPin size={14} className="text-blue-600" /> Landmark: {job.serviceLocation.address.landmark}
                    </p>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  <a
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <FiNavigation2 size={18} />
                    Google Maps
                  </a>
                  <a
                    href={getAppleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <FiNavigation2 size={18} />
                    Apple Maps
                  </a>
                </div>
              </div>

              {/* Coordinates (if available) */}
              {job.serviceLocation?.coordinates && (
                <div className="bg-gray-900 text-gray-100 rounded-xl p-4 text-sm font-mono">
                  <p className="text-gray-400 mb-2">Coordinates</p>
                  <p>Lat: {job.serviceLocation.coordinates[1].toFixed(6)}</p>
                  <p>Lng: {job.serviceLocation.coordinates[0].toFixed(6)}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JobDetailsModal;
