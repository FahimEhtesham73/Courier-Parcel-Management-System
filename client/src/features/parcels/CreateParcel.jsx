import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createParcel } from './parcelSlice';
import LocationPicker from '../../components/LocationPicker';

function CreateParcel() {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    recipientName: '',
    recipientPhone: '',
    size: 'Small',
    type: 'Document',
    paymentMethod: 'prepaid',
    codAmount: 0,
    pickupLocation: { latitude: '', longitude: '' },
    deliveryLocation: { latitude: '', longitude: '' },
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.parcels);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'pickupLocationLatitude') {
      setFormData(prev => ({
        ...prev,
        pickupLocation: { ...prev.pickupLocation, latitude: parseFloat(value) || '' }
      }));
    } else if (name === 'pickupLocationLongitude') {
      setFormData(prev => ({
        ...prev,
        pickupLocation: { ...prev.pickupLocation, longitude: parseFloat(value) || '' }
      }));
    } else if (name === 'deliveryLocationLatitude') {
      setFormData(prev => ({
        ...prev,
        deliveryLocation: { ...prev.deliveryLocation, latitude: parseFloat(value) || '' }
      }));
    } else if (name === 'deliveryLocationLongitude') {
      setFormData(prev => ({
        ...prev,
        deliveryLocation: { ...prev.deliveryLocation, longitude: parseFloat(value) || '' }
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const getCurrentLocation = (locationType) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setFormData(prev => ({
            ...prev,
            [locationType]: location
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter coordinates manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate COD amount if payment method is COD
    if (formData.paymentMethod === 'COD' && (!formData.codAmount || formData.codAmount <= 0)) {
      alert('Please enter a valid COD amount');
      return;
    }
    
    // Validate required fields
    if (!formData.pickupAddress || !formData.deliveryAddress || !formData.recipientName || !formData.recipientPhone) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      await dispatch(createParcel(formData)).unwrap();
      alert('Parcel created successfully!');
      navigate('/parcels');
    } catch (error) {
      console.error('Error creating parcel:', error);
      alert('Error creating parcel: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
            </svg>
            Book New Parcel
          </h1>
          <p className="page-subtitle">Schedule a pickup and delivery for your parcel</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          {error}
        </div>
      )}

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-8)' }}>
          <div className="form-group">
            <label htmlFor="pickupAddress" className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
              </svg>
              Pickup Address *
            </label>
            <input
              type="text"
              id="pickupAddress"
              name="pickupAddress"
              value={formData.pickupAddress}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter pickup address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipientName" className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
              </svg>
              Recipient Name *
            </label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter recipient's full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipientPhone" className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="currentColor"/>
              </svg>
              Recipient Phone *
            </label>
            <input
              type="tel"
              id="recipientPhone"
              name="recipientPhone"
              value={formData.recipientPhone}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter recipient's phone number"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Pickup Latitude</label>
              <input
                type="number"
                name="pickupLocationLatitude"
                value={formData.pickupLocation.latitude}
                onChange={handleChange}
                className="form-input"
                placeholder="23.8103"
                step="any"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Longitude</label>
              <input
                type="number"
                name="pickupLocationLongitude"
                value={formData.pickupLocation.longitude}
                onChange={handleChange}
                className="form-input"
                placeholder="90.4125"
                step="any"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => getCurrentLocation('pickupLocation')}
            className="btn btn-secondary"
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8C9.79 8 8 9.79 8 12S9.79 16 12 16 16 14.21 16 12 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V1H11V3.06C6.83 3.52 3.52 6.83 3.06 11H1V13H3.06C3.52 17.17 6.83 20.48 11 20.94V23H13V20.94C17.17 20.48 20.48 17.17 20.94 13H23V11H20.94ZM12 19C8.13 19 5 15.87 5 12S8.13 5 12 5 19 8.13 19 12 15.87 19 12 19Z" fill="currentColor"/>
            </svg>
            Use Current Location for Pickup
          </button>

          <div className="form-group">
            <label htmlFor="deliveryAddress" className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
              Delivery Address *
            </label>
            <input
              type="text"
              id="deliveryAddress"
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter delivery address"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="recipientName" className="form-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                </svg>
                Recipient Name *
              </label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter recipient's full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="recipientPhone" className="form-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="currentColor"/>
                </svg>
                Recipient Phone *
              </label>
              <input
                type="tel"
                id="recipientPhone"
                name="recipientPhone"
                value={formData.recipientPhone}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter recipient's phone number"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Delivery Latitude</label>
              <input
                type="number"
                name="deliveryLocationLatitude"
                value={formData.deliveryLocation.latitude}
                onChange={handleChange}
                className="form-input"
                placeholder="23.8103"
                step="any"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Longitude</label>
              <input
                type="number"
                name="deliveryLocationLongitude"
                value={formData.deliveryLocation.longitude}
                onChange={handleChange}
                className="form-input"
                placeholder="90.4125"
                step="any"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => getCurrentLocation('deliveryLocation')}
            className="btn btn-secondary"
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8C9.79 8 8 9.79 8 12S9.79 16 12 16 16 14.21 16 12 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V1H11V3.06C6.83 3.52 3.52 6.83 3.06 11H1V13H3.06C3.52 17.17 6.83 20.48 11 20.94V23H13V20.94C17.17 20.48 20.48 17.17 20.94 13H23V11H20.94ZM12 19C8.13 19 5 15.87 5 12S8.13 5 12 5 19 8.13 19 12 15.87 19 12 19Z" fill="currentColor"/>
            </svg>
            Use Current Location for Delivery
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="size" className="form-label">Parcel Size *</label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="Small">Small (up to 1kg)</option>
                <option value="Medium">Medium (1-5kg)</option>
                <option value="Large">Large (5-20kg)</option>
                <option value="Extra Large">Extra Large (20kg+)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type" className="form-label">Parcel Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="Document">Document</option>
                <option value="Package">Package</option>
                <option value="Fragile">Fragile</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Food">Food</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod" className="form-label">Payment Method *</label>
            <div style={{ marginBottom: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--primary-700)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              COD (Cash on Delivery): Customer pays when parcel is delivered
            </div>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="prepaid">Prepaid (Pay Now)</option>
              <option value="COD">Cash on Delivery (COD)</option>
            </select>
          </div>

          {formData.paymentMethod === 'COD' && (
            <div className="form-group">
              <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--warning-50)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--warning-700)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                  <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
                </svg>
                This amount will be collected from the recipient upon delivery
              </div>
              <label htmlFor="codAmount" className="form-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 'var(--space-2)' }}>
                  <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="currentColor"/>
                </svg>
                Amount to Collect (৳) *
              </label>
              <input
                type="number"
                id="codAmount"
                name="codAmount"
                value={formData.codAmount}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter amount to collect from recipient"
                min="1"
                step="0.01"
                required={formData.paymentMethod === 'COD'}
              />
            </div>
          )}

          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--success-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--success-200)' }}>
            <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--success-700)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              Real-time Agent Notification
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--success-600)' }}>
              All verified delivery agents will receive instant notifications about your parcel. Agents can accept deliveries based on their location and availability for faster service.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            <button
              type="button"
              onClick={() => navigate('/parcels')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                  </svg>
                  Book Parcel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateParcel;