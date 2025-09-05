import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socket, { joinUserRoom, acceptParcel } from '../socket';
import { updateUserVerification } from '../features/auth/authSlice';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) return;
    
    // Join appropriate room based on user role
    joinUserRoom(user.id, user.role);

    // Listen for parcel status updates
    socket.on('parcelStatusUpdated', (updatedParcel) => {
      if (user.role === 'Customer' && updatedParcel.customer === user.id) {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Parcel Status Updated',
          message: `Your parcel ${updatedParcel.trackingNumber} is now ${updatedParcel.status}`,
          timestamp: new Date()
        });
      }
    });

    // Listen for new parcel notifications (for agents)
    socket.on('newParcelAvailable', (data) => {
      if (user.role === 'Delivery Agent') {
        // Only show notification if agent is verified
        if (!user.isVerified) return;
        
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'New Parcel Available',
          message: `New parcel available from ${data.customer.username}. Pickup: ${data.parcel.pickupAddress}`,
          timestamp: new Date(),
          action: {
            type: 'accept-parcel',
            parcelId: data.parcel._id,
            label: 'Accept Delivery'
          }
        });
      }
    });
    
    // Listen for agent assignment notifications (for customers)
    socket.on('agentAssigned', (data) => {
      if (user.role === 'Customer') {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Agent Assigned',
          message: `${data.agent.name} has been assigned to your parcel ${data.parcel.trackingNumber}`,
          timestamp: new Date()
        });
      }
    });
    
    // Listen for real-time agent location updates (for customers)
    socket.on('agentLocationUpdate', (data) => {
      if (user.role === 'Customer') {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Agent Location Update',
          message: `Your delivery agent is on the move`,
          timestamp: new Date(),
          autoRemove: true
        });
      }
    });
    
    // Listen for parcel acceptance confirmation (for agents)
    socket.on('parcelAccepted', (data) => {
      if (user.role === 'Delivery Agent') {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Parcel Accepted',
          message: `You have successfully accepted parcel ${data.parcel.trackingNumber}`,
          timestamp: new Date()
        });
      }
    });
    
    // Listen for parcel taken by other agents
    socket.on('parcelTaken', (data) => {
      if (user.role === 'Delivery Agent') {
        // Remove any pending notifications for this parcel
        setNotifications(prev => prev.filter(notif => 
          !(notif.action?.parcelId === data.parcelId)
        ));
      }
    });
    // Listen for parcel assignments (for agents)
    socket.on('parcelAssigned', ({ parcel, agent }) => {
      if (user.role === 'Delivery Agent' && agent._id === user.id) {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'New Parcel Assigned',
          message: `You have been assigned parcel ${parcel.trackingNumber}`,
          timestamp: new Date()
        });
      }
    });

    // Listen for verification updates
    socket.on('verificationReviewed', (data) => {
      if (user.role === 'Delivery Agent' && data.agentId === user.id) {
        // Update user verification status in Redux store
        if (data.status === 'Approved') {
          dispatch(updateUserVerification(true));
        } else if (data.status === 'Rejected') {
          dispatch(updateUserVerification(false));
        }
        
        addNotification({
          id: Date.now(),
          type: data.status === 'Approved' ? 'success' : 'error',
          title: `Verification ${data.status}`,
          message: `Your verification has been ${data.status.toLowerCase()} by ${data.reviewedBy}`,
          timestamp: new Date()
        });
      }
    });
    // Listen for agent location updates (for admins)
    socket.on('agentLocationUpdated', (locationData) => {
      if (user.role === 'Admin') {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Agent Location Updated',
          message: `Agent location updated`,
          timestamp: new Date()
        });
      }
    });

    return () => {
      socket.off('parcelStatusUpdated');
      socket.off('newParcelAvailable');
      socket.off('parcelAssigned');
      socket.off('agentAssigned');
      socket.off('agentLocationUpdate');
      socket.off('parcelAccepted');
      socket.off('parcelTaken');
      socket.off('verificationReviewed');
      socket.off('agentLocationUpdated');
    };
  }, [user]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
    
    // Auto-remove after 5 seconds (or 2 seconds for autoRemove notifications)
    const timeout = notification.autoRemove ? 2000 : 5000;
    setTimeout(() => {
      removeNotification(notification.id);
    }, timeout);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };
  
  const handleNotificationAction = (notification) => {
    if (notification.action?.type === 'accept-parcel') {
      acceptParcel(notification.action.parcelId, user.id);
      removeNotification(notification.id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
        );
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-content">
            <h4 className="notification-title">{notification.title}</h4>
            <p className="notification-message">{notification.message}</p>
            {notification.action && (
              <button
                onClick={() => handleNotificationAction(notification)}
                className="notification-action-btn"
              >
                {notification.action.label}
              </button>
            )}
            <span className="notification-time">
              {notification.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      ))}

      <style jsx>{`
        .notification-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-width: 400px;
          width: 100%;
        }

        @media (max-width: 480px) {
          .notification-container {
            top: 70px;
            right: 10px;
            left: 10px;
            max-width: none;
          }
        }

        .notification {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          border-left: 4px solid;
          cursor: pointer;
          animation: slideIn 0.3s ease-out;
          transition: all 0.2s ease;
        }

        .notification:hover {
          transform: translateY(-2px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .notification-success {
          border-left-color: var(--success-500);
        }

        .notification-error {
          border-left-color: var(--error-500);
        }

        .notification-warning {
          border-left-color: var(--warning-500);
        }

        .notification-info {
          border-left-color: var(--primary-500);
        }

        .notification-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .notification-success .notification-icon {
          background: var(--success-500);
        }

        .notification-error .notification-icon {
          background: var(--error-500);
        }

        .notification-warning .notification-icon {
          background: var(--warning-500);
        }

        .notification-info .notification-icon {
          background: var(--primary-500);
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          margin: 0 0 var(--space-1) 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--secondary-800);
        }

        .notification-message {
          margin: 0 0 var(--space-2) 0;
          font-size: 0.8rem;
          color: var(--secondary-600);
          line-height: 1.4;
        }

        .notification-time {
          font-size: 0.75rem;
          color: var(--secondary-500);
        }

        .notification-close {
          flex-shrink: 0;
          background: none;
          border: none;
          color: var(--secondary-400);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }

        .notification-close:hover {
          background: var(--secondary-100);
          color: var(--secondary-600);
        }
        
        .notification-action-btn {
          background: var(--primary-500);
          color: white;
          border: none;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: var(--space-2);
          transition: all 0.2s ease;
        }
        
        .notification-action-btn:hover {
          background: var(--primary-600);
          transform: translateY(-1px);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;