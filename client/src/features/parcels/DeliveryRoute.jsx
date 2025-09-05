import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Map from '../../components/Map';

const DeliveryRoute = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (user && user.role === 'Delivery Agent') {
      fetchRoute();
    }
  }, [user]);

  const fetchRoute = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`/api/parcels/route/${user.id}`, config);
      setRoute(response.data.route || []);
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = async () => {
    setOptimizing(true);
    try {
      // In a real implementation, this would call Google Maps Directions API
      // For now, we'll just sort by type (pickups first, then deliveries)
      const optimized = [...route].sort((a, b) => {
        if (a.type === 'pickup' && b.type === 'delivery') return -1;
        if (a.type === 'delivery' && b.type === 'pickup') return 1;
        return 0;
      });
      setRoute(optimized);
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const getRouteMarkers = () => {
    return route.map((stop, index) => ({
      lat: stop.location?.latitude || 23.8103,
      lng: stop.location?.longitude || 90.4125,
      title: `${index + 1}. ${stop.type === 'pickup' ? 'Pickup' : 'Delivery'}`,
      infoWindow: `
        <div>
          <strong>${stop.type === 'pickup' ? 'Pickup' : 'Delivery'} #${index + 1}</strong><br/>
          ${stop.address}<br/>
          Parcel: ${stop.parcelId}
        </div>
      `,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${stop.type === 'pickup' ? '#3b82f6' : '#ef4444'}"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(32, 32)
      }
    }));
  };

  const getMapCenter = () => {
    if (route.length > 0 && route[0].location) {
      return {
        lat: route[0].location.latitude,
        lng: route[0].location.longitude
      };
    }
    return { lat: 23.8103, lng: 90.4125 };
  };

  if (!user || user.role !== 'Delivery Agent') {
    return (
      <div className="container">
        <div className="alert alert-error">
          You are not authorized to access this page.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading delivery route...</p>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor"/>
            </svg>
            Delivery Route
          </h1>
          <p className="page-subtitle">Optimized route for your assigned parcels</p>
        </div>
        
        <button
          onClick={optimizeRoute}
          disabled={optimizing || route.length === 0}
          className="btn btn-primary"
        >
          {optimizing ? (
            <>
              <div className="loading-spinner"></div>
              Optimizing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
              Optimize Route
            </>
          )}
        </button>
      </div>

      {route.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor"/>
            </svg>
          </div>
          <h3>No route available</h3>
          <p>You don't have any active parcels to create a delivery route.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Route Map</h3>
              <Map
                center={getMapCenter()}
                zoom={12}
                markers={getRouteMarkers()}
              />
            </div>
          </div>

          <div className="card">
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Route Steps</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {route.map((stop, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'var(--secondary-50)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--secondary-200)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: stop.type === 'pickup' ? 'var(--primary-500)' : 'var(--error-500)',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      {index + 1}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          textTransform: 'uppercase',
                          color: stop.type === 'pickup' ? 'var(--primary-600)' : 'var(--error-600)'
                        }}>
                          {stop.type}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>
                          Parcel: {stop.parcelId}
                        </span>
                      </div>
                      <div style={{ color: 'var(--secondary-800)' }}>
                        {stop.address}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => window.open(`https://maps.google.com/maps?q=${stop.location?.latitude},${stop.location?.longitude}`, '_blank')}
                      className="btn btn-secondary"
                      disabled={!stop.location?.latitude || !stop.location?.longitude}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
                      </svg>
                      Navigate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryRoute;