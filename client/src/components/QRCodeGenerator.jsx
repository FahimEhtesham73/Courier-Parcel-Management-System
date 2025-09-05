import React from 'react';
import QRCode from 'react-qr-code';

const QRCodeGenerator = ({ value, size = 200, level = 'M' }) => {
  if (!value) {
    return (
      <div style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--secondary-100)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--secondary-500)'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 5C3 3.89 3.89 3 5 3H19C20.11 3 21 3.89 21 5V19C21 20.11 20.11 21 19 21H5C3.89 21 3 20.11 3 19V5ZM5 5V19H19V5H5ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="currentColor"/>
        </svg>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 'var(--space-4)', 
      background: 'white', 
      borderRadius: 'var(--radius-lg)',
      display: 'inline-block',
      boxShadow: 'var(--shadow-md)'
    }}>
      <QRCode
        value={value}
        size={size}
        level={level}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    </div>
  );
};

export default QRCodeGenerator;