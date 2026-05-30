import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiX, FiSearch, FiMapPin, FiLoader } from 'react-icons/fi';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Map Controller Component
const MapController = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], 15);
    }
  }, [position, map]);

  return null;
};

// Location Picker Modal Component
const LocationPicker = ({ isOpen, onClose, onSelectLocation, initialLocation = null }) => {
  const [position, setPosition] = useState(initialLocation || { latitude: 28.7041, longitude: 77.1025 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const markerRef = useRef(null);

  // Get current location using browser Geolocation API
  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition({ latitude, longitude });
        fetchLocationInfo(latitude, longitude);
        toast.success('Current location detected');
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Please enable location access to continue');
        setIsLoadingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Fetch location details from Nominatim API
  const fetchLocationInfo = async (latitude, longitude) => {
    setIsLoadingGeocode(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      setLocationInfo({
        address: data.address?.road || data.address?.street || data.name || 'Unknown Location',
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        pincode: data.address?.postcode || '',
        fullAddress: data.display_name || '',
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to fetch location details');
    } finally {
      setIsLoadingGeocode(false);
    }
  };

  // Search location using Nominatim API
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setIsLoadingGeocode(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data.length === 0) {
        toast.error('Location not found. Please try another search.');
        setIsLoadingGeocode(false);
        return;
      }

      const result = data[0];
      const newPosition = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };

      setPosition(newPosition);
      fetchLocationInfo(newPosition.latitude, newPosition.longitude);
      setSearchQuery('');
      toast.success('Location found');
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search location');
    } finally {
      setIsLoadingGeocode(false);
    }
  };

  // Handle map clicks to select location
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setPosition({ latitude: lat, longitude: lng });
    fetchLocationInfo(lat, lng);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!locationInfo) {
      toast.error('Please select a valid location');
      return;
    }

    onSelectLocation({
      latitude: position.latitude,
      longitude: position.longitude,
      address: locationInfo.address,
      city: locationInfo.city,
      state: locationInfo.state,
      pincode: locationInfo.pincode,
      fullAddress: locationInfo.fullAddress,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9a4d09] to-[#c67a2f] text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiMapPin size={24} />
              <div>
                <h2 className="text-2xl font-bold">Select Location</h2>
                <p className="text-sm opacity-90">Pin your service location on the map</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-lg transition"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-[#f7f4ef] border-b border-gray-200 p-4">
            <form onSubmit={handleSearchLocation} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a location..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9a4d09]"
              />
              <button
                type="submit"
                disabled={isLoadingGeocode}
                className="bg-[#9a4d09] hover:bg-[#7a3d06] text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {isLoadingGeocode ? (
                  <FiLoader size={18} className="animate-spin" />
                ) : (
                  <FiSearch size={18} />
                )}
                Search
              </button>
            </form>
          </div>

          {/* Map Container */}
          <div className="flex-1 overflow-hidden bg-gray-100 relative">
            {isLoadingGeocode && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40">
                <div className="text-center">
                  <FiLoader className="animate-spin mx-auto mb-3 text-[#9a4d09]" size={32} />
                  <p className="text-gray-700 font-semibold">Fetching location details...</p>
                </div>
              </div>
            )}
            
            <MapContainer
              center={[position.latitude, position.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              onClick={handleMapClick}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker
                position={[position.latitude, position.longitude]}
                ref={markerRef}
              >
                <Popup>Selected Location</Popup>
              </Marker>
              <MapController position={position} />
            </MapContainer>
          </div>

          {/* Location Info & Actions */}
          <div className="bg-white border-t border-gray-200 p-6 space-y-4">
            {/* Location Details */}
            {locationInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#f7f4ef] rounded-xl p-4 space-y-2"
              >
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Address</p>
                  <p className="text-gray-900 font-medium">{locationInfo.address}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase">City</p>
                    <p className="text-gray-900 font-medium">{locationInfo.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase">State</p>
                    <p className="text-gray-900 font-medium">{locationInfo.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase">Pincode</p>
                    <p className="text-gray-900 font-medium">{locationInfo.pincode || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Coordinates</p>
                  <p className="text-xs text-gray-700">
                    {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLoadingLocation || isLoadingGeocode}
                className="flex-1 bg-white border-2 border-[#9a4d09] text-[#9a4d09] hover:bg-[#f7f4ef] py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoadingLocation ? (
                  <>
                    <FiLoader size={18} className="animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <FiMapPin size={18} /> Use My Current Location
                  </>
                )}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!locationInfo || isLoadingGeocode}
                className="flex-1 bg-[#9a4d09] hover:bg-[#7a3d06] text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationPicker;
