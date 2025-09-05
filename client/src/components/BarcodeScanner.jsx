
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';

const BarcodeScanner = ({ onScan }) => {
  const webcamRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const codeReader = new BrowserMultiFormatReader();

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.ASSUME_GS1, true);

    const startScanning = async () => {
      if (webcamRef.current && scanning) {
        try {
          const videoElement = webcamRef.current.video;
          if (!videoElement) {
           
            setTimeout(startScanning, 100);
            return;
          }

          codeReader.decodeFromVideoDevice(undefined, videoElement, (result, error) => {
            if (result) {
              console.log('Scanned Barcode:', result.getText());
              setScanning(false); 
              if (onScan) {
                onScan(result.getText());
              }
              codeReader.reset(); 
            }
          
          });
        } catch (err) {
          console.error('Error starting barcode scanner:', err);
          setScanning(false); 
        }
      } else {
        codeReader.reset(); 
      }
    };

    startScanning();

    return () => {
      codeReader.reset(); 
    };
  }, [scanning, onScan]);

  return (
    <div>
      {scanning ? (
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment" 
          }}
        />
      ) : (
        <p>Scanning paused. Barcode detected or error occurred.</p>
      )}
   
      {!scanning && <button onClick={() => setScanning(true)}>Scan Again</button>}
    </div>
  );
};

export default BarcodeScanner;