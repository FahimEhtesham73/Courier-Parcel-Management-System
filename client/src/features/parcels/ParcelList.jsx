import React, { useEffect } from 'react';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getParcels } from '../parcels/parcelSlice';
import { joinUserRoom } from '../../socket';
import BulkActions from './BulkActions';

const ParcelList = () => {
  const dispatch = useDispatch();
  const { parcels, loading, error, pagination } = useSelector((state) => state.parcels);
  const { user } = useSelector((state) => state.auth);
  const [selectedParcels, setSelectedParcels] = useState([]);

  const handleBulkActionComplete = () => {
    setSelectedParcels([]);
    dispatch(getParcels());
  };

  useEffect(() => {
    if (user) {
      dispatch(getParcels());
      // Join appropriate socket room for real-time updates
      joinUserRoom(user.id, user.role);
    }
  }, [dispatch, user]);

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading parcels...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor" />
          </svg>
          Error: {error}
        </div>
      </div>
    );
  }

  const parcelsList = Array.isArray(parcels) ? parcels : (parcels?.parcels || []);

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor" />
              <path d="M20 6L12 1L4 6L12 11L20 6Z" fill="currentColor" />
              <path d="M20 10V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V10L12 15L20 10Z" fill="currentColor" />
            </svg>
            {user?.role === 'Admin' ? 'All Parcels' : user?.role === 'Delivery Agent' ? 'Assigned Parcels' : 'My Parcels'}
          </h1>
          <p className="page-subtitle">
            {user?.role === 'Admin' ? 'Manage all system parcels' : user?.role === 'Delivery Agent' ? 'Track and update your assigned deliveries' : 'Track and manage your shipments'}
          </p>
        </div>
        {user?.role === 'Customer' && (
          <Link to="/create-parcel" className="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
            </svg>
            Create New Parcel
          </Link>
        )}
        {user?.role === 'Admin' && (
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link to="/create-parcel" className="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
              </svg>
              Create Parcel
            </Link>
            <Link to="/admin/dashboard" className="btn btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
              </svg>
              Dashboard
            </Link>
          </div>
        )}
      </div>
      {parcelsList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg
              width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor" />
              <path d="M20 6L12 1L4 6L12 11L20 6Z" fill="currentColor" />
              <path d="M20 10V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V10L12 15L20 10Z" fill="currentColor" />
            </svg>
          </div>
          <h3>No parcels found</h3>
          <p>
            {user?.role === 'Admin' ? 'No parcels in the system yet.' : user?.role === 'Delivery Agent' ? 'No parcels assigned to you yet.' : 'You haven\'t created any parcels yet.'}
          </p>
          {user?.role === 'Customer' && (
            <Link to="/create-parcel" className="btn btn-primary">
              Create Your First Parcel
            </Link>
          )}
          {user?.role === 'Admin' && (
            <Link to="/create-parcel" className="btn btn-primary">
              Create First Parcel
            </Link>
          )}
        </div>
      ) : (
        <div className="parcels-grid">
          {parcelsList.map((parcel) => (
            <div key={parcel._id} className="parcel-card card">
              <div className="parcel-header">
                <div className="parcel-id">
                  <span className="id-label">Tracking:</span>
                  <span className="id-value">{parcel.trackingNumber || parcel._id.slice(-8)}</span>
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
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor" />
                    </svg>
                    <div>
                      <span className="address-label">From:</span>
                      <span className="address-value">{parcel.pickupAddress}</span>
                    </div>
                  </div>
                  <div className="address-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.01 11H4V13H16.01V16L20 12L16.01 8V11Z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="address-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor" />
                    </svg>
                    <div>
                      <span className="address-label">To:</span>
                      <span className="address-value">{parcel.deliveryAddress}</span>
                    </div>
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
                  {user?.role === 'Admin' && parcel.customer && (
                    <div className="detail-item">
                      <span className="detail-label">Customer:</span>
                      <span className="detail-value">{parcel.customer.username}</span>
                    </div>
                  )}
                  {(user?.role === 'Admin' || user?.role === 'Customer') && parcel.assignedAgent && (
                    <div className="detail-item">
                      <span className="detail-label">Agent:</span>
                      <span className="detail-value">{parcel.assignedAgent.username}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="parcel-actions">
                <Link to={`/parcels/${parcel._id}`} className="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7 17 9.24 17 12 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15 15 13.66 15 12 13.66 9 12 9Z" fill="currentColor" />
                  </svg>
                  View Details
                </Link>
                {(user?.role === 'Admin' || (user?.role === 'Customer' && parcel.customer?._id === user.id)) && (
                  <Link to={`/edit-parcel/${parcel._id}`} className="btn btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
                    </svg>
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {user?.role === 'Admin' && (
        <BulkActions 
          selectedParcels={selectedParcels}
          onActionComplete={handleBulkActionComplete}
        />
      )}
    </div>
  );
};

export default ParcelList;