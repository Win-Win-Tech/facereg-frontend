import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';
import './WebcamCapture.css';

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [model, setModel] = useState(null);
  const [started, setStarted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const isProcessingRef = useRef(false);
  const modelLoadedRef = useRef(false);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, exiting: true } : toast
    ));
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((type, title, message) => {
    const id = Date.now();
    const toast = { id, type, title, message };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      removeToast(id);
    }, 2000);
  }, [removeToast]);

  // Lazy-load model when user clicks start
  useEffect(() => {
    if (!started || modelLoadedRef.current) return;
    let cancelled = false;
    
    const loadModel = async () => {
      try {
        showToast('info', 'Loading Model', 'Initializing face detection...');
        const loadedModel = await blazeface.load();
        if (!cancelled) {
          setModel(loadedModel);
          modelLoadedRef.current = true;
          showToast('success', 'Ready', 'Face detection is active');
        }
      } catch (err) {
        console.error('Failed to load model', err);
        if (!cancelled) {
          showToast('error', 'Error', 'Failed to load face detection model');
        }
      }
    };
    
    loadModel();
    return () => {
      cancelled = true;
    };
  }, [started, showToast]);

  const stopCamera = useCallback(() => {
    try {
      const stream = webcamRef.current?.video?.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.warn('Error stopping camera tracks', e);
    }
    setCameraActive(false);
    setFaceDetected(false);
  }, []);

  const captureAndSend = useCallback(async () => {
    if (!webcamRef.current || isProcessingRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    
    try {
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      const response = await axios.post(
        //'http://127.0.0.1:8000/api/attendance/',
        //'http://147.93.27.224:8002/api/attendance/',
        'https://apigatekeeper.cloudgentechnologies.com/api/attendance/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.employee) {
        // Face is registered and recognized
        showToast(
          'success',
          'Face Recognized',
          `Welcome ${response.data.employee}! Attendance marked at ${response.data.timestamp}`
        );
      } else {
        showToast(
          'error',
          'Unknown Face',
          'This face is not registered in the system. Please contact administrator.'
        );
      }
      
      stopCamera();
      
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      let errMsg = 'Server connection failed';
      let errTitle = 'Connection Error';
      
      if (error.response?.data?.error) {
        // Check specific error messages from backend
        if (error.response.data.error.includes('No face detected')) {
          errTitle = 'No Face Found';
          errMsg = 'Please ensure your face is clearly visible in the frame';
        } else if (error.response.data.error.includes('not registered') || 
                   error.response.data.error.includes('not recognized')) {
          errTitle = 'Unregistered Face';
          errMsg = 'Your face is not registered in the system. Please contact administrator.';
        }
      }
      
      showToast('error', errTitle, errMsg);
      
      stopCamera();
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [showToast, stopCamera]);

  // Face detection
  useEffect(() => {
    if (!started || !cameraActive || !model) {
      setFaceDetected(false);
      return;
    }

    let lastFaceDetected = false;

    const detectFace = async () => {
      if (
        !webcamRef.current ||
        !webcamRef.current.video ||
        webcamRef.current.video.readyState !== 4 ||
        isProcessingRef.current
      ) {
        setFaceDetected(false);
        return;
      }

      try {
        const predictions = await model.estimateFaces(webcamRef.current.video, false);
        const detected = predictions && predictions.length > 0;
        setFaceDetected(detected);
        
        if (detected) {
          if (!lastFaceDetected) {
            showToast('info', 'Face Detected', 'Please keep your face in the frame');
          }
          if (!isProcessingRef.current) {
            captureAndSend();
          }
        } else {
          // Show message immediately when no face is detected
          if (!isProcessingRef.current) {
            showToast('error', 'No Face Detected', 'Please position your face in the frame');
          }
        }
        
        lastFaceDetected = detected;
      } catch (err) {
        console.error('Detection error', err);
        setFaceDetected(false);
      }
    };

    const interval = setInterval(detectFace, 4000);
    
    return () => {
      clearInterval(interval);
    };
  }, [started, cameraActive, model, captureAndSend]);

  const handleStart = () => {
    if (!started) {
      modelLoadedRef.current = false;
    }
    setStarted(true);
    setCameraActive(true);
  };

  const handleRetry = useCallback(() => {
    setCameraActive(true);
    isProcessingRef.current = false;
    setIsProcessing(false);
    showToast('info', 'Camera Ready', 'Position your face in the frame');
  }, [showToast]);

  return (
    <div className={`camera-wrapper`}>
      {/* Header */}
      {started && (
        <div className="header-bar">
          <div className="app-title">Attendance System</div>
          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            <div className={`status-badge ${faceDetected ? 'scanning' : 'ready'}`}>
              <span className="status-indicator"></span>
              {faceDetected ? 'Face Detected' : 'Ready'}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast ${toast.type} ${toast.exiting ? 'toast-exit' : ''}`}
          >
            <div className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'i'}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button 
              className="toast-close" 
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      {!started ? (
        <div className="start-wrapper">
          <div className="welcome-icon">👤</div>
          <h1 className="welcome-title">Face Recognition Attendance</h1>
          <p className="start-help">
            Securely mark your attendance using facial recognition. 
            Click the button below to begin.
          </p>
          <button className="start-button" onClick={handleStart}>
            Mark my Attendance
          </button>
        </div>
      ) : (
        <>
          {cameraActive ? (
            <div className="camera-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="camera-feed"
                videoConstraints={{ facingMode: 'user' }}
              />
              
              {/* Face Detection Frame */}
              {model && (
                <div className="detection-frame">
                  <div className="scanning-line"></div>
                </div>
              )}
              
              {/* Processing Overlay */}
              {isProcessing && (
                <div className="processing-overlay">
                  <div className="processing-content">
                    <div className="spinner"></div>
                    <div className="processing-text">Processing...</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="start-wrapper">
              <div className="welcome-icon">📸</div>
              <h1 className="welcome-title">Camera Stopped</h1>
              <p className="start-help">
                Camera has been stopped after capture. Click below to retry.
              </p>
              <button className="start-button" onClick={handleRetry}>
                Retry Attendance
              </button>
            </div>
          )}

          {/* Bottom Controls */}
          {cameraActive && !isProcessing && (
            <div className="bottom-controls">
              <button className="control-button" onClick={stopCamera}>
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WebcamCapture;