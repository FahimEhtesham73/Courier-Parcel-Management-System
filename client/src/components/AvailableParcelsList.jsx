import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { acceptParcel } from '../socket';
import axios from 'axios';

const AvailableParcelsList = ({ newAvailableParcels = [] }) => {
  const { user, token } = useSelector((state) => state.auth);
  const [availableParcels, setAvailableParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState({});

  useEffect(() => {
    if (user && user.role === 'Delivery Agent') {
      fetchAvailableParcels();
    }
  }, [user, token]); // Added token to dependencies

  useEffect(() => {
    // Combine fetched parcels with new available parcels, removing duplicates
    const allAvailable = [...availableParcels];
    newAvailableParcels.forEach(newParcel => {
      if (!allAvailable.some(parcel => parcel._id === newParcel._id)) {
        allAvailable.push(newParcel);
      }
    });
    setAvailableParcels(allAvailable);
  }, [newAvailableParcels, availableParcels]); // Add availableParcels here

  const fetchAvailableParcels = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      // Get available parcels
      const response = await axios.get('/api/parcels/available', config);
      setAvailableParcels(response.data.parcels || []);
    } catch (error) {
      console.error('Error fetching available parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptParcel = async (parcelId) => {
    setAccepting({ ...accepting, [parcelId]: true });
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      await axios.put(`/api/parcels/${parcelId}/accept`, {}, config);
      
      // Remove from available list
      setAvailableParcels(prev => prev.filter(p => p._id !== parcelId));
      
      // Use socket for real-time update
      acceptParcel(parcelId, user.id);
      
    } catch (error) {
      console.error('Error accepting parcel:', error);
      alert(error.response?.data?.message || 'Error accepting parcel');
    } finally {
      setAccepting({ ...accepting, [parcelId]: false });
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDistanceFromAgent = (parcel) => {
    if (!user.currentLocation || !parcel.pickupLocation) return null;
    
    return calculateDistance(
      user.currentLocation.latitude,
      user.currentLocation.longitude,
      parcel.pickupLocation.latitude,
      parcel.pickupLocation.longitude
    );
  };

  if (!user || user.role !== 'Delivery Agent') {
    return null;
  }

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p>Loading available parcels...</p>
        </div>
      </div>
    );
  }

  if (availableParcels.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--secondary-400)', marginBottom: 'var(--space-3)' }}>
            <path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
            <path d="M20 6L12 1L4 6L12 11L20 6Z" fill="currentColor"/>
            <path d="M20 10V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V10L12 15L20 10Z" fill="currentColor"/>
          </svg>
          <h3 style={{ color: 'var(--secondary-600)', marginBottom: 'var(--space-2)' }}>No Available Parcels</h3>
          <p style={{ color: 'var(--secondary-500)', margin: 0 }}>
            All parcels are currently assigned. New opportunities will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          Available Parcels ({availableParcels.length})
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {availableParcels.map((parcel) => {
            const distance = getDistanceFromAgent(parcel);
            return (
              <div key={parcel._id} style={{
                padding: 'var(--space-4)',
                border: '1px solid var(--secondary-200)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--secondary-50)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', fontSize: '0.875rem' }}>
                        {parcel.trackingNumber}
                      </span>
                      {distance && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--primary-600)', 
                          background: 'var(--primary-100)', 
                          padding: 'var(--space-1) var(--space-2)', 
                          borderRadius: 'var(--radius-sm)' 
                        }}>
                          {distance.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
                      <strong>From:</strong> {parcel.pickupAddress}
                    </div>
                    <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
                      <strong>To:</strong> {parcel.deliveryAddress}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                      <span><strong>Size:</strong> {parcel.size}</span>
                      <span><strong>Type:</strong> {parcel.type}</span>
                      <span><strong>Payment:</strong> {parcel.paymentMethod}</span>
                      {parcel.paymentMethod === 'COD' && parcel.codAmount > 0 && (
                        <span style={{ color: 'var(--warning-600)', fontWeight: '600' }}>
                          <strong>COD:</strong> ৳{parcel.codAmount}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAcceptParcel(parcel._id)}
                    disabled={accepting[parcel._id]}
                    className="btn btn-success"
                    style={{ minWidth: '120px' }}
                  >
                    {accepting[parcel._id] ? (
                      <>
                        <div className="loading-spinner"></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                        </svg>
                        Accept Delivery
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AvailableParcelsList;