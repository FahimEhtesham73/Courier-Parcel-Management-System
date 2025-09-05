import React, { useState } from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import socket from '../../socket';
import axios from 'axios';
import Map from '../../components/Map';

const TrackParcel = () => {
  const { user } = useSelector((state) => state.auth);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentLocation, setAgentLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  
  useEffect(() => {
    if (trackingInfo && user) {
      // Listen for real-time agent location updates
      socket.on('agentLocationUpdate', (data) => {
        if (data.parcelId === trackingInfo._id) {
          setAgentLocation(data.agentLocation);
        }
      });
      
      return () => {
        socket.off('agentLocationUpdate');
      };
    }
  }, [trackingInfo, user]);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackingInfo(null);

    try {
      const response = await axios.get(`/api/parcels/track/${trackingNumber.trim()}`);
      setTrackingInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Parcel not found');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status, completed) => {
    if (completed) {
      return (
        <div className="timeline-icon completed">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
          </svg>
        </div>
      );
    } else {
      return <div className="timeline-icon pending"></div>;
    }
  };

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
            </svg>
            Track Your Parcel
          </h1>
          <p className="page-subtitle">Enter your tracking number to get real-time updates</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ padding: 'var(--space-8)' }}>
          <form onSubmit={handleTrack} style={{ marginBottom: 'var(--space-8)' }}>
            <div className="form-group">
              <label htmlFor="trackingNumber" className="form-label">
                Tracking Number
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <input
                  type="text"
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="form-input"
                  placeholder="Enter tracking number (e.g., CP1234567890)"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.5 14H20.5L22 15.5V20.5L20.5 22H15.5L14 20.5V15.5L15.5 14ZM18 16V19H17V16H18ZM16 16V19H15V16H16ZM12 2C6.48 2 2 6.48 2 12S6.48 22 12 22C13.18 22 14.32 21.8 15.38 21.44L14.54 20.6C13.75 20.86 12.89 21 12 21C7.03 21 3 16.97 3 12S7.03 3 12 3 21 7.03 21 12C21 12.89 20.86 13.75 20.6 14.54L21.44 15.38C21.8 14.32 22 13.18 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor"/>
                      </svg>
                      Track
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          {trackingInfo && (
            <div className="tracking-results">
              <div className="tracking-header" style={{ marginBottom: 'var(--space-6)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                    <path d="M20 6L12 1L4 6L12 11L20 6Z" fill="currentColor"/>
                    <path d="M20 10V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V10L12 15L20 10Z" fill="currentColor"/>
                  </svg>
                  Tracking: {trackingInfo.trackingNumber}
                </h3>
                <div className={`status-badge status-${trackingInfo.status.toLowerCase().replace(' ', '-')}`}>
                  <div className="status-dot"></div>
                  {trackingInfo.status}
                </div>
              </div>

              <div className="tracking-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                <div>
                  <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--secondary-700)' }}>Pickup Address</h4>
                  <p style={{ margin: 0, color: 'var(--secondary-800)' }}>{trackingInfo.pickupAddress}</p>
                  {trackingInfo.pickupContactName && (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary-600)', marginTop: 'var(--space-1)' }}>
                      Contact: {trackingInfo.pickupContactName}
                    </p>
                  )}
                </div>
                <div>
                  <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--secondary-700)' }}>Delivery Address</h4>
                  <p style={{ margin: 0, color: 'var(--secondary-800)' }}>{trackingInfo.deliveryAddress}</p>
                  {trackingInfo.recipientName && (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary-600)', marginTop: 'var(--space-1)' }}>
                      Recipient: {trackingInfo.recipientName}
                    </p>
                  )}
                </div>
                {trackingInfo.estimatedDelivery && (
                  <div>
                    <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--secondary-700)' }}>Estimated Delivery</h4>
                    <p style={{ margin: 0, color: 'var(--secondary-800)' }}>
                      {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {trackingInfo.actualDelivery && (
                  <div>
                    <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--secondary-700)' }}>Delivered On</h4>
                    <p style={{ margin: 0, color: 'var(--success-600)', fontWeight: '600' }}>
                      {new Date(trackingInfo.actualDelivery).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="tracking-timeline">
                <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--secondary-700)' }}>Tracking Timeline</h4>
                <div className="timeline">
                  {trackingInfo.timeline.map((item, index) => (
                    <div key={index} className={`timeline-item ${item.completed ? 'completed' : 'pending'}`}>
                      {getStatusIcon(item.status, item.completed)}
                      <div className="timeline-content">
                        <h5 style={{ margin: 0, marginBottom: 'var(--space-1)', color: item.completed ? 'var(--success-700)' : 'var(--secondary-500)' }}>
                          {item.status}
                        </h5>
                        {item.timestamp && (
                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary-500)' }}>
                            {new Date(item.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {trackingInfo.assignedAgent && trackingInfo.assignedAgent.currentLocation && (
                <div className="agent-location" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ marginBottom: 'var(--space-2)', color: 'var(--primary-700)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                      <path d="M18 8H20L23 12V17H21C21 18.66 19.66 20 18 20S15 18.66 15 17H9C9 18.66 7.66 20 6 20S3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5ZM18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5Z" fill="currentColor"/>
                    </svg>
                    Delivery Agent: {trackingInfo.assignedAgent.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: 'var(--primary-600)', fontSize: '0.875rem' }}>
                        <strong>Current Location:</strong>
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                        {(agentLocation || trackingInfo.assignedAgent.currentLocation).latitude.toFixed(6)}, {(agentLocation || trackingInfo.assignedAgent.currentLocation).longitude.toFixed(6)}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--success-600)', marginTop: 'var(--space-1)' }}>
                        🟢 Live tracking active
                      </p>
                    </div>
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.875rem', padding: 'var(--space-2) var(--space-3)' }}
                    >
                      {showMap ? 'Hide Map' : 'Show on Map'}
                    </button>
                  </div>
                  
                  {showMap && (
                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <Map
                        center={{
                          lat: (agentLocation || trackingInfo.assignedAgent.currentLocation).latitude,
                          lng: (agentLocation || trackingInfo.assignedAgent.currentLocation).longitude
                        }}
                        zoom={15}
                        markers={[
                          {
                            lat: (agentLocation || trackingInfo.assignedAgent.currentLocation).latitude,
                            lng: (agentLocation || trackingInfo.assignedAgent.currentLocation).longitude,
                            title: 'Delivery Agent Location',
                            infoWindow: `<div><strong>${trackingInfo.assignedAgent.name}</strong><br/>Current Location</div>`
                          }
                        ]}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .timeline {
          position: relative;
          padding-left: var(--space-8);
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 12px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--secondary-200);
        }

        .timeline-item {
          position: relative;
          margin-bottom: var(--space-6);
        }

        .timeline-item:last-child {
          margin-bottom: 0;
        }

        .timeline-icon {
          position: absolute;
          left: -32px;
          top: 2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .timeline-icon.completed {
          background: var(--success-500);
          color: white;
        }

        .timeline-icon.pending {
          background: var(--secondary-300);
          border: 3px solid white;
        }

        .timeline-content {
          padding-left: var(--space-2);
        }
      `}</style>
    </div>
  );
};

export default TrackParcel;