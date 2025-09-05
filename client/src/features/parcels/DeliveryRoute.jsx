
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Map from '../../components/Map';

const DeliveryRoute = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [agentLocation, setAgentLocation] = useState(null);
  const [map, setMap] = useState(null);

  const userId = user?.id;
  const userRole = user?.role;

  // Real-time agent location tracking
  useEffect(() => {
    if (userRole !== 'Delivery Agent') return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setAgentLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error getting agent location:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userRole]);

  const fetchRoute = useCallback(async () => {
    if (!userId || !token) return;
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = await axios.get(`/api/parcels/route/${userId}`, config);
      setRoute(response.data.route || []);
    } catch (error) {
      console.error('Error fetching route:', error);
      setRoute([]);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (userId && userRole === 'Delivery Agent') {
      fetchRoute();
    } else {
      setLoading(false);
      setRoute([]);
    }
  }, [userId, userRole, fetchRoute]);

  const optimizeRoute = useCallback(async () => {
    setOptimizing(true);
    try {
      const sorted = [...route].sort((a, b) => {
        if (a.type === 'pickup' && b.type === 'delivery') return -1;
        if (a.type === 'delivery' && b.type === 'pickup') return 1;
        return 0;
      });
      setRoute(sorted);
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setOptimizing(false);
    }
  }, [route]);

  const handleViewOnMap = (stop) => {
    if (map && stop.location) {
      const position = { lat: stop.location.latitude, lng: stop.location.longitude };
      map.panTo(position);
      map.setZoom(15);
    }
  };

  const allMarkers = useMemo(() => {
    if (typeof window.google === 'undefined' || !window.google.maps) return [];
    const size = new window.google.maps.Size(32, 32);
    
    const routeMarkers = route
      .map((stop, index) => {
        if (stop.location && isFinite(stop.location.latitude) && isFinite(stop.location.longitude)) {
          return {
            lat: stop.location.latitude,
            lng: stop.location.longitude,
            title: `${index + 1}. ${stop.type === 'pickup' ? 'Pickup' : 'Delivery'}`,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="${stop.type === 'pickup' ? '#3b82f6' : '#ef4444'}" stroke="white" stroke-width="1"/>
                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
                </svg>
              `)}`,
              scaledSize: size,
            },
          };
        }
        return null;
      })
      .filter(Boolean);

    if (agentLocation) {
      return [
        ...routeMarkers,
        {
          lat: agentLocation.lat,
          lng: agentLocation.lng,
          title: 'Your Location',
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg viewBox="0 0 384 512" fill="#10B981" xmlns="http://www.w3.org/2000/svg">
                <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 01-35.464 0zM192 256a64 64 0 100-128 64 64 0 000 128z"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(28, 36),
          },
        },
      ];
    }

    return routeMarkers;
  }, [route, agentLocation]);

  const mapCenter = useMemo(() => {
    if (agentLocation) return agentLocation;
    
    const firstValidStop = route.find(
      (stop) => stop.location && isFinite(stop.location.latitude) && isFinite(stop.location.longitude)
    );

    if (firstValidStop) {
      return { lat: firstValidStop.location.latitude, lng: firstValidStop.location.longitude };
    }

    return { lat: 23.8103, lng: 90.4125 };
  }, [route, agentLocation]);

  // Effect to draw the route on the map
  useEffect(() => {
    if (!map || route.length < 1 || !agentLocation) return;

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true, // We use our custom markers
      polylineOptions: { strokeColor: '#1d4ed8', strokeWeight: 5, strokeOpacity: 0.8 },
    });

    directionsRenderer.setMap(map);

    const waypoints = route
      .slice(0, -1)
      .map(stop => ({ location: new window.google.maps.LatLng(stop.location.latitude, stop.location.longitude) }));

    const origin = agentLocation;
    const destination = route.length > 0 ? new window.google.maps.LatLng(route[route.length - 1].location.latitude, route[route.length - 1].location.longitude) : origin;

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false, // Route is already optimized
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
        } else {
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );

    // Cleanup
    return () => directionsRenderer.setMap(null);

  }, [map, route, agentLocation]);

  if (!user || user.role !== 'Delivery Agent') {
    return (
      <div className="container"><div className="alert alert-error">You are not authorized to access this page.</div></div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container"><div className="loading-spinner"></div><p>Loading delivery route...</p></div>
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
          <p className="page-subtitle">Your optimized route for today's parcels</p>
        </div>
        <button onClick={optimizeRoute} disabled={optimizing || route.length === 0} className="btn btn-primary">
          {optimizing ? <><div className="loading-spinner"></div>Optimizing...</> : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/></svg>Re-optimize Route</>}
        </button>
      </div>

      {route.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor"/></svg>
          </div>
          <h3>No route available</h3>
          <p>You don't have any active parcels to create a delivery route.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          <div className="card" style={{ height: 'calc(100vh - 200px)' }}>
            <Map center={mapCenter} zoom={12} markers={allMarkers} onLoad={setMap} />
          </div>
          <div className="card" style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Route Steps</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {route.map((stop, index) => (
                  <div key={stop.parcelId + stop.type} style={{ 
                    padding: 'var(--space-4)',
                    background: 'var(--secondary-50)',
                    borderRadius: 'var(--radius-lg)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: stop.type === 'pickup' ? 'var(--primary-500)' : 'var(--error-500)', color: 'white', fontWeight: '600' }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: stop.type === 'pickup' ? 'var(--primary-600)' : 'var(--error-600)' }}>{stop.type}</span>
                        <div style={{ color: 'var(--secondary-800)', fontWeight: 600 }}>{stop.address}</div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Parcel: {stop.parcelId}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                       <button onClick={() => handleViewOnMap(stop)} className="btn btn-secondary btn-sm">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/></svg>
                         View on Map
                       </button>
                       <button onClick={() => window.open(`https://maps.google.com/maps?daddr=${stop.location?.latitude},${stop.location?.longitude}`, '_blank')} className="btn btn-secondary btn-sm" disabled={!stop.location?.latitude}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12ZM14 12L10 15V9L14 12Z" fill="currentColor"/></svg>
                         Navigate
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryRoute;
