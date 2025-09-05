import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import LogoutButton from './LogoutButton';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, token } = useSelector((state) => state.auth);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link to="/" className="brand-link">
              <div className="brand-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                  <path d="M20 6L12 1L4 6L12 11L20 6Z" fill="currentColor"/>
                  <path d="M20 10V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V10L12 15L20 10Z" fill="currentColor"/>
                </svg>
              </div>
              <span className="brand-text">CourierPro</span>
            </Link>
          </div>

          <div className="navbar-menu">
            {!token ? (
              <div className="navbar-auth">
                <Link to="/track" className="btn btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22C13.18 22 14.32 21.8 15.38 21.44L14.54 20.6C13.75 20.86 12.89 21 12 21C7.03 21 3 16.97 3 12S7.03 3 12 3 21 7.03 21 12C21 12.89 20.86 13.75 20.6 14.54L21.44 15.38C21.8 14.32 22 13.18 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor"/>
                  </svg>
                  Track Parcel
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  {t('login')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('register')}
                </Link>
              </div>
            ) : (
              <div className="navbar-user">
                <div className="user-menu">
                  {user && user.role === 'Admin' && (
                    <div className="menu-section">
                      <Link to="/admin/dashboard" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
                        </svg>
                        Dashboard
                      </Link>
                      <Link to="/parcels" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" fill="currentColor"/>
                        </svg>
                        Manage Parcels
                      </Link>
                      <Link to="/admin/verifications" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 17H6V15.5C6 13.83 9.33 13 12 13S18 13.83 18 15.5V17Z" fill="currentColor"/>
                        </svg>
                        Agent Verifications
                      </Link>
                      <Link to="/admin/analytics" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
                        </svg>
                        Analytics
                      </Link>
                      <Link to="/admin/users" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12 12 10.2 12 8 13.8 4 16 4ZM16 14C20.4 14 24 15.8 24 18V20H8V18C8 15.8 11.6 14 16 14ZM12.5 11.5C10.3 11.5 8.5 9.7 8.5 7.5S10.3 3.5 12.5 3.5 16.5 5.3 16.5 7.5 14.7 11.5 12.5 11.5ZM12.5 13C16.9 13 20.5 14.8 20.5 17V19H4.5V17C4.5 14.8 8.1 13 12.5 13Z" fill="currentColor"/>
                        </svg>
                        User Management
                      </Link>
                    </div>
                  )}
                  
                  {user && user.role === 'Delivery Agent' && (
                    <div className="menu-section">
                      <Link to="/agent/parcels" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 8H20L23 12V17H21C21 18.66 19.66 20 18 20S15 18.66 15 17H9C9 18.66 7.66 20 6 20S3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17S6.83 15.5 6 15.5 4.5 16.17 4.5 17 5.17 18.5 6 18.5ZM18 18.5C18.83 18.5 19.5 17.83 19.5 17S18.83 15.5 18 15.5 16.5 16.17 16.5 17 17.17 18.5 18 18.5Z" fill="currentColor"/>
                        </svg>
                        My Deliveries
                      </Link>
                      <Link to="/agent/verification" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9S13.1 11 12 11 10 10.1 10 9 10.9 7 12 7ZM18 17H6V15.5C6 13.83 9.33 13 12 13S18 13.83 18 15.5V17Z" fill="currentColor"/>
                        </svg>
                        Verification
                      </Link>
                      <Link to="/agent/scan" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.5 6.5V4.5H7.5V6.5H9.5ZM11.5 4.5V6.5H13.5V4.5H11.5ZM9.5 8.5H7.5V10.5H9.5V8.5ZM11.5 10.5H13.5V8.5H11.5V10.5ZM7.5 12.5V14.5H9.5V12.5H7.5ZM13.5 12.5V14.5H11.5V12.5H13.5ZM15.5 6.5V4.5H17.5V6.5H15.5ZM15.5 10.5V8.5H17.5V10.5H15.5ZM17.5 12.5V14.5H15.5V12.5H17.5Z" fill="currentColor"/>
                        </svg>
                        Scan Parcel
                      </Link>
                      <Link to="/agent/route" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 17V5L15 7V19Z" fill="currentColor"/>
                        </svg>
                        Delivery Route
                      </Link>
                    </div>
                  )}
                  
                  {user && user.role === 'Customer' && (
                    <div className="menu-section">
                      <Link to="/create-parcel" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                        </svg>
                        Book Parcel
                      </Link>
                      <Link to="/parcels" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
                        </svg>
                        My Parcels
                      </Link>
                      <Link to="/track" className="menu-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22C13.18 22 14.32 21.8 15.38 21.44L14.54 20.6C13.75 20.86 12.89 21 12 21C7.03 21 3 16.97 3 12S7.03 3 12 3 21 7.03 21 12C21 12.89 20.86 13.75 20.6 14.54L21.44 15.38C21.8 14.32 22 13.18 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor"/>
                        </svg>
                        Track Parcel
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="user-profile">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{user?.username}</span>
                      <span className="user-role">{user?.role}</span>
                    </div>
                  </div>
                  <LogoutButton />
                </div>
              </div>
            )}
            
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;