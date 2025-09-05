import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardMetrics } from '../admin/adminSlice';
import { fetchUsers } from '../users/userSlice';
import { joinUserRoom } from '../../socket';
import socket from '../../socket'; // Add this import (adjust if named export)
import axios from 'axios';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { metrics, loading, error } = useSelector((state) => state.admin);
  const { token } = useSelector((state) => state.auth);
  const { users: deliveryAgents, loading: agentsLoading } = useSelector((state) => state.users);
  const [liveAgents, setLiveAgents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    dispatch(fetchDashboardMetrics());
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        joinUserRoom(user.id, user.role);
      }
    }
  }, [dispatch]);
  
  useEffect(() => {
    socket.on('parcelStatusUpdated', (parcel) => {
      setRecentActivity(prev => [{
        id: Date.now(),
        type: 'status_update',
        message: `Parcel ${parcel.trackingNumber} status updated to ${parcel.status}`,
        timestamp: new Date(),
        parcel: parcel
      }, ...prev.slice(0, 9)]);
    });
    
    socket.on('agentLocationUpdate', (data) => {
      setLiveAgents(prev => {
        const updated = prev.filter(agent => agent.agentId !== data.agentId);
        return [{
          agentId: data.agentId,
          location: data.agentLocation,
          lastUpdate: new Date()
        }, ...updated.slice(0, 9)];
      });
    });
    
    socket.on('parcelAssigned', (data) => {
      setRecentActivity(prev => [{
        id: Date.now(),
        type: 'assignment',
        message: `Parcel ${data.parcel.trackingNumber} assigned to ${data.agent.username}`,
        timestamp: new Date(),
        parcel: data.parcel,
        agent: data.agent
      }, ...prev.slice(0, 9)]);
    });
    
    return () => {
      socket.off('parcelStatusUpdated');
      socket.off('agentLocationUpdate');
      socket.off('parcelAssigned');
    };
  }, []);

  useEffect(() => {
    dispatch(fetchUsers('Delivery Agent'));
  }, [dispatch]);

  useEffect(() => {
    const fetchAssignmentMetrics = async () => {
      if (!token) return;
      
      setAssignmentLoading(true);
      try {
        const response = await axios.get('/api/admin/assignment/metrics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAssignmentMetrics(response.data);
      } catch (error) {
        console.error('Error fetching assignment metrics:', error);
      } finally {
        setAssignmentLoading(false);
      }
    };

    fetchAssignmentMetrics();
  }, [token]);

  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    assignedAgent: '',
    paymentMethod: '', // Added this
    format: 'csv',
  });

  const [reportLoading, setReportLoading] = useState(false);

  const [assignmentMetrics, setAssignmentMetrics] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const handleFilterChange = (e) => {
    setReportFilters({ ...reportFilters, [e.target.name]: e.target.value });
  };

  const handleGenerateReport = async () => {
    if (!token) {
      alert('Authentication required');
      return;
    }

    setReportLoading(true);
    try {
      const response = await axios.get('/api/admin/reports/parcels', {
        params: reportFilters,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = 'parcel_report';
      if (reportFilters.format === 'pdf') {
        filename += '.pdf';
      } else {
        filename += '.csv';
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          Error loading dashboard: {error}
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
              <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
            </svg>
            Admin Dashboard
          </h1>
          <p className="page-subtitle">Monitor system performance and generate reports</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>Daily Bookings</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--primary-500)' }}>
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7V10Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary-600)', margin: 0 }}>
            {metrics?.dailyBookings || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Today's bookings</span>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>Total Parcels</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--secondary-500)' }}>
              <path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
              <path d="M20 6L12 1L4 6L12 11L20 6Z" fill="currentColor"/>
              <path d="M20 10V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V10L12 15L20 10Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--secondary-600)', margin: 0 }}>
            {metrics?.totalParcels || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>All time</span>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>Delivered</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--success-500)' }}>
              <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success-600)', margin: 0 }}>
            {metrics?.deliveredParcels || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Successfully delivered</span>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>Failed Deliveries</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--error-500)' }}>
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--error-600)', margin: 0 }}>
            {metrics?.failedDeliveries || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Failed attempts</span>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>Total COD Amount</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--warning-500)' }}>
              <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.5 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.5 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.5 11.8 10.9Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning-600)', margin: 0 }}>
            ৳{metrics?.totalCodAmount || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Collected from deliveries</span>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>Pending COD</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--secondary-500)' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--secondary-600)', margin: 0 }}>
            ৳{metrics?.pendingCodAmount || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Awaiting collection</span>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>In Transit</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--primary-500)' }}>
              <path d="M18 8H20L23 12V17H21C21 18.66 19.66 20 18 20S15 18.66 15 17H9C9 18.66 7.66 20 6 20S3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5ZM18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary-600)', margin: 0 }}>
            {metrics?.inTransitParcels || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Currently in transit</span>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>Active Agents</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--success-500)' }}>
              <path d="M18 8H20L23 12V17H21C21 18.66 19.66 20 18 20S15 18.66 15 17H9C9 18.66 7.66 20 6 20S3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5ZM18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success-600)', margin: 0 }}>
            {assignmentMetrics?.activeAgents || 0} / {assignmentMetrics?.totalAgents || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Agents with location</span>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3>Unassigned Parcels</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--warning-500)' }}>
              <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
            </svg>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning-600)', margin: 0 }}>
            {assignmentMetrics?.unassignedParcels || 0}
          </p>
          <span style={{ fontSize: '0.875rem', color: 'var(--secondary-500)' }}>Awaiting assignment</span>
        </div>
      </div>

      {assignmentMetrics && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
              </svg>
              Agent Assignment Overview
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--primary-700)' }}>Average Workload</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-600)', margin: 0 }}>
                  {assignmentMetrics.workloadStats.avgWorkload?.toFixed(1) || 0}
                </p>
                <span style={{ fontSize: '0.875rem', color: 'var(--primary-600)' }}>parcels per agent</span>
              </div>
              
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--success-50)', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--success-700)' }}>Assigned Parcels</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-600)', margin: 0 }}>
                  {assignmentMetrics.assignedParcels}
                </p>
                <span style={{ fontSize: '0.875rem', color: 'var(--success-600)' }}>currently active</span>
              </div>
              
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--secondary-50)', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--secondary-700)' }}>Max Workload</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary-600)', margin: 0 }}>
                  {assignmentMetrics.workloadStats.maxWorkload || 0}
                </p>
                <span style={{ fontSize: '0.875rem', color: 'var(--secondary-600)' }}>busiest agent</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="reports-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
          </svg>
          Generate Reports
        </h3>
        
        <div className="filters">
          <div>
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={reportFilters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={reportFilters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label htmlFor="status">Status:</label>
            <select id="status" name="status" value={reportFilters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Picked Up">Picked Up</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div>
            <label htmlFor="paymentMethod">Payment Method:</label>
            <select id="paymentMethod" name="paymentMethod" value={reportFilters.paymentMethod} onChange={handleFilterChange}>
              <option value="">All Methods</option>
              <option value="COD">Cash on Delivery</option>
              <option value="prepaid">Prepaid</option>
            </select>
          </div>
          <div>
            <label htmlFor="assignedAgent">Assigned Agent:</label>
            <select id="assignedAgent" name="assignedAgent" value={reportFilters.assignedAgent} onChange={handleFilterChange}>
              <option value="">All Agents</option>
              {agentsLoading ? (
                <option disabled>Loading agents...</option>
              ) : (
                deliveryAgents.map((agent) => (
                  <option key={agent._id} value={agent._id}>{agent.username}</option>
                ))
              )}
            </select>
          </div>
        </div>
        
        <div className="report-format">
          <label htmlFor="format">Format:</label>
          <select id="format" name="format" value={reportFilters.format} onChange={handleFilterChange}>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        
        <button 
          onClick={handleGenerateReport} 
          disabled={reportLoading}
          className="btn btn-primary"
          style={{ marginTop: 'var(--space-4)' }}
        >
          {reportLoading ? (
            <>
              <div className="loading-spinner"></div>
              Generating...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Live Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="card">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              Recent Activity
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recentActivity.length === 0 ? (
                <p style={{ color: 'var(--secondary-500)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No recent activity
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} style={{
                      padding: 'var(--space-3)',
                      background: activity.type === 'assignment' ? 'var(--success-50)' : 'var(--primary-50)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${activity.type === 'assignment' ? 'var(--success-200)' : 'var(--primary-200)'}`
                    }}>
                      <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>
                        {activity.message}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary-500)' }}>
                        {activity.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
              </svg>
              Live Agent Locations ({liveAgents.length})
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {liveAgents.length === 0 ? (
                <p style={{ color: 'var(--secondary-500)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No agents currently tracking location
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {liveAgents.map((agent) => (
                    <div key={agent.agentId} style={{
                      padding: 'var(--space-3)',
                      background: 'var(--success-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--success-200)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--success-500)',
                          animation: 'pulse 2s infinite'
                        }}></div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          Agent {agent.agentId.slice(-6)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary-600)' }}>
                        Location: {agent.location.latitude.toFixed(4)}, {agent.location.longitude.toFixed(4)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary-500)' }}>
                        Updated: {agent.lastUpdate.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;