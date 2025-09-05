import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getParcels, updateParcelStatus } from './parcelSlice';
import AvailableParcelsList from '../../components/AvailableParcelsList';
import socket from '../../socket';
import axios from 'axios';

const AgentParcelList = () => {
  const dispatch = useDispatch();
  const { parcels, loading, error } = useSelector((state) => state.parcels);
  const { user, token } = useSelector((state) => state.auth);
  
  const [newAvailableParcels, setNewAvailableParcels] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (user && user.role === 'Delivery Agent') {
      dispatch(getParcels());
    }
  }, [dispatch, user]);

  useEffect(() => {
    socket.on('newParcelAvailable', (data) => {
      console.log('New parcel available:', data.parcel);
 setNewAvailableParcels(prevParcels => [...prevParcels, data.parcel]);
    });

    return () => socket.off('newParcelAvailable');
  }, [socket]);

  const handleStatusChange = (parcelId, newStatus) => {
    setStatusUpdates({ ...statusUpdates, [parcelId]: newStatus });
  };

  const handleUpdateStatus = async (parcelId) => {
    const newStatus = statusUpdates[parcelId];
    const failureReason = statusUpdates[`${parcelId}_reason`];
    
    if (newStatus) {
      try {
        const updateData = { id: parcelId, status: newStatus };
        if (newStatus === 'Failed' && failureReason) {
          updateData.failureReason = failureReason;
        }
        
        await dispatch(updateParcelStatus(updateData)).unwrap();
        // Clear the status update after successful update
        const newUpdates = { ...statusUpdates };
        delete newUpdates[parcelId];
        delete newUpdates[`${parcelId}_reason`];
        setStatusUpdates(newUpdates);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  const updateAgentLocation = async (latitude, longitude) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.put('/api/users/location', { latitude, longitude }, config);
      setCurrentLocation({ latitude, longitude });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleStartTracking = () => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateAgentLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
      setWatchId(id);
      setIsTracking(true);
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleStopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-badge status-pending';
      case 'picked up': return 'status-badge status-picked-up';
      case 'in transit': return 'status-badge status-in-transit';
      case 'delivered': return 'status-badge status-delivered';
      case 'failed': return 'status-badge status-failed';
      default: return 'status-badge';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'Pending': return 'Picked Up';
      case 'Picked Up': return 'In Transit';
      case 'In Transit': return 'Delivered';
      default: return currentStatus;
    }
  };

  if (!user || user.role !== 'Delivery Agent') {
    return (
      <div className="container">
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="currentColor"/>
          </svg>
          You are not authorized to view this page.
        </div>
      </div>
    );
  }

  if (!user.isVerified) {
    return (
      <div className="container">
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
          </svg>
          You must be verified by an admin before you can accept deliveries.
        </div>
        <div className="card">
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--warning-500)', marginBottom: 'var(--space-4)' }}>
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 17H6V15.5C6 13.83 9.33 13 12 13S18 13.83 18 15.5V17Z" fill="currentColor"/>
            </svg>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Verification Required</h3>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--secondary-600)' }}>
              Complete your verification process to start accepting deliveries and accessing all agent features.
            </p>
            <a href="/agent/verification" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 17H6V15.5C6 13.83 9.33 13 12 13S18 13.83 18 15.5V17Z" fill="currentColor"/>
              </svg>
              Complete Verification
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading assigned parcels...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8H20L23 12V17H21C21 18.66 19.66 20 18 20S15 18.66 15 17H9C9 18.66 7.66 20 6 20S3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5ZM18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5Z" fill="currentColor"/>
            </svg>
            My Deliveries
          </h1>
          <p className="page-subtitle">Manage your assigned parcels and deliveries</p>
        </div>
        <div className="tracking-controls">
          {isTracking ? (
            <button onClick={handleStopTracking} className="btn btn-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM16 16H8V8H16V16Z" fill="currentColor"/>
              </svg>
              Stop Tracking
            </button>
          ) : (
            <button onClick={handleStartTracking} className="btn btn-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
              </svg>
              Start Tracking
            </button>
          )}
        </div>
      </div>

      {currentLocation && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
          </svg>
          Location tracking active: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
        </div>
      )}

      <AvailableParcelsList newAvailableParcels={newAvailableParcels} />

      {!parcels || (Array.isArray(parcels) ? parcels.length === 0 : (parcels.parcels || []).length === 0) ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8H20L23 12V17H21C21 18.66 19.66 20 18 20S15 18.66 15 17H9C9 18.66 7.66 20 6 20S3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5ZM18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5Z" fill="currentColor"/>
            </svg>
          </div>
          <h3>No parcels assigned</h3>
          <p>You don't have any parcels assigned for delivery yet.</p>
        </div>
      ) : (
        <div className="parcels-grid">
          {(Array.isArray(parcels) ? parcels : parcels.parcels || []).map((parcel) => (
            <div key={parcel._id} className="parcel-card card">
              <div className="parcel-header">
                <div className="parcel-id">
                  <span className="id-label">ID:</span>
                  <span className="id-value">{parcel._id.slice(-8)}</span>
                </div>
                <div className={getStatusBadgeClass(parcel.status)}>
                  <div className="status-dot"></div>
                  {parcel.status}
                </div>
              </div>

              <div className="parcel-content">
                <div className="address-section">
                  <div className="address-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
                    </svg>
                    <div>
                      <span className="address-label">Pickup:</span>
                      <span className="address-value">{parcel.pickupAddress}</span>
                    </div>
                  </div>
                  <div className="address-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.01 11H4V13H16.01V16L20 12L16.01 8V11Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="address-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                    </svg>
                    <div>
                      <span className="address-label">Delivery:</span>
                      <span className="address-value">{parcel.deliveryAddress}</span>
                    </div>
                    {parcel.pickupContactName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary-500)', marginTop: 'var(--space-1)' }}>
                        Contact: {parcel.pickupContactName} ({parcel.pickupContactPhone})
                      </div>
                    )}
                    {parcel.recipientName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary-500)', marginTop: 'var(--space-1)' }}>
                        Recipient: {parcel.recipientName} ({parcel.recipientPhone})
                      </div>
                    )}
                  </div>
                </div>

                <div className="parcel-details">
                  <div className="detail-item">
                    <span className="detail-label">Size:</span>
                    <span className="detail-value">{parcel.size}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{parcel.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment:</span>
                    <span className="detail-value">{parcel.paymentMethod}</span>
                  </div>
                  {parcel.paymentMethod === 'COD' && parcel.codAmount > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">COD Amount:</span>
                      <span className="detail-value">৳{parcel.codAmount}</span>
                    </div>
                  )}
                  {parcel.customer && (
                    <div className="detail-item">
                      <span className="detail-label">Customer:</span>
                      <span className="detail-value">{parcel.customer.username}</span>
                    </div>
                  )}
                  {(parcel.fragile || parcel.urgent) && (
                    <div className="detail-item">
                      <span className="detail-label">Special:</span>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {parcel.fragile && (
                          <span style={{ fontSize: '0.75rem', padding: 'var(--space-1)', background: 'var(--error-100)', color: 'var(--error-700)', borderRadius: 'var(--radius-sm)' }}>
                            FRAGILE
                          </span>
                        )}
                        {parcel.urgent && (
                          <span style={{ fontSize: '0.75rem', padding: 'var(--space-1)', background: 'var(--warning-100)', color: 'var(--warning-700)', borderRadius: 'var(--radius-sm)' }}>
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {parcel.status !== 'Delivered' && parcel.status !== 'Failed' && (
                  <div className="status-update-section">
                    <div className="form-group">
                      <label className="form-label">Update Status:</label>
                      <select
                        className="form-select"
                        value={statusUpdates[parcel._id] || ''}
                        onChange={(e) => handleStatusChange(parcel._id, e.target.value)}
                      >
                        <option value="">Select new status</option>
                        {parcel.status === 'Pending' && <option value="Picked Up">Picked Up</option>}
                        {parcel.status === 'Picked Up' && <option value="In Transit">In Transit</option>}
                        {parcel.status === 'In Transit' && (
                          <>
                            <option value="Delivered">Delivered</option>
                            <option value="Failed">Failed</option>
                          </>
                        )}
                      </select>
                    </div>
                    
                    {statusUpdates[parcel._id] === 'Failed' && (
                      <div className="form-group">
                        <label className="form-label">Failure Reason:</label>
                        <textarea
                          className="form-select"
                          rows="3"
                          placeholder="Please provide details about why delivery failed..."
                          onChange={(e) => setStatusUpdates({
                            ...statusUpdates,
                            [`${parcel._id}_reason`]: e.target.value
                          })}
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleUpdateStatus(parcel._id)}
                      disabled={!statusUpdates[parcel._id] || (statusUpdates[parcel._id] === 'Failed' && !statusUpdates[`${parcel._id}_reason`])}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 'var(--space-2)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                      </svg>
                      Update Status
                    </button>
                  </div>
                )}
                
                {parcel.specialInstructions && (
                  <div style={{ 
                    marginTop: 'var(--space-4)', 
                    padding: 'var(--space-3)', 
                    background: 'var(--primary-50)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--primary-200)'
                  }}>
                    <h5 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--primary-700)' }}>Special Instructions:</h5>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary-600)' }}>
                      {parcel.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentParcelList;