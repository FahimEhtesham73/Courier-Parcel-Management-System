import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';

const QRCodeScanner = ({ onScan }) => {
  const webcamRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const codeReader = new BrowserMultiFormatReader();

  useEffect(() => {
    let isActive = true;

    const startScanning = async () => {
      if (!scanning || !webcamRef.current) return;

      try {
        const videoElement = webcamRef.current.video;
        if (!videoElement) {
          setTimeout(startScanning, 100);
          return;
        }

        // Continuous scanning
        const scanFrame = async () => {
          if (!isActive || !scanning) return;

          try {
            const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoElement);
            if (result && onScan) {
              console.log('QR Code scanned:', result.getText());
              setScanning(false);
              onScan(result.getText());
            }
          } catch (err) {
            // Ignore decode errors (no QR code in frame)
            if (err.name !== 'NotFoundException') {
              console.error('QR scanning error:', err);
            }
          }

          // Continue scanning
          if (isActive && scanning) {
            setTimeout(scanFrame, 100);
          }
        };

        scanFrame();
      } catch (err) {
        console.error('Error starting QR scanner:', err);
        setError('Failed to start camera. Please check permissions.');
        setScanning(false);
      }
    };

    startScanning();

    return () => {
      isActive = false;
      codeReader.reset();
    };
  }, [scanning, onScan]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment"
  };

  if (error) {
    return (
      <div style={{ 
        padding: 'var(--space-8)', 
        textAlign: 'center',
        background: 'var(--error-50)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--error-200)'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--error-500)', marginBottom: 'var(--space-4)' }}>
          <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
        </svg>
        <h3 style={{ color: 'var(--error-700)', marginBottom: 'var(--space-2)' }}>Camera Error</h3>
        <p style={{ color: 'var(--error-600)', marginBottom: 'var(--space-4)' }}>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setScanning(true);
          }}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {scanning ? (
        <div>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-lg)' }}
          />
          
          {/* Scanning overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            border: '3px solid var(--primary-500)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{
              width: '180px',
              height: '180px',
              border: '2px dashed var(--primary-400)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-600)',
              fontSize: '0.875rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Position QR Code Here
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: 'var(--space-4)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem'
          }}>
            <div className="loading-spinner" style={{ marginRight: 'var(--space-2)' }}></div>
            Scanning for QR code...
          </div>
        </div>
      ) : (
        <div style={{ 
          padding: 'var(--space-8)', 
          textAlign: 'center',
          background: 'var(--success-50)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--success-200)'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--success-500)', marginBottom: 'var(--space-4)' }}>
            <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
          </svg>
          <h3 style={{ color: 'var(--success-700)', marginBottom: 'var(--space-2)' }}>QR Code Detected</h3>
          <p style={{ color: 'var(--success-600)' }}>Processing parcel information...</p>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
};

export default QRCodeScanner;