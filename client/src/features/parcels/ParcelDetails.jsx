import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getParcelById, deleteParcel } from './parcelSlice';
import socket from '../../socket'; // Import the socket instance
import Map from '../../components/Map';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import axios from 'axios';

const ParcelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { parcel, loading, error } = useSelector((state) => state.parcels);
  const { user, token } = useSelector((state) => state.auth);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [agentLocation, setAgentLocation] = useState(null); // State to store agent's real-time location
  const [agentDetails, setAgentDetails] = useState(null);

  useEffect(() => {
    dispatch(getParcelById(id));
  }, [dispatch, id]);
  
  // Fetch agent details if parcel has assigned agent
  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (parcel && parcel.assignedAgent && token) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          const response = await axios.get(`/api/users/${parcel.assignedAgent._id}/location`, config);
          setAgentDetails(response.data);
          if (response.data.currentLocation) {
            setAgentLocation(response.data.currentLocation);
          }
        } catch (error) {
          console.error('Error fetching agent details:', error);
        }
      }
    };
    
    fetchAgentDetails();
  }, [parcel, token]);

  useEffect(() => {
    // Check if parcel data and customer data are available before generating QR code
    if (parcel) {
      console.log('Fetched parcel data:', parcel);
      // Generate QR code data
      const qrData = JSON.stringify({
        id: parcel._id,
        trackingNumber: parcel.trackingNumber,
        status: parcel.status, // Ensure status is always available
        // Use optional chaining and fallback for potentially missing properties
        pickup: parcel.pickupAddress,
        delivery: parcel.deliveryAddress,
        customer: (parcel.customer && parcel.customer.username) || 'Unknown'
      });
      setQrCode(qrData);
    }
  }, [parcel]);

  // Effect for real-time agent location tracking
  useEffect(() => {
    if (parcel && parcel.assignedAgent) {
      const handleAgentLocationUpdate = (locationData) => {
        // Check if the location update is for the assigned agent of this parcel
        if (locationData.agentId === parcel.assignedAgent._id || 
            locationData.parcelId === parcel._id) {
          setAgentLocation(locationData.location);
        }
      };
      
      const handleParcelStatusUpdate = (updatedParcel) => {
        if (updatedParcel._id === parcel._id) {
          // Update parcel data in real-time
          dispatch(getParcelById(id));
        }
      };

      socket.on('agentLocationUpdate', handleAgentLocationUpdate);
      socket.on('parcelStatusUpdated', handleParcelStatusUpdate);

      return () => {
        socket.off('agentLocationUpdate', handleAgentLocationUpdate);
        socket.off('parcelStatusUpdated', handleParcelStatusUpdate);
      };
    }
  }, [socket, parcel]); // Depend on socket and parcel

  const downloadQRCode = () => {
    const svg = document.querySelector('#qr-code-svg svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 300;
        canvas.height = 300;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `parcel-${parcel.trackingNumber}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } else {
      // Fallback method
      const qrContainer = document.querySelector('#qr-code-container');
      if (qrContainer) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 300);
        
        // Create download link
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `parcel-${parcel.trackingNumber}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    }
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${parcel.trackingNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .qr-container { 
              margin: 20px 0; 
            }
            .parcel-info { 
              margin: 20px 0; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <h2>Parcel QR Code</h2>
          <div class="parcel-info">
            <p><strong>Tracking:</strong> ${parcel.trackingNumber}</p>
            <p><strong>Status:</strong> ${parcel.status}</p>
            <p><strong>From:</strong> ${parcel.pickupAddress}</p>
            <p><strong>To:</strong> ${parcel.deliveryAddress}</p>
          </div>
          <div class="qr-container">
            ${document.querySelector('#qr-code-container').innerHTML}
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Parcel QR Code - ${parcel.trackingNumber}`,
          text: `Track parcel ${parcel.trackingNumber}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this parcel?')) {
      try {
        await dispatch(deleteParcel(id)).unwrap();
        navigate('/parcels');
      } catch (error) {
        console.error('Error deleting parcel:', error);
      }
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

  const getMapMarkers = () => {
    // Ensure Google Maps API is loaded before attempting to use window.google.maps
    if (!window.google || !window.google.maps) {
      console.warn("Google Maps API not loaded yet.");
      return []; // Return empty array if API is not ready
    }

    const markers = [];

    if (parcel.pickupLocation?.latitude && parcel.pickupLocation?.longitude) {
      markers.push({
        lat: parcel.pickupLocation.latitude,
        lng: parcel.pickupLocation.longitude,
        title: 'Pickup Location',
        infoWindow: `<div><strong>Pickup</strong><br/>${parcel.pickupAddress}</div>`,
        icon: new window.google.maps.MarkerImage( // Use MarkerImage constructor
          'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="#3b82f6"/>
            </svg>
          `), // URL of the custom marker icon
          scaledSize, new window.google.maps.Size(32, 32),
        )
      });
    }

    if (parcel.deliveryLocation?.latitude && parcel.deliveryLocation?.longitude) {
      markers.push({
        lat: parcel.deliveryLocation.latitude,
        lng: parcel.deliveryLocation.longitude,
        title: 'Delivery Location',
        infoWindow: `<div><strong>Delivery</strong><br/>${parcel.deliveryAddress}</div>`,
        icon: new window.google.maps.MarkerImage( // Use MarkerImage constructor
          'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="#ef4444"/>
            </svg>
          `), // URL of the custom marker icon
          scaledSize, new window.google.maps.Size(32, 32),
        )
      });
    }

    // Add agent's real-time location marker if available
    if ((agentLocation?.latitude && agentLocation?.longitude) || 
        (agentDetails?.currentLocation?.latitude && agentDetails?.currentLocation?.longitude)) {
      const location = agentLocation || agentDetails.currentLocation;
      markers.push({
        lat: location.latitude,
        lng: location.longitude,
        title: 'Agent Location',
        infoWindow: `<div><strong>Delivery Agent</strong><br/>${parcel.assignedAgent?.username || 'Agent'}<br/>Current Location<br/>🟢 Live</div>`,
        icon: new window.google.maps.MarkerImage( // Use MarkerImage constructor
          'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#10b981"/>
              <path d="M18 8H20L23 12V17H21C21 18.66 19.66 20 18 20S15 18.66 15 17H9C9 18.66 7.66 20 6 20S3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5ZM18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5Z" fill="white"/>
            </svg>
          `), // URL of the custom marker icon
          scaledSize, new window.google.maps.Size(32, 32)
        )
      });
    }
    return markers;
  };

  const getMapCenter = () => {
    if (parcel.pickupLocation?.latitude && parcel.pickupLocation?.longitude) {
      return {
        lat: parcel.pickupLocation.latitude,
        lng: parcel.pickupLocation.longitude
      };
    }
    // Default to Dhaka, Bangladesh
    return { lat: 23.8103, lng: 90.4125 };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading parcel details...</p>
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

  if (!parcel) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor" />
            </svg>
          </div>
          <h3>Parcel not found</h3>
          <p>The parcel you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/parcels" className="btn btn-primary">
            Back to Parcels
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'Admin' || (user?.role === 'Customer' && parcel.customer?._id === user.id);
  const canDelete = user?.role === 'Admin' || (user?.role === 'Customer' && parcel.customer?._id === user.id);
  const hasLocationData = (parcel.pickupLocation?.latitude && parcel.pickupLocation?.longitude) ||
    (parcel.deliveryLocation?.latitude && parcel.deliveryLocation?.longitude);

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
            Parcel Details
          </h1>
          <p className="page-subtitle">Tracking: {parcel.trackingNumber || parcel._id}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link to="/parcels" className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
            </svg>
            Back to List
          </Link>
          {hasLocationData && (
            <button
              onClick={() => setShowMap(!showMap)}
              className="btn btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor" />
              </svg>
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          )}
          <button
            onClick={() => setShowQRCode(!showQRCode)}
            className="btn btn-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5C3 3.89 3.89 3 5 3H19C20.11 3 21 3.89 21 5V19C21 20.11 20.11 21 19 21H5C3.89 21 3 20.11 3 19V5ZM5 5V19H19V5H5ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="currentColor" />
            </svg>
            {showQRCode ? 'Hide QR' : 'Show QR'}
          </button>
          {canEdit && (
            <Link to={`/edit-parcel/${parcel._id}`} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor" />
              </svg>
              Edit
            </Link>
          )}
        </div>
      </div>

      {showMap && hasLocationData && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor" />
              </svg>
              Parcel Route Map
            </h3>
            <Map
              center={getMapCenter()}
              zoom={12}
              markers={getMapMarkers()}
            />
          </div>
        </div>
      )}

      {showQRCode && qrCode && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5C3 3.89 3.89 3 5 3H19C20.11 3 21 3.89 21 5V19C21 20.11 20.11 21 19 21H5C3.89 21 3 20.11 3 19V5ZM5 5V19H19V5H5ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="currentColor" />
              </svg>
              Parcel QR Code
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div id="qr-code-container">
                <QRCodeGenerator
                  value={qrCode}
                  size={200}
                  level="M"
                />
              </div>

              <p style={{ textAlign: 'center', color: 'var(--secondary-600)', margin: 0 }}>
                Scan this QR code to quickly access parcel information
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={downloadQRCode} className="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20H19V18H5M19 9H15V3H9V9H5L12 16L19 9Z" fill="currentColor" />
                  </svg>
                  Download
                </button>
                <button onClick={printQRCode} className="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 3H6V7H18M19 12A1 1 0 0 1 18 11A1 1 0 0 1 19 10A1 1 0 0 1 20 11A1 1 0 0 1 19 12M16 19H8V14H16M19 8H5A3 3 0 0 0 2 11V17H6V21H18V17H22V11A3 3 0 0 0 19 8Z" fill="currentColor" />
                  </svg>
                  Print
                </button>
                <button onClick={shareQRCode} className="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12S8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5S19.66 2 18 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12S4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.92 18 21.92S20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
        <div className="card">
          <div style={{ padding: 'var(--space-8)' }}>
            <div className="parcel-header" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="parcel-id">
                <span className="id-label">Tracking Number:</span>
                <span className="id-value">{parcel.trackingNumber || parcel._id}</span>
              </div>
              <div className={getStatusBadgeClass(parcel.status)}>
                <div className="status-dot"></div>
                {parcel.status}
              </div>
            </div>

            <div className="address-section" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="address-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor" />
                </svg>
                <div>
                  <span className="address-label">Pickup Address:</span>
                  <span className="address-value">{parcel.pickupAddress}</span>
                  {parcel.pickupContactName && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary-600)', marginTop: 'var(--space-1)' }}>
                      <strong>Contact:</strong> {parcel.pickupContactName} ({parcel.pickupContactPhone})
                    </div>
                  )}
                  {parcel.pickupLocation?.latitude && parcel.pickupLocation?.longitude && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', marginTop: 'var(--space-1)' }}>
                      Coordinates: {parcel.pickupLocation.latitude.toFixed(6)}, {parcel.pickupLocation.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
              <div className="address-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.01 11H4V13H16.01V16L20 12L16.01 8V11Z" fill="currentColor" />
                </svg>
              </div>
              <div className="address-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor" />
                </svg>
                <div>
                  <span className="address-label">Delivery Address:</span>
                  <span className="address-value">{parcel.deliveryAddress}</span>
                  {parcel.recipientName && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary-600)', marginTop: 'var(--space-1)' }}>
                      <strong>Recipient:</strong> {parcel.recipientName} ({parcel.recipientPhone})
                    </div>
                  )}
                  {parcel.deliveryLocation?.latitude && parcel.deliveryLocation?.longitude && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', marginTop: 'var(--space-1)' }}>
                      Coordinates: {parcel.deliveryLocation.latitude.toFixed(6)}, {parcel.deliveryLocation.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="parcel-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
              <div className="detail-item">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{parcel.size}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{parcel.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Method:</span>
                <span className="detail-value">{parcel.paymentMethod}</span>
              </div>
              {parcel.paymentMethod === 'COD' && parcel.codAmount > 0 && (
                <div className="detail-item">
                  <span className="detail-label">COD Amount:</span>
                  <span className="detail-value" style={{ color: 'var(--warning-600)', fontWeight: '600' }}>৳{parcel.codAmount}</span>
                </div>
              )}
              {parcel.weight && (
                <div className="detail-item">
                  <span className="detail-label">Weight:</span>
                  <span className="detail-value">{parcel.weight} kg</span>
                </div>
              )}
              {parcel.description && (
                <div className="detail-item">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{parcel.description}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Created:</span>
                <span className="detail-value">
                  {new Date(parcel.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {parcel.estimatedDelivery && (
                <div className="detail-item">
                  <span className="detail-label">Estimated Delivery:</span>
                  <span className="detail-value">
                    {new Date(parcel.estimatedDelivery).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {parcel.actualDelivery && (
                <div className="detail-item">
                  <span className="detail-label">Delivered On:</span>
                  <span className="detail-value" style={{ color: 'var(--success-600)', fontWeight: '600' }}>
                    {new Date(parcel.actualDelivery).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {parcel.customer && (
                <div className="detail-item">
                  <span className="detail-label">Customer:</span>
                  <span className="detail-value">{parcel.customer.username}</span>
                </div>
              )}
              {parcel.assignedAgent && (
                <div className="detail-item">
                  <span className="detail-label">Assigned Agent:</span>
                  <span className="detail-value">{parcel.assignedAgent.username}</span>
                </div>
              )}
              {parcel.failureReason && (
                <div className="detail-item">
                  <span className="detail-label">Failure Reason:</span>
                  <span className="detail-value" style={{ color: 'var(--error-600)' }}>{parcel.failureReason}</span>
                </div>
              )}
              {parcel.specialInstructions && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Special Instructions:</span>
                  <span className="detail-value">{parcel.specialInstructions}</span>
                </div>
              )}
              {(parcel.fragile || parcel.urgent) && (
                <div className="detail-item">
                  <span className="detail-label">Special Handling:</span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {parcel.fragile && (
                      <span style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)', background: 'var(--error-100)', color: 'var(--error-700)', borderRadius: 'var(--radius-sm)' }}>
                        FRAGILE
                      </span>
                    )}
                    {parcel.urgent && (
                      <span style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)', background: 'var(--warning-100)', color: 'var(--warning-700)', borderRadius: 'var(--radius-sm)' }}>
                        URGENT
                      </span>
                    )}
                  </div>
                </div>
              )}
              {parcel.deliveryNotes && (
                <div className="detail-item">
                  <span className="detail-label">Delivery Notes:</span>
                  <span className="detail-value">{parcel.deliveryNotes}</span>
                </div>
              )}
            </div>

            {canDelete && (
              <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--secondary-200)' }}>
                <button onClick={handleDelete} className="btn btn-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" />
                  </svg>
                  Delete Parcel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor" />
              </svg>
              Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5C3 3.89 3.89 3 5 3H19C20.11 3 21 3.89 21 5V19C21 20.11 20.11 21 19 21H5C3.89 21 3 20.11 3 19V5ZM5 5V19H19V5H5ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="currentColor" />
                </svg>
                {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(parcel.trackingNumber)}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor" />
                </svg>
                Copy Tracking Number
              </button>

              <button
                onClick={() => window.open(`/api/parcels/${parcel._id}/label`, '_blank')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 3H6V7H18M19 12A1 1 0 0 1 18 11A1 1 0 0 1 19 10A1 1 0 0 1 20 11A1 1 0 0 1 19 12M16 19H8V14H16M19 8H5A3 3 0 0 0 2 11V17H6V21H18V17H22V11A3 3 0 0 0 19 8Z" fill="currentColor" />
                </svg>
                Download Label
              </button>

              <Link
                to={`/track`}
                className="btn btn-primary"
                style={{ width: '100%', textDecoration: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor" />
                </svg>
                Track This Parcel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParcelDetails;