import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { updateUserVerification } from '../auth/authSlice';

const AgentVerification = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    documents: {
      nidFront: '',
      nidBack: '',
      drivingLicense: '',
      photo: ''
    },
    personalInfo: {
      fullName: '',
      nidNumber: '',
      address: '',
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      }
    }
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get('/api/agent-verification/status', config);
      
      if (response.data.hasSubmitted) {
        setVerification(response.data.verification);
        setHasSubmitted(true);
        
        // Update user verification status in Redux store
        if (response.data.verification.status === 'Approved') {
          dispatch(updateUserVerification(true));
        }
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('documents.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [field]: value
        }
      }));
    } else if (name.startsWith('personalInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value
        }
      }));
    } else if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          emergencyContact: {
            ...prev.personalInfo.emergencyContact,
            [field]: value
          }
        }
      }));
    } else {
      // Handle direct form fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      console.log(`Uploading ${field}:`, file.name, file.size, file.type);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log(`${field} loaded successfully`);
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [field]: event.target.result
          }
        }));
      };
      reader.onerror = () => {
        console.error(`Error reading ${field}`);
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add personal info fields directly
      submitData.append('fullName', formData.personalInfo.fullName);
      submitData.append('nidNumber', formData.personalInfo.nidNumber);
      submitData.append('address', formData.personalInfo.address);
      submitData.append('emergencyName', formData.personalInfo.emergencyContact.name);
      submitData.append('emergencyPhone', formData.personalInfo.emergencyContact.phone);
      submitData.append('emergencyRelation', formData.personalInfo.emergencyContact.relation);
      
      // Add document files if they exist as base64
      if (formData.documents.nidFront) {
        const nidFrontFile = dataURLtoFile(formData.documents.nidFront, 'nid-front.jpg');
        submitData.append('nidFront', nidFrontFile);
      }
      
      if (formData.documents.nidBack) {
        const nidBackFile = dataURLtoFile(formData.documents.nidBack, 'nid-back.jpg');
        submitData.append('nidBack', nidBackFile);
      }
      
      if (formData.documents.photo) {
        const photoFile = dataURLtoFile(formData.documents.photo, 'photo.jpg');
        submitData.append('photo', photoFile);
      }
      
      if (formData.documents.drivingLicense) {
        const licenseFile = dataURLtoFile(formData.documents.drivingLicense, 'license.jpg');
        submitData.append('drivingLicense', licenseFile);
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      await axios.post('/api/agent-verification/submit', submitData, config);
      
      alert('Verification documents submitted successfully!');
      fetchVerificationStatus();
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert(error.response?.data?.message || 'Error submitting verification documents');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to convert base64 to File object
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
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
        <p>Loading verification status...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'var(--success-600)';
      case 'Rejected': return 'var(--error-600)';
      default: return 'var(--warning-600)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
          </svg>
        );
      case 'Rejected':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
        );
    }
  };

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 17H6V15.5C6 13.83 9.33 13 12 13S18 13.83 18 15.5V17Z" fill="currentColor"/>
            </svg>
            Agent Verification
          </h1>
          <p className="page-subtitle">Complete your verification to start accepting deliveries</p>
        </div>
      </div>

      {hasSubmitted ? (
        <div className="card">
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: `${getStatusColor(verification.status)}20`,
              color: getStatusColor(verification.status),
              marginBottom: 'var(--space-6)'
            }}>
              {getStatusIcon(verification.status)}
            </div>
            
            <h2 style={{ marginBottom: 'var(--space-4)', color: getStatusColor(verification.status) }}>
              Verification {verification.status}
            </h2>
            
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{ marginBottom: 'var(--space-2)' }}>
                <strong>Submitted:</strong> {new Date(verification.submittedAt).toLocaleDateString()}
              </p>
              {verification.reviewedAt && (
                <p style={{ marginBottom: 'var(--space-2)' }}>
                  <strong>Reviewed:</strong> {new Date(verification.reviewedAt).toLocaleDateString()}
                </p>
              )}
              {verification.reviewedBy && (
                <p style={{ marginBottom: 'var(--space-2)' }}>
                  <strong>Reviewed by:</strong> {verification.reviewedBy.username}
                </p>
              )}
            </div>

            {verification.status === 'Pending' && (
              <div className="alert alert-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
                </svg>
                Your verification documents are under review. You will be notified once the review is complete.
              </div>
            )}

            {verification.status === 'Approved' && (
              <div className="alert alert-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                </svg>
                Congratulations! You are now verified and can start accepting delivery assignments.
              </div>
            )}

            {verification.status === 'Rejected' && (
              <div className="alert alert-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
                Your verification was rejected. Please contact support for more information.
                {verification.rejectionReason && (
                  <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--error-50)', borderRadius: 'var(--radius-md)' }}>
                    <strong>Reason:</strong> {verification.rejectionReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit} style={{ padding: 'var(--space-8)' }}>
            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-8)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
              </svg>
              Please provide accurate information and clear document images. All fields marked with * are required.
            </div>

            <h3 style={{ marginBottom: 'var(--space-6)' }}>Personal Information</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.personalInfo.fullName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                  }))}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">NID Number *</label>
                <input
                  type="text"
                  name="nidNumber"
                  value={formData.personalInfo.nidNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, nidNumber: e.target.value }
                  }))}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
              <label className="form-label">Address *</label>
              <textarea
                name="address"
                value={formData.personalInfo.address}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, address: e.target.value }
                }))}
                className="form-input"
                rows="3"
                required
              />
            </div>

            <h4 style={{ marginBottom: 'var(--space-4)' }}>Emergency Contact</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  name="emergencyName"
                  value={formData.personalInfo.emergencyContact.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      emergencyContact: { ...prev.personalInfo.emergencyContact, name: e.target.value }
                    }
                  }))}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.personalInfo.emergencyContact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      emergencyContact: { ...prev.personalInfo.emergencyContact, phone: e.target.value }
                    }
                  }))}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Relation</label>
                <input
                  type="text"
                  name="emergencyRelation"
                  value={formData.personalInfo.emergencyContact.relation}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      emergencyContact: { ...prev.personalInfo.emergencyContact, relation: e.target.value }
                    }
                  }))}
                  className="form-input"
                  placeholder="e.g., Father, Mother, Spouse"
                />
              </div>
            </div>

            <h3 style={{ marginBottom: 'var(--space-6)' }}>Document Upload</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
              <div className="form-group">
                <label className="form-label">NID Front Side *</label>
                <div style={{ marginBottom: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                  Upload clear image of front side of your National ID card (Max 10MB)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'nidFront')}
                  className="form-input"
                  style={{ padding: 'var(--space-2)' }}
                  required
                />
                {formData.documents.nidFront && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <img 
                      src={formData.documents.nidFront} 
                      alt="NID Front" 
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--success-200)' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-600)', marginTop: 'var(--space-1)' }}>
                      ✓ Image uploaded successfully
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">NID Back Side *</label>
                <div style={{ marginBottom: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                  Upload clear image of back side of your National ID card (Max 10MB)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'nidBack')}
                  className="form-input"
                  style={{ padding: 'var(--space-2)' }}
                  required
                />
                {formData.documents.nidBack && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <img 
                      src={formData.documents.nidBack} 
                      alt="NID Back" 
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--success-200)' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-600)', marginTop: 'var(--space-1)' }}>
                      ✓ Image uploaded successfully
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Profile Photo *</label>
                <div style={{ marginBottom: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                  Upload a clear photo of yourself (Max 10MB)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'photo')}
                  className="form-input"
                  style={{ padding: 'var(--space-2)' }}
                  required
                />
                {formData.documents.photo && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <img 
                      src={formData.documents.photo} 
                      alt="Profile" 
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--success-200)' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-600)', marginTop: 'var(--space-1)' }}>
                      ✓ Image uploaded successfully
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Driving License (Optional)</label>
                <div style={{ marginBottom: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                  Upload driving license if available (Max 10MB)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'drivingLicense')}
                  className="form-input"
                  style={{ padding: 'var(--space-2)' }}
                />
                {formData.documents.drivingLicense && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <img 
                      src={formData.documents.drivingLicense} 
                      alt="Driving License" 
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--success-200)' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-600)', marginTop: 'var(--space-1)' }}>
                      ✓ Image uploaded successfully
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
              <button
                type="submit"
                disabled={submitting || !formData.documents.nidFront || !formData.documents.nidBack || !formData.documents.photo || !formData.personalInfo.fullName || !formData.personalInfo.nidNumber || !formData.personalInfo.address}
                className="btn btn-primary"
                style={{ minWidth: '200px' }}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                    </svg>
                    Submit for Verification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AgentVerification;