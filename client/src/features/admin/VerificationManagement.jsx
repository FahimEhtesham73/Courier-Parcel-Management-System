import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const VerificationManagement = () => {
  const { token } = useSelector((state) => state.auth);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    rejectionReason: ''
  });
  const [filter, setFilter] = useState('Pending');

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const url = filter && filter !== '' ? `/api/agent-verification/all?status=${filter}` : '/api/agent-verification/all';
      const response = await axios.get(url, config);
      console.log('Fetched verifications:', response.data);
      setVerifications(response.data);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      await axios.put(
        `/api/agent-verification/review/${selectedVerification._id}`,
        reviewData,
        config
      );
      
      alert(`Verification ${reviewData.status.toLowerCase()} successfully!`);
      setReviewModal(false);
      setSelectedVerification(null);
      setReviewData({ status: '', rejectionReason: '' });
      fetchVerifications();
    } catch (error) {
      console.error('Error reviewing verification:', error);
      alert(error.response?.data?.message || 'Error reviewing verification');
    }
  };

  const openReviewModal = (verification) => {
    setSelectedVerification(verification);
    setReviewData({ status: '', rejectionReason: '' });
    setReviewModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved': return 'status-badge status-delivered';
      case 'Rejected': return 'status-badge status-failed';
      default: return 'status-badge status-pending';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading verification requests...</p>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 17H6V15.5C6 13.83 9.33 13 12 13S18 13.83 18 15.5V17Z" fill="currentColor"/>
            </svg>
            Agent Verification Management
          </h1>
          <p className="page-subtitle">Review and approve delivery agent verification requests</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button
            onClick={fetchVerifications}
            className="btn btn-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {verifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="currentColor"/>
            </svg>
          </div>
          <h3>No verification requests found</h3>
          <p>
            {filter && filter !== '' ? `No ${filter.toLowerCase()} verification requests` : 'No verification requests'} found.
            {!filter || filter === '' ? ' Delivery agents need to submit verification documents first.' : ''}
          </p>
          <button
            onClick={fetchVerifications}
            className="btn btn-primary"
            style={{ marginTop: 'var(--space-4)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
            </svg>
            Refresh List
          </button>
        </div>
      ) : (
        <div className="parcels-grid">
          {verifications.map((verification) => (
            <div key={verification._id} className="parcel-card card">
              <div className="parcel-header">
                <div className="parcel-id">
                  <span className="id-label">Agent:</span>
                  <span className="id-value">{verification.agent.username}</span>
                </div>
                <div className={getStatusBadgeClass(verification.status)}>
                  <div className="status-dot"></div>
                  {verification.status}
                </div>
              </div>

              <div className="parcel-content">
                <div className="parcel-details">
                  <div className="detail-item">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">{verification.personalInfo.fullName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">NID Number:</span>
                    <span className="detail-value">{verification.personalInfo.nidNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{verification.agent.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{verification.agent.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submitted:</span>
                    <span className="detail-value">
                      {new Date(verification.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {verification.reviewedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Reviewed:</span>
                      <span className="detail-value">
                        {new Date(verification.reviewedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{verification.personalInfo.address}</span>
                  </div>
                </div>

                {verification.personalInfo.emergencyContact.name && (
                  <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--secondary-50)', borderRadius: 'var(--radius-md)' }}>
                    <h5 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--secondary-700)' }}>Emergency Contact</h5>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      {verification.personalInfo.emergencyContact.name} ({verification.personalInfo.emergencyContact.relation})
                      <br />
                      {verification.personalInfo.emergencyContact.phone}
                    </p>
                  </div>
                )}

                {verification.rejectionReason && (
                  <div style={{ marginTop: 'var(--space-4)' }} className="alert alert-error">
                    <strong>Rejection Reason:</strong> {verification.rejectionReason}
                  </div>
                )}
              </div>

              <div className="parcel-actions">
                <button
                  onClick={() => setSelectedVerification(verification)}
                  className="btn btn-secondary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7 17 9.24 17 12 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15 15 13.66 15 12 13.66 9 12 9Z" fill="currentColor"/>
                  </svg>
                  View Documents
                </button>
                
                {verification.status === 'Pending' && (
                  <button
                    onClick={() => openReviewModal(verification)}
                    className="btn btn-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                    </svg>
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document View Modal */}
      {selectedVerification && !reviewModal && (
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
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3>Documents - {selectedVerification.personalInfo.fullName}</h3>
              <button
                onClick={() => setSelectedVerification(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
              <div>
                <h4>NID Front</h4>
                {selectedVerification.documents.nidFront ? (
                  <div>
                    <img 
                      src={selectedVerification.documents.nidFront} 
                      alt="NID Front" 
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--secondary-200)' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--error-500)', border: '1px dashed var(--error-300)', borderRadius: 'var(--radius-md)' }}>
                      Error loading image
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--secondary-500)', border: '1px dashed var(--secondary-300)', borderRadius: 'var(--radius-md)' }}>
                    No image uploaded
                  </div>
                )}
              </div>
              
              <div>
                <h4>NID Back</h4>
                {selectedVerification.documents.nidBack ? (
                  <div>
                    <img 
                      src={selectedVerification.documents.nidBack} 
                      alt="NID Back" 
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--secondary-200)' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--error-500)', border: '1px dashed var(--error-300)', borderRadius: 'var(--radius-md)' }}>
                      Error loading image
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--secondary-500)', border: '1px dashed var(--secondary-300)', borderRadius: 'var(--radius-md)' }}>
                    No image uploaded
                  </div>
                )}
              </div>
              
              <div>
                <h4>Profile Photo</h4>
                {selectedVerification.documents.photo ? (
                  <div>
                    <img 
                      src={selectedVerification.documents.photo} 
                      alt="Profile" 
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--secondary-200)' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--error-500)', border: '1px dashed var(--error-300)', borderRadius: 'var(--radius-md)' }}>
                      Error loading image
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--secondary-500)', border: '1px dashed var(--secondary-300)', borderRadius: 'var(--radius-md)' }}>
                    No image uploaded
                  </div>
                )}
              </div>
              
              {selectedVerification.documents.drivingLicense && (
                <div>
                  <h4>Driving License</h4>
                  <div>
                    <img 
                      src={selectedVerification.documents.drivingLicense} 
                      alt="Driving License" 
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--secondary-200)' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--error-500)', border: '1px dashed var(--error-300)', borderRadius: 'var(--radius-md)' }}>
                      Error loading image
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && selectedVerification && (
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
              <h3>Review Verification</h3>
              <button
                onClick={() => setReviewModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <p style={{ marginBottom: 'var(--space-6)' }}>
              Review verification request for <strong>{selectedVerification.personalInfo.fullName}</strong>
            </p>
            
            <div className="form-group">
              <label className="form-label">Decision *</label>
              <select
                value={reviewData.status}
                onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Select Decision</option>
                <option value="Approved">Approve</option>
                <option value="Rejected">Reject</option>
              </select>
            </div>
            
            {reviewData.status === 'Rejected' && (
              <div className="form-group">
                <label className="form-label">Rejection Reason *</label>
                <textarea
                  value={reviewData.rejectionReason}
                  onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
                  className="form-input"
                  rows="4"
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button
                onClick={() => setReviewModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewData.status || (reviewData.status === 'Rejected' && !reviewData.rejectionReason)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationManagement;