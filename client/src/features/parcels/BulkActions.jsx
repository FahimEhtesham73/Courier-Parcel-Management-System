import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const BulkActions = ({ selectedParcels, onActionComplete }) => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');

  const handleBulkAction = async () => {
    if (!action || selectedParcels.length === 0) return;

    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const promises = selectedParcels.map(parcelId => {
        switch (action) {
          case 'assign-agent':
            return axios.put(`/api/parcels/${parcelId}/assign`, {}, config);
          case 'mark-picked-up':
            return axios.put(`/api/parcels/${parcelId}/status`, { status: 'Picked Up' }, config);
          case 'mark-in-transit':
            return axios.put(`/api/parcels/${parcelId}/status`, { status: 'In Transit' }, config);
          case 'export-labels':
            return axios.get(`/api/parcels/${parcelId}/label`, { ...config, responseType: 'blob' });
          default:
            return Promise.resolve();
        }
      });

      if (action === 'export-labels') {
        // Handle label export differently
        const responses = await Promise.all(promises);
        responses.forEach((response, index) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `label-${selectedParcels[index]}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        });
      } else {
        await Promise.all(promises);
      }

      alert(`Bulk action completed for ${selectedParcels.length} parcels`);
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Error performing bulk action');
    } finally {
      setLoading(false);
    }
  };

  if (selectedParcels.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--space-6)',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      border: '1px solid var(--secondary-200)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      zIndex: 100
    }}>
      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
        {selectedParcels.length} selected
      </span>
      
      <select
        value={action}
        onChange={(e) => setAction(e.target.value)}
        className="form-select"
        style={{ minWidth: '200px' }}
      >
        <option value="">Select Action</option>
        <option value="assign-agent">Auto-assign Agent</option>
        <option value="mark-picked-up">Mark as Picked Up</option>
        <option value="mark-in-transit">Mark as In Transit</option>
        <option value="export-labels">Export Labels</option>
      </select>
      
      <button
        onClick={handleBulkAction}
        disabled={!action || loading}
        className="btn btn-primary"
      >
        {loading ? (
          <>
            <div className="loading-spinner"></div>
            Processing...
          </>
        ) : (
          'Apply'
        )}
      </button>
    </div>
  );
};

export default BulkActions;