import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Analytics = () => {
  const { token } = useSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`/api/admin/analytics?period=${period}`, config);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateObj) => {
    return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
            </svg>
            Analytics Dashboard
          </h1>
          <p className="page-subtitle">Detailed insights and trends</p>
        </div>
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="form-select"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {analytics && (
        <>
          <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Daily Bookings Trend</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'var(--space-2)' }}>
                {analytics.dailyBookings.map((day, index) => (
                  <div key={index} style={{ textAlign: 'center', padding: 'var(--space-2)' }}>
                    <div style={{ 
                      height: `${Math.max(day.count * 10, 20)}px`, 
                      background: 'var(--primary-500)', 
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-1)'
                    }}></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary-600)' }}>
                      {formatDate(day._id)}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                      {day.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
            <div className="card">
              <div style={{ padding: 'var(--space-6)' }}>
                <h3 style={{ marginBottom: 'var(--space-4)' }}>Status Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {analytics.statusDistribution.map((status) => (
                    <div key={status._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`status-badge status-${status._id.toLowerCase().replace(' ', '-')}`}>
                        {status._id}
                      </span>
                      <span style={{ fontWeight: '600' }}>{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ padding: 'var(--space-6)' }}>
                <h3 style={{ marginBottom: 'var(--space-4)' }}>Payment Methods</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {analytics.paymentDistribution.map((payment) => (
                    <div key={payment._id} style={{ 
                      padding: 'var(--space-3)', 
                      background: 'var(--secondary-50)', 
                      borderRadius: 'var(--radius-md)' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                        <span style={{ fontWeight: '600' }}>{payment._id}</span>
                        <span>{payment.count} parcels</span>
                      </div>
                      {payment.totalAmount > 0 && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                          Total Amount: ৳{payment.totalAmount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;