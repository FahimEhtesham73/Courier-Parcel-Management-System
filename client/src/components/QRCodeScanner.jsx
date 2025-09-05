import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const QRCodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  // Your original UI animation code is untouched.
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const stableOnScan = useCallback(onScan, [onScan]);

  // FIX: This is the new, robust scanning logic.
  // It gives the ZXing library full control of the camera, which resolves the conflict.
  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();

    // This function now correctly handles the entire process: starting the camera,
    // attaching it to the video element, and running the scan loop.
    const startScan = async () => {
      try {
        await codeReader.decodeFromConstraints(
          { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } },
          videoRef.current,
          (result, err) => {
            // A result was successfully found
            if (result && scanning) {
              const resultText = result.getText();
              setScanResult(resultText);
              setScanning(false); // Stop scanning
              codeReader.reset(); // Release the camera
              stableOnScan(resultText);
            }
            
            // An error occurred, but we ignore NotFoundException, which is normal.
            if (err && !(err instanceof NotFoundException)) {
              console.error('QR scanning error:', err);
              setError('An unexpected error occurred during scanning.');
              setScanning(false);
            }
          }
        );
      } catch (err) {
        console.error('Camera initialization error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera access denied. Please allow camera permissions and refresh the page.');
        } else {
          setError('Could not start camera. It might be in use by another application.');
        }
        setScanning(false);
      }
    };

    startScan();

    // This cleanup function is critical to release the camera when the component is unmounted.
    return () => {
      codeReader.reset();
    };
  }, [scanning, stableOnScan]);

  const restartScan = () => {
    setError(null);
    setScanResult(null);
    setScanning(true);
  };

  // All of your UI for displaying errors and success messages is preserved exactly as you wrote it.
  if (error) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--error-50)', borderRadius: 'var(--radius-lg)', border: '2px solid var(--error-200)' }}>
        <h3 style={{ color: 'var(--error-700)', marginBottom: 'var(--space-2)' }}>Scanning Error</h3>
        <p style={{ color: 'var(--error-600)', marginBottom: 'var(--space-4)' }}>{error}</p>
        <button onClick={restartScan} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  if (scanResult) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--success-50)', borderRadius: 'var(--radius-lg)', border: '2px solid var(--success-200)' }}>
        <h3 style={{ color: 'var(--success-700)', marginBottom: 'var(--space-2)' }}>QR Code Detected</h3>
        <p style={{ color: 'var(--success-600)', marginBottom: 'var(--space-4)', wordBreak: 'break-all' }}>Result: {scanResult}</p>
        <button onClick={restartScan} className="btn btn-primary">Scan Another</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* FIX: The <Webcam> component is replaced with a standard <video> element.
          This allows the ZXing library to control the camera directly, fixing the bug. */}
      <video
        ref={videoRef}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      
      {/* Your original scanning overlay and UI is completely untouched. */}
      {scanning && (
        <>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(60vw, 250px)',
            height: 'min(60vw, 250px)',
            border: '4px solid var(--primary-500)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(59, 130, 246, 0.1)',
            animation: 'pulse 2s infinite',
            boxSizing: 'border-box'
          }}></div>
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
        </>
      )}
    </div>
  );
};

export default QRCodeScanner;
