import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';
import './WebcamCapture.css';

const menuItems = [
  { id: 'home', icon: '🏠', label: 'Dashboard' },
  { id: 'attendance', icon: '📸', label: 'Attendance' },
  { id: 'reports', icon: '📊', label: 'Reports' },
  { id: 'about', icon: 'ℹ️', label: 'About' }
];

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [model, setModel] = useState(null);
  const [started, setStarted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stoppedState, setStoppedState] = useState('idle'); // 'completed' | 'error' | 'cancelled' | 'retry'

  const isProcessingRef = useRef(false);
  const modelLoadedRef = useRef(false);
  const faceDetectedRef = useRef(false);
  const lastToastTimeRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, exiting: true } : toast
    ));
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  }, []);

  // Dismiss all toasts when interacting with buttons
  const dismissAllToasts = useCallback(() => {
    setToasts(prev => prev.map(toast => ({ ...toast, exiting: true })));
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  const showToast = useCallback((type, title, message, key = null, options = {}) => {
    if (key) {
      const now = Date.now();
      if (lastToastTimeRef.current[key] && now - lastToastTimeRef.current[key] < 3000) {
        return;
      }
      lastToastTimeRef.current[key] = now;
    }

    const id = Date.now();
    const toast = { id, type, title, message, variant: options.variant };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      removeToast(id);
    }, options.durationMs ?? 3000);
  }, [removeToast]);

  useEffect(() => {
    if (!started || modelLoadedRef.current) return;
    let cancelled = false;
    
    const loadModel = async () => {
      try {
        // showToast('info', 'Loading Model', 'Initializing face detection...', 'model-loading');
        const loadedModel = await blazeface.load();
        if (!cancelled) {
          setModel(loadedModel);
          modelLoadedRef.current = true;
          // showToast('success', 'Ready', 'Face detection is active', 'model-ready');
        }
      } catch (err) {
        console.error('Failed to load model', err);
        if (!cancelled) {
          // showToast('error', 'Error', 'Failed to load face detection model', 'model-error');
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
    faceDetectedRef.current = false;
    setFaceDetected(false);
  }, []);

  const stopCameraWith = useCallback((reason) => {
    try {
      const stream = webcamRef.current?.video?.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.warn('Error stopping camera tracks', e);
    }
    setCameraActive(false);
    faceDetectedRef.current = false;
    setFaceDetected(false);
    setStoppedState(reason || 'idle');
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
        showToast(
          'success',
          'Face Recognized',
          `Welcome ${response.data.employee}! Attendance marked at ${response.data.timestamp}`,
          'attendance-success',
          { durationMs: 6000, variant: 'hero' }
        );
        // Navigate to attendance activate screen after success
        stopCameraWith('completed');
        setStarted(false);
        window.location.hash = '#/attendance';
      } else {
        showToast(
          'error',
          'Unknown Face',
          'This face is not registered in the system. Please contact administrator.',
          'attendance-unknown'
        );
      }
      
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      let errMsg = 'Server connection failed';
      let errTitle = 'Connection Error';
      
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('No face detected')) {
          errTitle = 'No Face Found';
          errMsg = 'Please ensure your face is clearly visible in the frame';
        } else if (error.response.data.error.includes('not registered') || 
                   error.response.data.error.includes('not recognized')) {
          errTitle = 'Unregistered Face';
          errMsg = 'Your face is not registered in the system. Please contact administrator.';
        }
      }
      
      showToast('error', errTitle, errMsg, 'attendance-error', { durationMs: 10000 });
      
      stopCameraWith('error');
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [showToast, stopCamera]);

  useEffect(() => {
    if (!started || !cameraActive || !model) {
      if (faceDetectedRef.current !== false) {
        faceDetectedRef.current = false;
        setFaceDetected(false);
      }
      return;
    }

    const detectFace = async () => {
      if (
        !webcamRef.current ||
        !webcamRef.current.video ||
        webcamRef.current.video.readyState !== 4 ||
        isProcessingRef.current
      ) {
        if (faceDetectedRef.current !== false) {
          faceDetectedRef.current = false;
          setFaceDetected(false);
        }
        return;
      }

      try {
        const predictions = await model.estimateFaces(webcamRef.current.video, false);
        const detected = predictions && predictions.length > 0;
        
        if (faceDetectedRef.current !== detected) {
          faceDetectedRef.current = detected;
          setFaceDetected(detected);
        }
        
        if (detected && !isProcessingRef.current) {
          captureAndSend();
        }
      } catch (err) {
        console.error('Detection error', err);
        if (faceDetectedRef.current !== false) {
          faceDetectedRef.current = false;
          setFaceDetected(false);
        }
      }
    };

    const interval = setInterval(detectFace, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [started, cameraActive, model, captureAndSend]);

  const handleStart = () => {
    if (!started) {
      modelLoadedRef.current = false;
    }
    dismissAllToasts();
    setStarted(true);
    setCameraActive(true);
    setActiveTab('attendance');
    if (window.location.hash !== '#/attendance') {
      window.location.hash = '#/attendance';
    }
    setSidebarOpen(false);
  };

  const handleRetry = useCallback(() => {
    dismissAllToasts();
    setCameraActive(true);
    isProcessingRef.current = false;
    setIsProcessing(false);
    setStoppedState('retry');
    showToast('info', 'Camera Ready', 'Position your face in the frame', 'camera-ready');
  }, [showToast, dismissAllToasts]);

  const handleTabChange = (tab) => {
    dismissAllToasts();
    setActiveTab(tab);
    if (tab !== 'attendance' && cameraActive) {
      stopCamera();
    }
    const target = tab === 'home' ? '#/' : `#/${tab}`;
    if (window.location.hash !== target) {
      window.location.hash = target;
    }
    setSidebarOpen(false);
  };

  // Keep activeTab in sync with URL hash and stop camera when leaving attendance
  useEffect(() => {
    const applyFromHash = () => {
      const hash = window.location.hash || '#/';
      const path = hash.replace(/^#\//, '');
      const tab = path === '' ? 'home' : path;
      if (tab !== activeTab) setActiveTab(tab);
      if (tab !== 'attendance' && cameraActive) stopCamera();
    };
    applyFromHash();
    window.addEventListener('hashchange', applyFromHash);
    return () => window.removeEventListener('hashchange', applyFromHash);
  }, [activeTab, cameraActive, stopCamera]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-icon">👤</div>
            <div className="sidebar-brand-text">
              <h2 className="sidebar-title">FaceRec</h2>
              <span className="sidebar-subtitle">Attendance Suite</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </nav>
       
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="main-wrapper">
        {/* <header className="top-nav">
          <div className="nav-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              ☰
            </button>
          
          </div>
          {started && (
            <div className={`status-indicator-badge ${faceDetected ? 'scanning' : 'ready'}`}>
              <span className="status-dot"></span>
              {faceDetected ? 'Face Detected' : 'Ready'}
            </div>
          )}
        </header> */}

       

        <main className="main-content">
          {activeTab === 'home' && (
            <div className="home-screen">
              <div className="home-hero">
                <div className="hero-icon-wrapper">
                  <div className="hero-icon">👤</div>
                  <div className="icon-ring"></div>
                </div>
                <h1 className="hero-title">Welcome to FaceRec Attendance</h1>
                <p className="hero-subtitle">
                  Advanced facial recognition technology for seamless attendance management
                </p>
              </div>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3 className="feature-title">Fast & Accurate</h3>
                  <p className="feature-description">
                    Powered by advanced AI models for instant face recognition
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔒</div>
                  <h3 className="feature-title">Secure</h3>
                  <p className="feature-description">
                    Your biometric data is processed securely and privately
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3 className="feature-title">Real-time Insights</h3>
                  <p className="feature-description">
                    Monitor attendance records with smart analytics and exports
                  </p>
                </div>
              </div>

              <div className="cta-section">
                <button className="primary-cta-button" onClick={handleStart}>
                  <span className="cta-icon">🚀</span>
                  <span>Start Marking Attendance</span>
                </button>
                <p className="cta-hint">Camera permission required to begin recognition</p>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="attendance-screen">
              <style>{`
                .camera-container {
                  position: relative;
                  width: 100vw;
                  height: 100vh;
                  overflow: hidden;
                  background: #000;
                }
              `}</style>
              {!started ? (
                <div className="attendance-start">
                  <div className="start-card">
                    <div className="start-icon-wrapper">
                      <div className="start-icon">📸</div>
                    </div>
                    <h2 className="start-title">Ready to Mark Attendance</h2>
                    <p className="start-description">
                      Activate your camera to launch the real-time face recognition workflow.
                    </p>
                    <button className="start-attendance-button" onClick={handleStart}>
                      Mark my attendance
                    </button>
                  </div>
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
                        videoConstraints={{
                          facingMode: 'user',
                          width: { min: 320, ideal: 1920, max: 2560 },
                          height: { min: 240, ideal: 1080, max: 1440 },
                          aspectRatio: 16/9
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          maxHeight: '100vh',
                          objectFit: 'contain',
                          backgroundColor: '#000'
                        }}
                      />

                      {model && (
                        <div className="detection-frame">
                          <div className="scanning-line"></div>
                        </div>
                      )}

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
                    <div className="camera-stopped">
                      <div className="stopped-card">
                        <div className="stopped-icon">{stoppedState === 'error' ? '⚠️' : '✓'}</div>
                        <h2 className="stopped-title">
                          {stoppedState === 'error' ? 'Let\'s Try Again' : stoppedState === 'cancelled' ? 'Camera Stopped' : stoppedState === 'retry' ? 'Ready to Continue' : 'Capture Complete'}
                        </h2>
                        <p className="stopped-description">
                          {stoppedState === 'error' 
                            ? 'We could not confirm your face. Ensure good lighting and keep your face centered.'
                            : stoppedState === 'cancelled'
                              ? 'You can resume anytime. Click below to try again.'
                              : stoppedState === 'retry'
                                ? 'Click below to resume your attendance capture.'
                                : 'Attendance has been submitted. You can retry to capture again if needed.'}
                        </p>
                        <button className="retry-button" onClick={handleRetry}>
                          Retry Attendance
                        </button>
                      </div>
                    </div>
                  )}

                  {cameraActive && !isProcessing && (
                    <div className="bottom-controls">
                      <button className="control-button" onClick={() => stopCameraWith('cancelled')}>
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="reports-screen">
              <div className="reports-header">
                <h2 className="reports-title">Attendance Reports</h2>
                <p className="reports-subtitle">Powerful analytics to understand workforce presence</p>
              </div>
              <div className="reports-grid">
                <div className="report-card">
                  <h3 className="report-metric">Monthly Summary</h3>
                  <p className="report-text">Download detailed monthly attendance logs and trend charts.</p>
                </div>
                <div className="report-card">
                  <h3 className="report-metric">Late Arrivals</h3>
                  <p className="report-text">Identify repeated late arrivals and proactively reach out.</p>
                </div>
                <div className="report-card">
                  <h3 className="report-metric">Overtime Tracking</h3>
                  <p className="report-text">Monitor overtime hours to ensure compliance and efficiency.</p>
                </div>
              </div>
              <div className="reports-footer">
                <p className="reports-note">Full analytics suite coming soon. Stay tuned!</p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="about-screen">
              <div className="about-content">
                <div className="about-header">
                  <h2 className="about-title">About FaceRec Attendance</h2>
                  <p className="about-subtitle">Version 1.0.0</p>
                </div>

                <div className="about-section">
                  <h3 className="section-title">How It Works</h3>
                  <p className="section-text">
                    FaceRec Attendance uses advanced facial recognition technology powered by TensorFlow.js
                    and BlazeFace models to identify and verify individuals. The system captures your face,
                    processes it securely, and marks your attendance automatically.
                  </p>
                </div>

                <div className="about-section">
                  <h3 className="section-title">Key Capabilities</h3>
                  <ul className="feature-list">
                    <li>Real-time face detection and recognition</li>
                    <li>Secure biometric authentication</li>
                    <li>Automatic attendance tracking</li>
                    <li>Responsive and user-friendly interface</li>
                  </ul>
                </div>

                <div className="about-section">
                  <h3 className="section-title">Privacy & Security</h3>
                  <p className="section-text">
                    Your facial data is processed locally in your browser and sent securely to our servers
                    only for verification purposes. We prioritize privacy and enterprise-grade security.
                  </p>
                </div>

                <div className="about-footer">
                  <p className="footer-text">© 2024 FaceRec Attendance System • Crafted for modern teams</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="bottom-tab-navigation">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`bottom-tab-button ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleTabChange(item.id)}
          >
            <span className="bottom-tab-icon">{item.icon}</span>
            <span className="bottom-tab-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast ${toast.type} ${toast.variant || ''} ${toast.exiting ? 'toast-exit' : ''}`}
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
    </div>
  );
};

export default WebcamCapture;
