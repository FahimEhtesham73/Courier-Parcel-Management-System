import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';

const QRCodeScanner = ({ onScan }) => {
  const webcamRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    let isActive = true;
    let scanInterval;

    const startScanning = async () => {
      if (!scanning || !webcamRef.current) return;

      try {
        const videoElement = webcamRef.current.video;
        if (!videoElement) {
          setTimeout(startScanning, 100);
          return;
        }

        // Wait for video to be ready
        if (videoElement.readyState < 2) {
          setTimeout(startScanning, 100);
          return;
        }

        // Use decodeFromVideoElement instead of decodeOnceFromVideoDevice
        scanInterval = setInterval(async () => {
          if (!isActive || !scanning || !videoElement) return;

          try {
            const result = await codeReader.current.decodeFromVideoElement(videoElement);
            if (result && result.getText()) {
              console.log('QR Code scanned:', result.getText());
              setScanResult(result.getText());
              setScanning(false);
              clearInterval(scanInterval);
              if (onScan) {
                onScan(result.getText());
              }
            }
          } catch (err) {
            // Ignore decode errors (no QR code in frame)
            if (err.name !== 'NotFoundException') {
              console.error('QR scanning error:', err);
            }
          }
        }, 500); // Scan every 500ms

      } catch (err) {
        console.error('Error starting QR scanner:', err);
        setError('Failed to start camera. Please check permissions and try again.');
        setScanning(false);
      }
    };

    startScanning();

    return () => {
      isActive = false;
      if (scanInterval) {
        clearInterval(scanInterval);
      }
      codeReader.current.reset();
    };
  }, [scanning, onScan]);

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "environment"
  };

  const restartScan = () => {
    setError(null);
    setScanResult(null);
    setScanning(true);
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
          onClick={restartScan}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (scanResult) {
    return (
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
        <p style={{ color: 'var(--success-600)', marginBottom: 'var(--space-4)' }}>Processing parcel information...</p>
        <div style={{ 
          background: 'white', 
          padding: 'var(--space-3)', 
          borderRadius: 'var(--radius-md)', 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.875rem',
          marginBottom: 'var(--space-4)',
          wordBreak: 'break-all'
        }}>
          {scanResult}
        </div>
        <button 
          onClick={restartScan}
          className="btn btn-primary"
        >
          Scan Another
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
            style={{ 
              width: '100%', 
              height: 'auto', 
              borderRadius: 'var(--radius-lg)',
              maxHeight: '400px',
              objectFit: 'cover'
            }}
            onUserMediaError={(error) => {
              console.error('Webcam error:', error);
              setError('Camera access denied. Please allow camera permissions and refresh the page.');
              setScanning(false);
            }}
          />
          
          {/* Scanning overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '250px',
            height: '250px',
            border: '4px solid var(--primary-500)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{
              width: '220px',
              height: '220px',
              border: '2px dashed var(--primary-400)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-600)',
              fontSize: '0.875rem',
              fontWeight: '600',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.9)'
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
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <div className="loading-spinner"></div>
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
          70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
};

export default QRCodeScanner;