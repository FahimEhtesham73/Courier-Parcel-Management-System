import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../users/userSlice';
import axios from 'axios';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);
  const { token } = useSelector((state) => state.auth);
  const [filter, setFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers(filter));
  }, [dispatch, filter]);

  const handleUserAction = async (userId, action) => {
    setActionLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      let endpoint = '';
      let data = {};
      
      switch (action) {
        case 'activate':
          endpoint = `/api/admin/users/${userId}/activate`;
          break;
        case 'deactivate':
          endpoint = `/api/admin/users/${userId}/deactivate`;
          break;
        case 'verify':
          endpoint = `/api/admin/users/${userId}/verify`;
          break;
        case 'unverify':
          endpoint = `/api/admin/users/${userId}/unverify`;
          break;
        default:
          throw new Error('Invalid action');
      }
      
      await axios.put(endpoint, data, config);
      dispatch(fetchUsers(filter)); // Refresh the list
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error performing user action:', error);
      alert(error.response?.data?.message || 'Error performing action');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 17H6V15.5C6 13.83 9.33 13 12 13S18 13.83 18 15.5V17Z" fill="currentColor"/>
          </svg>
        );
      case 'Delivery Agent':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8H20L23 12V17H21C21 18.66 19.66 20 18 20S15 18.66 15 17H9C9 18.66 7.66 20 6 20S3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5ZM18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5Z" fill="currentColor"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
          </svg>
        );
    }
  };

  const getStatusBadge = (user) => {
    if (!user.isActive) {
      return <span className="status-badge status-failed">Inactive</span>;
    }
    if (user.role === 'Delivery Agent' && !user.isVerified) {
      return <span className="status-badge status-pending">Unverified</span>;
    }
    return <span className="status-badge status-delivered">Active</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12 12 10.2 12 8 13.8 4 16 4ZM16 14C20.4 14 24 15.8 24 18V20H8V18C8 15.8 11.6 14 16 14ZM12.5 11.5C10.3 11.5 8.5 9.7 8.5 7.5S10.3 3.5 12.5 3.5 16.5 5.3 16.5 7.5 14.7 11.5 12.5 11.5ZM12.5 13C16.9 13 20.5 14.8 20.5 17V19H4.5V17C4.5 14.8 8.1 13 12.5 13Z" fill="currentColor"/>
            </svg>
            User Management
          </h1>
          <p className="page-subtitle">Manage system users and their permissions</p>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-select"
        >
          <option value="">All Users</option>
          <option value="Customer">Customers</option>
          <option value="Delivery Agent">Delivery Agents</option>
          <option value="Admin">Admins</option>
        </select>
      </div>

      <div className="parcels-grid">
        {users.map((user) => (
          <div key={user._id} className="parcel-card card">
            <div className="parcel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--primary-500)',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--secondary-800)' }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>
                    {user.email}
                  </div>
                </div>
              </div>
              {getStatusBadge(user)}
            </div>

            <div className="parcel-content">
              <div className="parcel-details">
                <div className="detail-item">
                  <span className="detail-label">Role:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    {getRoleIcon(user.role)}
                    <span className="detail-value">{user.role}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{user.phone || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Joined:</span>
                  <span className="detail-value">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {user.role === 'Delivery Agent' && user.currentLocation && (
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value" style={{ fontSize: '0.75rem' }}>
                      {user.currentLocation.latitude.toFixed(4)}, {user.currentLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="parcel-actions">
              <button
                onClick={() => {
                  setSelectedUser(user);
                  setShowModal(true);
                }}
                className="btn btn-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12S19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12S4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z" fill="currentColor"/>
                </svg>
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* User Management Modal */}
      {showModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-4)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3>Manage User: {selectedUser.username}</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Email:</span>
                  <p style={{ margin: 0 }}>{selectedUser.email}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Role:</span>
                  <p style={{ margin: 0 }}>{selectedUser.role}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Status:</span>
                  <p style={{ margin: 0 }}>{selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Verified:</span>
                  <p style={{ margin: 0 }}>{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {selectedUser.isActive ? (
                <button
                  onClick={() => handleUserAction(selectedUser._id, 'deactivate')}
                  disabled={actionLoading}
                  className="btn btn-error"
                >
                  {actionLoading ? 'Processing...' : 'Deactivate User'}
                </button>
              ) : (
                <button
                  onClick={() => handleUserAction(selectedUser._id, 'activate')}
                  disabled={actionLoading}
                  className="btn btn-success"
                >
                  {actionLoading ? 'Processing...' : 'Activate User'}
                </button>
              )}
              
              {selectedUser.role === 'Delivery Agent' && (
                selectedUser.isVerified ? (
                  <button
                    onClick={() => handleUserAction(selectedUser._id, 'unverify')}
                    disabled={actionLoading}
                    className="btn btn-warning"
                  >
                    {actionLoading ? 'Processing...' : 'Remove Verification'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserAction(selectedUser._id, 'verify')}
                    disabled={actionLoading}
                    className="btn btn-success"
                  >
                    {actionLoading ? 'Processing...' : 'Verify Agent'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;