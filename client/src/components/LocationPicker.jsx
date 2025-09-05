import React, { useState, useCallback, useEffect } from 'react';
import Map from './Map';

const LocationPicker = ({ onLocationSelect, initialLocation, label = "Select Location" }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const handleMapClick = useCallback((location) => {
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  }, [onLocationSelect]);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsFetching(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(location);
          if (onLocationSelect) {
            onLocationSelect(location);
          }
          setIsFetching(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please click on the map to select a location.');
          setIsFetching(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, [initialLocation, getCurrentLocation]);

  const clearLocation = () => {
    setSelectedLocation(null);
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  return (
    <div className="location-picker">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h4 style={{ marginBottom: 'var(--space-2)' }}>{label}</h4>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="btn btn-secondary"
            disabled={isFetching}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8C9.79 8 8 9.79 8 12S9.79 16 12 16 16 14.21 16 12 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V1H11V3.06C6.83 3.52 3.52 6.83 3.06 11H1V13H3.06C3.52 17.17 6.83 20.48 11 20.94V23H13V20.94C17.17 20.48 20.48 17.17 20.94 13H23V11H20.94ZM12 19C8.13 19 5 15.87 5 12S8.13 5 12 5 19 8.13 19 12 15.87 19 12 19Z" fill="currentColor"/>
            </svg>
            {isFetching ? 'Fetching...' : 'Use Current Location'}
          </button>
          <button
            type="button"
            onClick={() => setIsPickingLocation(!isPickingLocation)}
            className="btn btn-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor"/>
            </svg>
            {isPickingLocation ? 'Hide Map' : 'Pick on Map'}
          </button>
          {selectedLocation && (
            <button
              type="button"
              onClick={clearLocation}
              className="btn btn-error"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
              Clear
            </button>
          )}
        </div>
        
        {selectedLocation && (
          <div style={{ 
            padding: 'var(--space-3)', 
            background: 'var(--success-50)', 
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--success-700)'
          }}>
            <strong>Selected:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </div>
        )}
      </div>

      {isPickingLocation && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--secondary-600)', marginBottom: 'var(--space-2)' }}>
            Click on the map to select a location
          </p>
          <Map
            center={selectedLocation || { lat: 23.8103, lng: 90.4125 }}
            zoom={13}
            markers={selectedLocation ? [{
              lat: selectedLocation.lat,
              lng: selectedLocation.lng,
              title: 'Selected Location'
            }] : []}
            onMapClick={handleMapClick}
          />
        </div>
      )}
    </div>
  );
};

export default LocationPicker;