
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const Map = ({ center, zoom = 10, markers = [], onMapClick }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyACZ7voFuBSU0-_dlULUaFl_L1xCjrP1j8'
  });

  const [map, setMap] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    // Clean up markers
    mapMarkers.forEach(marker => marker.setMap(null));
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && markers.length > 0) {
      // Clear existing markers
      mapMarkers.forEach(marker => marker.setMap(null));
      
      // Add new markers
      const newMarkers = markers.map(markerData => {
        const marker = new window.google.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map: map,
          title: markerData.title || '',
          icon: markerData.icon || null
        });
        
        if (markerData.infoWindow) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: markerData.infoWindow
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
        
        return marker;
      });
      
      setMapMarkers(newMarkers);
    }
  }, [map, markers]);

  const handleMapClick = useCallback((event) => {
    if (onMapClick) {
      onMapClick({
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      });
    }
  }, [onMapClick]);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
    >
      {/* Markers are handled programmatically */}
    </GoogleMap>
  ) : (
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
        <p>Loading Map...</p>
      </div>
    </div>
  );
};

export default Map;