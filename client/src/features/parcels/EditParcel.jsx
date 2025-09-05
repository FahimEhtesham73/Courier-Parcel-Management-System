import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getParcelById, updateParcel, resetParcelState } from './parcelSlice';
import { fetchUsers } from '../users/userSlice'; // Import fetchUsers thunk

function EditParcel() {
  const { user } = useSelector((state) => state.auth); // Get user from auth state
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { parcel, isLoading, isError, message } = useSelector((state) => state.parcels);

  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickupContactName: '',
    pickupContactPhone: '',
    deliveryAddress: '',
    recipientName: '',
    recipientPhone: '',
    size: '',
    type: '',
    weight: '',
    description: '',
    paymentMethod: '',
    codAmount: 0,
    specialInstructions: '',
    fragile: false,
    urgent: false,
    status: '',
    pickupLocation: {
      latitude: '',
      longitude: '',
    },
    deliveryLocation: {
      latitude: '',
      longitude: '',
    },
    assignedAgent: '', // Add assignedAgent to formData
  });

useEffect(() => {
  if (isError) {
    console.error(message);
  }

  dispatch(getParcelById(id));

  // Fetch delivery agents if user is admin
  if (user && user.role === 'Admin') {
    dispatch(fetchUsers('Delivery Agent'));
  }

  return () => {
    dispatch(resetParcelState());
  };
}, [id, isError, message, dispatch, user]);

  useEffect(() => {
    if (parcel) {
      const pickupLat = parcel.pickupLocation?.latitude || '';
      const pickupLng = parcel.pickupLocation?.longitude || '';
      const deliveryLat = parcel.deliveryLocation?.latitude || '';
      const deliveryLng = parcel.deliveryLocation?.longitude || '';

      // Check if coordinates are valid numbers before setting
      const validPickupLat = typeof pickupLat === 'number' ? pickupLat : '';
      const validPickupLng = typeof pickupLng === 'number' ? pickupLng : '';
      setFormData({
        pickupAddress: parcel.pickupAddress || '',
        pickupContactName: parcel.pickupContactName || '',
        pickupContactPhone: parcel.pickupContactPhone || '',
        deliveryAddress: parcel.deliveryAddress || '',
        recipientName: parcel.recipientName || '',
        recipientPhone: parcel.recipientPhone || '',
        size: parcel.size || '',
        type: parcel.type || '',
        weight: parcel.weight || '',
        description: parcel.description || '',
        paymentMethod: parcel.paymentMethod || '',
        codAmount: parcel.codAmount || 0,
        specialInstructions: parcel.specialInstructions || '',
        fragile: parcel.fragile || false,
        urgent: parcel.urgent || false,
        status: parcel.status || '',
        pickupLocation: {
          latitude: validPickupLat,
          longitude: validPickupLng,
        },
        deliveryLocation: {
          latitude: typeof deliveryLat === 'number' ? deliveryLat : '',
          longitude: typeof deliveryLng === 'number' ? deliveryLng : '',
        },
        assignedAgent: parcel.assignedAgent?._id || '',
      });
    }
  }, [parcel]);

  const { 
    pickupAddress, pickupContactName, pickupContactPhone,
    deliveryAddress, recipientName, recipientPhone, 
    size, type, weight, description, paymentMethod, codAmount, 
    specialInstructions, fragile, urgent, status, 
    pickupLocation, deliveryLocation, assignedAgent 
  } = formData;
  const { users: deliveryAgents, isLoading: usersLoading, isError: usersError } = useSelector((state) => state.users);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === 'pickupLocation' || name === 'deliveryLocation'
        ? {
            ...prevState[name],
            [e.target.id]: parseFloat(value) || '',
          }
        : type === 'checkbox' ? checked : value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // Filter out empty strings or non-numeric values for coordinates
    const filteredPickupLocation = {
      latitude: parseFloat(pickupLocation.latitude),
      longitude: parseFloat(pickupLocation.longitude),
    };
    const filteredDeliveryLocation = {
      latitude: parseFloat(deliveryLocation.latitude),
      longitude: parseFloat(deliveryLocation.longitude),
    };

    // Only include assignedAgent in formData if the user is admin
    const parcelData = user && user.role === 'Admin'
      ? { ...formData, pickupLocation: filteredPickupLocation, deliveryLocation: filteredDeliveryLocation }
      : { ...formData, assignedAgent: undefined, pickupLocation: filteredPickupLocation, deliveryLocation: filteredDeliveryLocation };

    dispatch(updateParcel({ id, parcelData }));
    // Navigate after successful update (optional: add success check)
    navigate(`/parcels/${id}`);
  };

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (!parcel) {
    return <h2>Parcel not found</h2>;
  }

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
            </svg>
            Edit Parcel
          </h1>
          <p className="page-subtitle">Update parcel information</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={onSubmit} style={{ padding: 'var(--space-8)' }}>
          <h3 style={{ marginBottom: 'var(--space-6)' }}>Pickup Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="pickupContactName" className="form-label">Pickup Contact Name *</label>
              <input
                type="text"
                id="pickupContactName"
                name="pickupContactName"
                value={pickupContactName}
                onChange={onChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pickupContactPhone" className="form-label">Pickup Contact Phone *</label>
              <input
                type="tel"
                id="pickupContactPhone"
                name="pickupContactPhone"
                value={pickupContactPhone}
                onChange={onChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pickupAddress" className="form-label">Pickup Address *</label>
            <input
              type="text"
              id="pickupAddress"
              name="pickupAddress"
              value={pickupAddress}
              onChange={onChange}
              className="form-input"
              required
            />
          </div>

          <h3 style={{ marginBottom: 'var(--space-6)', marginTop: 'var(--space-8)' }}>Delivery Information</h3>

          <div className="form-group">
            <label htmlFor="deliveryAddress" className="form-label">Delivery Address *</label>
            <input
              type="text"
              id="deliveryAddress"
              name="deliveryAddress"
              value={deliveryAddress}
              onChange={onChange}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="recipientName" className="form-label">Recipient Name *</label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                value={recipientName}
                onChange={onChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="recipientPhone" className="form-label">Recipient Phone *</label>
              <input
                type="tel"
                id="recipientPhone"
                name="recipientPhone"
                value={recipientPhone}
                onChange={onChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <h3 style={{ marginBottom: 'var(--space-6)', marginTop: 'var(--space-8)' }}>Parcel Information</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="size" className="form-label">Size *</label>
              <select
                id="size"
                name="size"
                value={size}
                onChange={onChange}
                className="form-select"
                required
              >
                <option value="">Select Size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Extra Large">Extra Large</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="type" className="form-label">Type *</label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={onChange}
                className="form-select"
                required
              >
                <option value="">Select Type</option>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="weight" className="form-label">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={weight}
                onChange={onChange}
                className="form-input"
                min="0"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Special Handling</label>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="fragile"
                    checked={fragile}
                    onChange={onChange}
                  />
                  <span>Fragile</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="urgent"
                    checked={urgent}
                    onChange={onChange}
                  />
                  <span>Urgent</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={onChange}
              className="form-input"
              rows="3"
              placeholder="Brief description of parcel contents"
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialInstructions" className="form-label">Special Instructions</label>
            <textarea
              id="specialInstructions"
              name="specialInstructions"
              value={specialInstructions}
              onChange={onChange}
              className="form-input"
              rows="3"
              placeholder="Any special handling or delivery instructions"
            />
          </div>

          <h3 style={{ marginBottom: 'var(--space-6)', marginTop: 'var(--space-8)' }}>Payment Information</h3>

          <div className="form-group">
            <label htmlFor="paymentMethod" className="form-label">Payment Method *</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={onChange}
              className="form-select"
              required
            >
              <option value="">Select Method</option>
              <option value="COD">Cash on Delivery</option>
              <option value="prepaid">Prepaid</option>
            </select>
          </div>

          {paymentMethod === 'COD' && (
            <div className="form-group">
              <label htmlFor="codAmount" className="form-label">COD Amount (৳) *</label>
              <input
                type="number"
                id="codAmount"
                name="codAmount"
                value={codAmount}
                onChange={onChange}
                className="form-input"
                min="1"
                step="0.01"
                required
              />
            </div>
          )}

          {user && user.role === 'Admin' && (
            <>
              <div className="form-group">
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={onChange}
                  className="form-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assignedAgent" className="form-label">Assign Agent</label>
                <select
                  id="assignedAgent"
                  name="assignedAgent"
                  value={assignedAgent}
                  onChange={onChange}
                  className="form-select"
                >
                  <option value="">Select Agent</option>
                  {deliveryAgents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.username} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

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
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              Update Parcel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditParcel;