import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import QRCodeScanner from '../../components/QRCodeScanner';
import { getParcelById, updateParcelStatus } from './parcelSlice';

function ScanParcel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { parcel, loading, error } = useSelector((state) => state.parcels);
  const { user } = useSelector((state) => state.auth);

  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (scannedBarcode && !processing) {
      setProcessing(true);
      setMessage(`Barcode scanned: ${scannedBarcode}. Fetching parcel details...`);
      
      // Try to parse JSON from QR code, fallback to treating as parcel ID
      let parcelId = scannedBarcode;
      try {
        const qrData = JSON.parse(scannedBarcode);
        if (qrData.id) {
          parcelId = qrData.id;
        }
      } catch (e) {
        // Not JSON, treat as direct parcel ID
      }
      
      dispatch(getParcelById(parcelId));
      setScanning(false);
    }
  }, [scannedBarcode, dispatch, processing]);

  useEffect(() => {
    if (scannedBarcode && parcel && !loading && !error && !processing) {
      // Determine the next status based on the current status
      let newStatus = '';
      let failureReason = '';
      
      switch (parcel.status) {
        case 'Pending':
          newStatus = 'Picked Up';
          break;
        case 'Picked Up':
          newStatus = 'In Transit';
          break;
        case 'In Transit':
          // For in-transit parcels, ask user to confirm delivery or mark as failed
          const userChoice = window.confirm('Mark as Delivered? Click Cancel to mark as Failed.');
          if (userChoice) {
            newStatus = 'Delivered';
          } else {
            newStatus = 'Failed';
            failureReason = prompt('Please enter failure reason:') || 'Delivery failed';
          }
          break;
        case 'Delivered':
          setMessage(`Parcel is already Delivered.`);
          setProcessing(false);
          return;
        case 'Failed':
          setMessage(`Parcel status is Failed. Cannot update further.`);
          setProcessing(false);
          return;
        default:
          setMessage(`Parcel status is ${parcel.status}. Cannot update.`);
          setProcessing(false);
          return;
      }

      setMessage(`Parcel found. Updating status to ${newStatus}...`);
      const updateData = { id: parcel._id, status: newStatus };
      if (failureReason) {
        updateData.failureReason = failureReason;
      }
      
      dispatch(updateParcelStatus(updateData))
        .unwrap()
        .then(() => {
          setMessage(`✅ Parcel ${parcel._id.slice(-8)} status updated to ${newStatus} successfully!`);
          setProcessing(false);
        })
        .catch((updateError) => {
          setMessage(`❌ Error updating parcel status: ${updateError}`);
          setProcessing(false);
        });
    }
  }, [parcel, scannedBarcode, loading, error, dispatch, processing]);

  const handleScan = (data) => {
    if (data && !processing) {
      setScannedBarcode(data);
    }
  };

  const handleRestartScan = () => {
    setScannedBarcode(null);
    setScanning(true);
    setMessage('');
    setProcessing(false);
    // Clear parcel data
    dispatch({ type: 'parcels/resetParcelState' });
  };

  if (!user || user.role !== 'Delivery Agent') {
    return (
      <div className="container">
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="currentColor"/>
          </svg>
          You are not authorized to access this page.
        </div>
      </div>
    );
  }

  if (!user.isVerified) {
    return (
      <div className="container">
        <div className="alert alert-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
          </svg>
          You must be verified by an admin before you can scan parcels. Please complete your verification process.
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
              <path d="M9.5 6.5V4.5H7.5V6.5H9.5ZM11.5 4.5V6.5H13.5V4.5H11.5ZM9.5 8.5H7.5V10.5H9.5V8.5ZM11.5 10.5H13.5V8.5H11.5V10.5ZM7.5 12.5V14.5H9.5V12.5H7.5ZM13.5 12.5V14.5H11.5V12.5H13.5ZM15.5 6.5V4.5H17.5V6.5H15.5ZM15.5 10.5V8.5H17.5V10.5H15.5ZM17.5 12.5V14.5H15.5V12.5H17.5Z" fill="currentColor"/>
            </svg>
            Scan Parcel
          </h1>
          <p className="page-subtitle">Scan QR code to update parcel status</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : message.includes('❌') ? 'alert-error' : 'alert-warning'}`}>
            {message}
          </div>
        )}

        {loading && (
          <div className="alert alert-warning">
            <div className="loading-spinner"></div>
            Loading parcel details...
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            </svg>
            Error: {error}
          </div>
        )}

        <div className="card">
          <div style={{ padding: 'var(--space-8)' }}>
            {scanning ? (
              <div>
                <h3 style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                  Position QR code in camera view
                </h3>
                <div style={{ 
                  border: '2px dashed var(--primary-300)', 
                  borderRadius: 'var(--radius-lg)', 
                  overflow: 'hidden',
                  backgroundColor: 'var(--secondary-50)'
                }}>
                  <QRCodeScanner onScan={handleScan} />
                </div>
                <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', color: 'var(--secondary-600)' }}>
                  Make sure the QR code is clearly visible and well-lit
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--success-500)', marginBottom: 'var(--space-4)' }}>
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                  </svg>
                  <h3>Scan Complete</h3>
                  <p style={{ color: 'var(--secondary-600)' }}>
                    {processing ? 'Processing parcel...' : 'Ready to scan another parcel'}
                  </p>
                </div>
                
                <button 
                  onClick={handleRestartScan} 
                  className="btn btn-primary"
                  disabled={processing}
                  style={{ marginRight: 'var(--space-3)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.5 6.5V4.5H7.5V6.5H9.5ZM11.5 4.5V6.5H13.5V4.5H11.5ZM9.5 8.5H7.5V10.5H9.5V8.5ZM11.5 10.5H13.5V8.5H11.5V10.5ZM7.5 12.5V14.5H9.5V12.5H7.5ZM13.5 12.5V14.5H11.5V12.5H13.5ZM15.5 6.5V4.5H17.5V6.5H15.5ZM15.5 10.5V8.5H17.5V10.5H15.5ZM17.5 12.5V14.5H15.5V12.5H17.5Z" fill="currentColor"/>
                    </svg>
                    Scan Another Parcel
                  </button>
                
                <button 
                  onClick={() => navigate('/agent/parcels')} 
                  className="btn btn-secondary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
                  </svg>
                  Back to Parcels
                </button>
              </div>
            )}
          </div>
        </div>

        {parcel && !loading && !error && (
          <div className="card" style={{ marginTop: 'var(--space-6)' }}>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                  <path d="M20 6L12 1L4 6L12 11L20 6Z" fill="currentColor"/>
                  <path d="M20 10V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V10L12 15L20 10Z" fill="currentColor"/>
                </svg>
                Scanned Parcel Details
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Tracking:</span>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{parcel.trackingNumber || parcel._id}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Status:</span>
                  <p style={{ margin: 0 }}>
                    <span className={`status-badge status-${parcel.status.toLowerCase().replace(' ', '-')}`}>
                      {parcel.status}
                    </span>
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Pickup:</span>
                  <p style={{ margin: 0 }}>{parcel.pickupAddress}</p>
                  {parcel.pickupContactName && (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--secondary-500)' }}>
                      Contact: {parcel.pickupContactName} ({parcel.pickupContactPhone})
                    </p>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Delivery:</span>
                  <p style={{ margin: 0 }}>{parcel.deliveryAddress}</p>
                  {parcel.recipientName && (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--secondary-500)' }}>
                      Recipient: {parcel.recipientName} ({parcel.recipientPhone})
                    </p>
                  )}
                </div>
                {parcel.paymentMethod === 'COD' && parcel.codAmount > 0 && (
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>COD Amount:</span>
                    <p style={{ margin: 0, color: 'var(--warning-600)', fontWeight: '600' }}>৳{parcel.codAmount}</p>
                  </div>
                )}
                {(parcel.fragile || parcel.urgent) && (
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Special Handling:</span>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
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
                {parcel.specialInstructions && (
                  <div style={{ gridColumn: '1 / -1', marginTop: 'var(--space-3)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)', fontWeight: '600' }}>Instructions:</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary-600)', fontStyle: 'italic', marginTop: 'var(--space-1)' }}>
                      {parcel.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanParcel;