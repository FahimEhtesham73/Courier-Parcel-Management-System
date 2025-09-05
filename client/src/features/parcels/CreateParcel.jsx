import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createParcel } from './parcelSlice';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';

function CreateParcel() {
  const [formData, setFormData] = useState({
    // Pickup Information
    pickupAddress: '',
    pickupContactName: '',
    pickupContactPhone: '',
    pickupLocation: null,
    
    // Delivery Information
    deliveryAddress: '',
    recipientName: '',
    recipientPhone: '',
    deliveryLocation: null,
    
    // Parcel Information
    size: 'Small',
    type: 'Document',
    weight: '',
    description: '',
    
    // Payment Information
    paymentMethod: 'prepaid',
    codAmount: 0,
    
    // Special Instructions
    specialInstructions: '',
    fragile: false,
    urgent: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.parcels);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePickupLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      pickupLocation: location,
      pickupAddress: location?.address || prev.pickupAddress
    }));
  };

  const handleDeliveryLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      deliveryLocation: location,
      deliveryAddress: location?.address || prev.deliveryAddress
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.pickupAddress && formData.pickupContactName && formData.pickupContactPhone;
      case 2:
        return formData.deliveryAddress && formData.recipientName && formData.recipientPhone;
      case 3:
        return formData.size && formData.type;
      case 4:
        return formData.paymentMethod && (formData.paymentMethod !== 'COD' || formData.codAmount > 0);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      alert('Please fill in all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        alert(`Please complete step ${step} before submitting.`);
        return;
      }
    }
    
    try {
      const parcelData = {
        pickupAddress: formData.pickupAddress,
        pickupContactName: formData.pickupContactName,
        pickupContactPhone: formData.pickupContactPhone,
        pickupLocation: formData.pickupLocation ? {
          latitude: formData.pickupLocation.lat,
          longitude: formData.pickupLocation.lng
        } : null,
        
        deliveryAddress: formData.deliveryAddress,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        deliveryLocation: formData.deliveryLocation ? {
          latitude: formData.deliveryLocation.lat,
          longitude: formData.deliveryLocation.lng
        } : null,
        
        size: formData.size,
        type: formData.type,
        weight: formData.weight || null,
        description: formData.description || null,
        
        paymentMethod: formData.paymentMethod,
        codAmount: formData.paymentMethod === 'COD' ? formData.codAmount : 0,
        
        specialInstructions: formData.specialInstructions || null,
        fragile: formData.fragile,
        urgent: formData.urgent
      };
      
      await dispatch(createParcel(parcelData)).unwrap();
      alert('Parcel booked successfully!');
      navigate('/parcels');
    } catch (error) {
      console.error('Error creating parcel:', error);
      alert('Error booking parcel: ' + (error.message || 'Unknown error'));
    }
  };

  const getStepIcon = (step) => {
    const icons = {
      1: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/></svg>,
      2: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/></svg>,
      3: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/></svg>,
      4: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="currentColor"/></svg>,
      5: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/></svg>
    };
    return icons[step];
  };

  const renderStepIndicator = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginBottom: 'var(--space-8)',
      padding: 'var(--space-6)',
      background: 'white',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)'
    }}>
      {[1, 2, 3, 4, 5].map((step, index) => (
        <React.Fragment key={step}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: step <= currentStep ? 'var(--primary-500)' : 'var(--secondary-200)',
              color: step <= currentStep ? 'white' : 'var(--secondary-500)',
              transition: 'all 0.3s ease',
              border: step === currentStep ? '3px solid var(--primary-200)' : 'none'
            }}>
              {getStepIcon(step)}
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: step <= currentStep ? 'var(--primary-600)' : 'var(--secondary-500)',
              textAlign: 'center'
            }}>
              {['Pickup', 'Delivery', 'Parcel', 'Payment', 'Review'][index]}
            </span>
          </div>
          {index < 4 && (
            <div style={{
              width: '60px',
              height: '2px',
              background: step < currentStep ? 'var(--primary-500)' : 'var(--secondary-200)',
              margin: '0 var(--space-3)',
              transition: 'all 0.3s ease'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
        </svg>
        Pickup Information
      </h3>

      <div className="form-group">
        <label className="form-label">Pickup Contact Name *</label>
        <input
          type="text"
          name="pickupContactName"
          value={formData.pickupContactName}
          onChange={handleChange}
          className="form-input"
          placeholder="Name of person at pickup location"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Pickup Contact Phone *</label>
        <input
          type="tel"
          name="pickupContactPhone"
          value={formData.pickupContactPhone}
          onChange={handleChange}
          className="form-input"
          placeholder="Phone number for pickup coordination"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Pickup Address *</label>
        <input
          type="text"
          name="pickupAddress"
          value={formData.pickupAddress}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter pickup address manually or use map below"
          required
        />
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          onClick={() => setShowPickupMap(!showPickupMap)}
          className="btn btn-secondary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor"/>
          </svg>
          {showPickupMap ? 'Hide Map' : 'Select Pickup Location on Map'}
        </button>
      </div>

      {showPickupMap && (
        <GoogleMapsLocationPicker
          label="Pickup Location"
          placeholder="Search for pickup location"
          onLocationSelect={handlePickupLocationSelect}
          initialLocation={formData.pickupLocation}
        />
      )}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
        </svg>
        Delivery Information
      </h3>

      <div className="form-group">
        <label className="form-label">Recipient Name *</label>
        <input
          type="text"
          name="recipientName"
          value={formData.recipientName}
          onChange={handleChange}
          className="form-input"
          placeholder="Full name of the recipient"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Recipient Phone *</label>
        <input
          type="tel"
          name="recipientPhone"
          value={formData.recipientPhone}
          onChange={handleChange}
          className="form-input"
          placeholder="Phone number of the recipient"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Delivery Address *</label>
        <input
          type="text"
          name="deliveryAddress"
          value={formData.deliveryAddress}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter delivery address manually or use map below"
          required
        />
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          onClick={() => setShowDeliveryMap(!showDeliveryMap)}
          className="btn btn-secondary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor"/>
          </svg>
          {showDeliveryMap ? 'Hide Map' : 'Select Delivery Location on Map'}
        </button>
      </div>

      {showDeliveryMap && (
        <GoogleMapsLocationPicker
          label="Delivery Location"
          placeholder="Search for delivery location"
          onLocationSelect={handleDeliveryLocationSelect}
          initialLocation={formData.deliveryLocation}
        />
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
        </svg>
        Parcel Details
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label">Parcel Size *</label>
          <select
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
          <label className="form-label">Parcel Type *</label>
          <select
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
            <option value="Medicine">Medicine</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Weight (kg)</label>
        <input
          type="number"
          name="weight"
          value={formData.weight}
          onChange={handleChange}
          className="form-input"
          placeholder="Approximate weight in kg"
          min="0"
          step="0.1"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-input"
          rows="3"
          placeholder="Brief description of the parcel contents"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Special Instructions</label>
        <textarea
          name="specialInstructions"
          value={formData.specialInstructions}
          onChange={handleChange}
          className="form-input"
          rows="3"
          placeholder="Any special handling instructions or delivery notes"
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="fragile"
            checked={formData.fragile}
            onChange={handleChange}
            style={{ width: '18px', height: '18px' }}
          />
          <span>Fragile Item</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="urgent"
            checked={formData.urgent}
            onChange={handleChange}
            style={{ width: '18px', height: '18px' }}
          />
          <span>Urgent Delivery</span>
        </label>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="currentColor"/>
        </svg>
        Payment Information
      </h3>

      <div className="form-group">
        <label className="form-label">Payment Method *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'var(--space-4)',
            border: `2px solid ${formData.paymentMethod === 'prepaid' ? 'var(--primary-500)' : 'var(--secondary-200)'}`,
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: formData.paymentMethod === 'prepaid' ? 'var(--primary-50)' : 'white'
          }}>
            <input
              type="radio"
              name="paymentMethod"
              value="prepaid"
              checked={formData.paymentMethod === 'prepaid'}
              onChange={handleChange}
              style={{ display: 'none' }}
            />
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 'var(--space-2)', color: formData.paymentMethod === 'prepaid' ? 'var(--primary-500)' : 'var(--secondary-400)' }}>
              <path d="M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="currentColor"/>
            </svg>
            <strong>Prepaid</strong>
            <span style={{ fontSize: '0.875rem', color: 'var(--secondary-600)', textAlign: 'center' }}>Pay now online</span>
          </label>

          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'var(--space-4)',
            border: `2px solid ${formData.paymentMethod === 'COD' ? 'var(--warning-500)' : 'var(--secondary-200)'}`,
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: formData.paymentMethod === 'COD' ? 'var(--warning-50)' : 'white'
          }}>
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={formData.paymentMethod === 'COD'}
              onChange={handleChange}
              style={{ display: 'none' }}
            />
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 'var(--space-2)', color: formData.paymentMethod === 'COD' ? 'var(--warning-500)' : 'var(--secondary-400)' }}>
              <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="currentColor"/>
            </svg>
            <strong>Cash on Delivery</strong>
            <span style={{ fontSize: '0.875rem', color: 'var(--secondary-600)', textAlign: 'center' }}>Pay when delivered</span>
          </label>
        </div>
      </div>

      {formData.paymentMethod === 'COD' && (
        <div className="form-group">
          <div style={{ 
            marginBottom: 'var(--space-3)', 
            padding: 'var(--space-3)', 
            background: 'var(--warning-50)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--warning-200)',
            fontSize: '0.875rem', 
            color: 'var(--warning-700)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
              </svg>
              <strong>Cash on Delivery Information</strong>
            </div>
            This amount will be collected from the recipient upon delivery. Please ensure the recipient is aware of this amount.
          </div>
          <label className="form-label">Amount to Collect (৳) *</label>
          <input
            type="number"
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
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
        </svg>
        Review & Confirm
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }}>
        <div>
          <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--primary-600)' }}>Pickup Details</h4>
          <div style={{ padding: 'var(--space-4)', background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Contact:</strong> {formData.pickupContactName}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Phone:</strong> {formData.pickupContactPhone}
            </div>
            <div>
              <strong>Address:</strong> {formData.pickupAddress}
            </div>
          </div>

          <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--success-600)' }}>Delivery Details</h4>
          <div style={{ padding: 'var(--space-4)', background: 'var(--success-50)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Recipient:</strong> {formData.recipientName}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Phone:</strong> {formData.recipientPhone}
            </div>
            <div>
              <strong>Address:</strong> {formData.deliveryAddress}
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--secondary-600)' }}>Parcel Information</h4>
          <div style={{ padding: 'var(--space-4)', background: 'var(--secondary-50)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Size:</strong> {formData.size}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Type:</strong> {formData.type}
            </div>
            {formData.weight && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <strong>Weight:</strong> {formData.weight} kg
              </div>
            )}
            {formData.description && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <strong>Description:</strong> {formData.description}
              </div>
            )}
            {(formData.fragile || formData.urgent) && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {formData.fragile && (
                  <span style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)', background: 'var(--error-100)', color: 'var(--error-700)', borderRadius: 'var(--radius-sm)' }}>
                    FRAGILE
                  </span>
                )}
                {formData.urgent && (
                  <span style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)', background: 'var(--warning-100)', color: 'var(--warning-700)', borderRadius: 'var(--radius-sm)' }}>
                    URGENT
                  </span>
                )}
              </div>
            )}
          </div>

          <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--warning-600)' }}>Payment</h4>
          <div style={{ padding: 'var(--space-4)', background: 'var(--warning-50)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Method:</strong> {formData.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid'}
            </div>
            {formData.paymentMethod === 'COD' && formData.codAmount > 0 && (
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning-700)' }}>
                <strong>Amount to Collect:</strong> ৳{formData.codAmount}
              </div>
            )}
          </div>
        </div>
      </div>

      {formData.specialInstructions && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <h4 style={{ marginBottom: 'var(--space-3)' }}>Special Instructions</h4>
          <div style={{ padding: 'var(--space-4)', background: 'var(--secondary-50)', borderRadius: 'var(--radius-lg)', fontStyle: 'italic' }}>
            {formData.specialInstructions}
          </div>
        </div>
      )}
    </div>
  );

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

      {renderStepIndicator()}

      <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-8)' }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: 'var(--space-8)',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--secondary-200)'
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => navigate('/parcels')}
                className="btn btn-secondary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
                Cancel
              </button>
              
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
                  </svg>
                  Previous
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                  disabled={!validateStep(currentStep)}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 11V13H16.17L10.58 18.59L12 20L20 12L12 4L10.59 5.41L16.17 11H4Z" fill="currentColor"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-success"
                  style={{ minWidth: '150px' }}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                      </svg>
                      Confirm Booking
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div style={{ 
        marginTop: 'var(--space-6)', 
        padding: 'var(--space-4)', 
        background: 'var(--success-50)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--success-200)',
        maxWidth: '1000px',
        margin: 'var(--space-6) auto 0'
      }}>
        <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--success-700)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          Real-time Agent Notification System
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--success-600)' }}>
          All verified delivery agents will receive instant notifications about your parcel. Agents can accept deliveries based on their location and availability for faster service. You'll be notified immediately when an agent accepts your parcel.
        </p>
      </div>
    </div>
  );
}

export default CreateParcel;