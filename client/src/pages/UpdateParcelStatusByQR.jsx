
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import QRCodeScanner from '../components/QRCodeScanner';
import { updateParcelStatus } from '../features/parcels/parcelSlice';

const UpdateParcelStatusByQR = () => {
    const dispatch = useDispatch();
    const { user, token } = useSelector((state) => state.auth);
    const [scannedParcelId, setScannedParcelId] = useState(null);
    const [parcel, setParcel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [updateStatus, setUpdateStatus] = useState('');
    const [failureReason, setFailureReason] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState(false);

    useEffect(() => {
        if (scannedParcelId && token) {
            const fetchParcelDetails = async () => {
                setLoading(true);
                setError(null);
                setParcel(null);
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    const { data } = await axios.get(`/api/parcels/${scannedParcelId}`, config);
                    setParcel(data.parcel);
                    setUpdateStatus(''); // Reset status dropdown
                    setFailureReason(''); // Reset failure reason
                    setUpdateSuccess(false); // Reset success message
                } catch (err) {
                    setError('Failed to fetch parcel details. The QR code may be invalid or you may not have permission to view this parcel.');
                    console.error('Error fetching parcel by ID:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchParcelDetails();
        }
    }, [scannedParcelId, token]);

    const handleScan = (result) => {
        if (result) {
            setScannedParcelId(result);
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!updateStatus) {
            setError('Please select a new status.');
            return;
        }
        
        try {
            const updateData = { id: parcel._id, status: updateStatus };
            if (updateStatus === 'Failed') {
                updateData.failureReason = failureReason;
            }
            
            await dispatch(updateParcelStatus(updateData)).unwrap();
            setUpdateSuccess(true);
            setError(null);

            // Fetch latest parcel details to show the change
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`/api/parcels/${scannedParcelId}`, config);
            setParcel(data.parcel);

        } catch (err) {
            setError(err.message || 'Failed to update status.');
            console.error('Error updating parcel status:', err);
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
    
    const renderStatusOptions = (currentStatus) => {
        switch (currentStatus) {
            case 'Pending':
                return <option value="Picked Up">Picked Up</option>;
            case 'Picked Up':
                return <option value="In Transit">In Transit</option>;
            case 'In Transit':
                return (
                    <>
                        <option value="Delivered">Delivered</option>
                        <option value="Failed">Failed</option>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container fade-in">
            <div className="page-header">
                <h1 className="page-title">Update Status by QR</h1>
                <p className="page-subtitle">Scan a parcel's QR code to update its delivery status.</p>
            </div>

            {!scannedParcelId ? (
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ padding: 'var(--space-6)' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>Scan Parcel QR Code</h3>
                        <QRCodeScanner onScan={handleScan} />
                    </div>
                </div>
            ) : (
                <div>
                    {loading && <div className="loading-container"><div className="loading-spinner"></div><p>Loading Parcel Details...</p></div>}
                    {error && <div className="alert alert-error">{error}</div>}
                    {parcel && (
                        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                            <div style={{ padding: 'var(--space-6)' }}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)'}}>
                                    <h3 style={{margin: 0}}>Parcel Details</h3>
                                    <div className={getStatusBadgeClass(parcel.status)}><div className="status-dot"></div>{parcel.status}</div>
                                </div>
                                <div style={{marginBottom: 'var(--space-4)'}}>
                                    <p><strong>Tracking #:</strong> {parcel.trackingNumber}</p>
                                    <p><strong>From:</strong> {parcel.pickupAddress}</p>
                                    <p><strong>To:</strong> {parcel.deliveryAddress}</p>
                                </div>

                                {parcel.status === 'Delivered' || parcel.status === 'Failed' ? (
                                     <div className="alert alert-success">This parcel's status is final and cannot be updated.</div>
                                ) : (
                                    <form onSubmit={handleUpdateStatus}>
                                        <div className="form-group">
                                            <label htmlFor="status">Update Status</label>
                                            <select
                                                id="status"
                                                className="form-select"
                                                value={updateStatus}
                                                onChange={(e) => setUpdateStatus(e.target.value)}
                                            >
                                                <option value="" disabled>Select new status</option>
                                                {renderStatusOptions(parcel.status)}
                                            </select>
                                        </div>
                                        {updateStatus === 'Failed' && (
                                            <div className="form-group">
                                                <label htmlFor="failureReason">Failure Reason</label>
                                                <textarea
                                                    id="failureReason"
                                                    className="form-select"
                                                    value={failureReason}
                                                    onChange={(e) => setFailureReason(e.target.value)}
                                                    placeholder="e.g., Recipient not available"
                                                    required
                                                />
                                            </div>
                                        )}
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                            Submit Update
                                        </button>
                                    </form>
                                )}
                                {updateSuccess && <div className="alert alert-success" style={{marginTop: '1rem'}}>Status updated successfully!</div>}
                            </div>
                        </div>
                    )}
                     <div style={{textAlign: 'center', marginTop: '2rem'}}>
                        <button onClick={() => setScannedParcelId(null)} className="btn btn-secondary">Scan Another Parcel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdateParcelStatusByQR;
