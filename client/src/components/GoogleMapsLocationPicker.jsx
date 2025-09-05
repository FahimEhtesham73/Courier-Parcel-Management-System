import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden'
};

const GoogleMapsLocationPicker = ({ 
  onLocationSelect, 
  initialLocation, 
  label = "Select Location",
  placeholder = "Search for a location or click on map"
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY',
    libraries
  });

  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [searchValue, setSearchValue] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isPickingMode, setIsPickingMode] = useState(false);
  
  const autocompleteRef = useRef(null);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || place.name
        };
        setSelectedLocation(location);
        setSearchValue(place.formatted_address || place.name);
        if (onLocationSelect) {
          onLocationSelect(location);
        }
        if (map) {
          map.panTo({ lat: location.lat, lng: location.lng });
          map.setZoom(16);
        }
      }
    }
  };

  const onMapClick = useCallback((event) => {
    if (!isPickingMode) return;
    
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    // Reverse geocoding to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const fullLocation = {
          ...location,
          address: results[0].formatted_address
        };
        setSelectedLocation(fullLocation);
        setSearchValue(results[0].formatted_address);
        if (onLocationSelect) {
          onLocationSelect(fullLocation);
        }
      } else {
        const fullLocation = {
          ...location,
          address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        };
        setSelectedLocation(fullLocation);
        setSearchValue(fullLocation.address);
        if (onLocationSelect) {
          onLocationSelect(fullLocation);
        }
      }
    });
  }, [isPickingMode, onLocationSelect]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Reverse geocoding to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const fullLocation = {
                ...location,
                address: results[0].formatted_address
              };
              setSelectedLocation(fullLocation);
              setSearchValue(results[0].formatted_address);
              if (onLocationSelect) {
                onLocationSelect(fullLocation);
              }
              if (map) {
                map.panTo(location);
                map.setZoom(16);
              }
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please search or click on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setSearchValue('');
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  if (!isLoaded) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--secondary-100)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ marginBottom: 'var(--space-2)' }}></div>
          <p>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="location-picker">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h4 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
          </svg>
          {label}
        </h4>
        
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              ref={autocompleteRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="form-input"
              placeholder={placeholder}
              style={{ width: '100%' }}
            />
          </Autocomplete>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="btn btn-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8C9.79 8 8 9.79 8 12S9.79 16 12 16 16 14.21 16 12 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V1H11V3.06C6.83 3.52 3.52 6.83 3.06 11H1V13H3.06C3.52 17.17 6.83 20.48 11 20.94V23H13V20.94C17.17 20.48 20.48 17.17 20.94 13H23V11H20.94ZM12 19C8.13 19 5 15.87 5 12S8.13 5 12 5 19 8.13 19 12 15.87 19 12 19Z" fill="currentColor"/>
            </svg>
            Current Location
          </button>
          <button
            type="button"
            onClick={() => setIsPickingMode(!isPickingMode)}
            className={`btn ${isPickingMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
            </svg>
            {isPickingMode ? 'Stop Picking' : 'Pick on Map'}
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
            border: '1px solid var(--success-200)',
            fontSize: '0.875rem',
            color: 'var(--success-700)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
              <strong>Selected Location:</strong>
            </div>
            <div>{selectedLocation.address}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success-600)', marginTop: 'var(--space-1)' }}>
              Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          </div>
        )}
        
        {isPickingMode && (
          <div style={{ 
            padding: 'var(--space-3)', 
            background: 'var(--primary-50)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--primary-200)',
            fontSize: '0.875rem',
            color: 'var(--primary-700)',
            marginBottom: 'var(--space-3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              Click anywhere on the map to select a location
            </div>
          </div>
        )}
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={selectedLocation || { lat: 23.8103, lng: 90.4125 }}
        zoom={selectedLocation ? 16 : 11}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        }}
      >
        {selectedLocation && (
          <Marker
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            animation={window.google?.maps?.Animation?.BOUNCE}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="#ef4444"/>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(32, 32)
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default GoogleMapsLocationPicker;