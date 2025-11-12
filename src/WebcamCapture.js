import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';
import './WebcamCapture.css';
import { markAttendance, getTodayAttendanceSummary } from './api/attendanceApi';
import DashboardReports from './DashboardReports';
import useAuth from './hooks/useAuth';
import UsersPage from './pages/UsersPage';
import OrganisationPage from './pages/OrganisationPage';
import EmployeesPage from './pages/EmployeesPage';

const WebcamCapture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useAuth();
  const isSuperAdmin = auth?.role === 'superadmin';
  const sidebarItems = useMemo(() => {
    const items = [
      { id: 'dashboard', icon: '🏠', label: 'Dashboard', route: '/dashboard' },
      { id: 'attendance', icon: '📸', label: 'Attendance', route: '/attendance' },
      { id: 'employees', icon: '👥', label: 'Employees', route: '/employees' },
    ];
    if (isSuperAdmin) {
      items.push(
        { id: 'users', icon: '👤', label: 'Users', route: '/users' },
        { id: 'organisation', icon: '🏢', label: 'Organisation', route: '/organisation' },
      );
    }
    items.push(
      { id: 'reports', icon: '📊', label: 'Reports', route: '/reports' },
      { id: 'about', icon: 'ℹ️', label: 'About', route: '/about' },
    );
    return items;
  }, [isSuperAdmin]);

  const bottomNavItems = useMemo(() => sidebarItems, [sidebarItems]);
  const [isCompactNav, setIsCompactNav] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [overflowOpen, setOverflowOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsCompactNav(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isCompactNav && overflowOpen) {
      setOverflowOpen(false);
    }
  }, [isCompactNav, overflowOpen]);

  const webcamRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [model, setModel] = useState(null);
  const [started, setStarted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stoppedState, setStoppedState] = useState('idle');

  const primaryNavItems = useMemo(() => {
    if (!isCompactNav) {
      return bottomNavItems;
    }
    const limit = Math.min(3, bottomNavItems.length);
    return bottomNavItems.slice(0, limit);
  }, [bottomNavItems, isCompactNav]);

  const overflowNavItems = useMemo(() => {
    if (!isCompactNav) {
      return [];
    }
    return bottomNavItems.slice(3);
  }, [bottomNavItems, isCompactNav]);

  const isProcessingRef = useRef(false);
  const modelLoadedRef = useRef(false);
  const faceDetectedRef = useRef(false);
  const lastToastTimeRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  const dismissAllToasts = useCallback(() => {
    setToasts((prev) => prev.map((toast) => ({ ...toast, exiting: true })));
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  const showToast = useCallback(
    (type, title, message, key = null, options = {}) => {
      if (key) {
        const now = Date.now();
        if (lastToastTimeRef.current[key] && now - lastToastTimeRef.current[key] < 3000) {
          return;
        }
        lastToastTimeRef.current[key] = now;
      }

      const id = Date.now();
      const toast = { id, type, title, message, variant: options.variant, options };
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        removeToast(id);
      }, options.durationMs ?? 3000);
    },
    [removeToast]
  );

  useEffect(() => {
    if (!started || modelLoadedRef.current) return;
    let cancelled = false;

    const loadModel = async () => {
      try {
        const loadedModel = await blazeface.load();
        if (!cancelled) {
          setModel(loadedModel);
          modelLoadedRef.current = true;
        }
      } catch (err) {
        console.error('Failed to load model', err);
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

  const stopCameraWith = useCallback(
    (reason) => {
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
    },
    []
  );

  useEffect(() => {
    const rawPath = location.pathname === '/' ? '/dashboard' : location.pathname;
    const matched = sidebarItems.find(
      (item) => rawPath === item.route || rawPath.startsWith(`${item.route}/`)
    );
    if (matched) {
      setActiveTab(matched.id);
      if (matched.id !== 'attendance') {
        if (cameraActive) {
          stopCamera();
        }
        setStarted(false);
        setStoppedState('idle');
      }
      return;
    }
  }, [location.pathname, sidebarItems, cameraActive, stopCamera]);

  const fetchAttendanceDetails = async (employeeName) => {
    try {
      const { data } = await getTodayAttendanceSummary();
      if (!Array.isArray(data)) return null;
      return data.find((record) => record.employee === employeeName);
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      return null;
    }
  };

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

      const response = await markAttendance(formData);
      const data = response.data;
      console.log('data', data);

      if (data.status === 'Already marked') {
        const attendanceDetails = await fetchAttendanceDetails(data.employee);
        const checkinTime = attendanceDetails?.checkin
          ? new Date(`2000-01-01 ${attendanceDetails.checkin}`).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Not marked';
        const checkoutTime = attendanceDetails?.checkout
          ? new Date(`2000-01-01 ${attendanceDetails.checkout}`).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Not marked';

        const message = `Hello ${data.employee}!\nYour attendance for today is already recorded:\n\nCheck-in: ${checkinTime}\nCheck-out: ${checkoutTime}`;

        showToast('info', 'Already Checked In/Out', message, 'attendance-already-marked', {
          durationMs: 8000,
          variant: 'hero',
          photo: data.photo,
        });
        stopCameraWith('completed');
        setTimeout(() => {
          setStarted(false);
        }, 2000);
      } else if (data.status?.includes('successful')) {
        const isCheckin = data.status.toLowerCase().includes('checkin');
        showToast(
          'success',
          isCheckin ? 'Check-In Successful' : 'Check-Out Successful',
          data.message,
          'attendance-success',
          {
            durationMs: 6000,
            variant: 'hero',
            confidence: data.confidence,
            timestamp: data.timestamp,
            photo: data.photo,
          }
        );
        stopCameraWith('completed');
        setTimeout(() => {
          setStarted(false);
        }, 2000);
      } else {
        showToast('error', 'Unknown Response', 'Received unexpected response from server.', 'attendance-unknown');
      }

      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      let errMsg = 'Server connection failed';
      let errTitle = 'Connection Error';

      if (error.response?.data?.error) {
        switch (error.response.data.error) {
          case 'No face detected':
            errTitle = 'No Face Found';
            errMsg = 'Please ensure your face is clearly visible in the frame';
            break;
          case 'Face not recognized':
            errTitle = 'Unregistered Face';
            errMsg = 'Your face is not registered in the system. Please contact administrator.';
            break;
          default:
            errTitle = 'Error';
            errMsg = error.response.data.error;
        }
      }

      showToast('error', errTitle, errMsg, 'attendance-error', { durationMs: 10000 });

      stopCameraWith('error');
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [showToast, stopCameraWith, fetchAttendanceDetails]);

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
    navigate('/attendance');
    setSidebarOpen(false);
  };

  const handleRetry = useCallback(() => {
    dismissAllToasts();
    setStarted(false);
    setCameraActive(false);
    isProcessingRef.current = false;
    setIsProcessing(false);
    setStoppedState('idle');
  }, [dismissAllToasts]);

  const handleTabChange = (tab) => {
    dismissAllToasts();
    const item = sidebarItems.find((entry) => entry.id === tab);
    if (!item) {
      return;
    }

    if (tab !== 'attendance') {
      if (cameraActive) {
        stopCamera();
      }
      setStarted(false);
      setStoppedState('idle');
    }

    setActiveTab(tab);
    if (tab === 'reports') {
      navigate('/reports/today');
    } else {
      navigate(item.route);
    }
    setSidebarOpen(false);
    setOverflowOpen(false);
  };

  const handleOverflowSelect = (tab) => {
    handleTabChange(tab);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-icon">👤</div>
            <div className="sidebar-brand-text">
              <h2 className="sidebar-title">True Face</h2>
              <span className="sidebar-subtitle">Attendance Suite</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
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
        {auth && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-icon">👤</div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{auth.name || auth.email}</span>
                <span className="sidebar-user-role">{auth.role}</span>
              </div>
            </div>
            <button className="sidebar-logout" onClick={() => { logout(); setSidebarOpen(false); }}>
              Logout
            </button>
          </div>
        )}
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="main-wrapper">
        <main className="main-content">
          {activeTab === 'dashboard' && (
            <div className="home-screen">
              <div className="home-hero">
                <div className="hero-icon-wrapper">
                  <div className="hero-icon">👤</div>
                  <div className="icon-ring"></div>
                </div>
                <h1 className="hero-title">Welcome to True Face Attendance</h1>
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
                          aspectRatio: 16 / 9,
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          maxHeight: '100vh',
                          objectFit: 'contain',
                          backgroundColor: '#000',
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
                          {stoppedState === 'error'
                            ? "Let's Try Again"
                            : stoppedState === 'cancelled'
                              ? 'Camera Stopped'
                              : stoppedState === 'retry'
                                ? 'Ready to Continue'
                                : 'Capture Complete'}
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

          {activeTab === 'employees' && (
            <EmployeesPage onNotify={showToast} isSuperAdmin={isSuperAdmin} auth={auth} />
          )}

          {isSuperAdmin && activeTab === 'users' && (
            <UsersPage onNotify={showToast} isSuperAdmin={isSuperAdmin} />
          )}

          {isSuperAdmin && activeTab === 'organisation' && (
            <OrganisationPage onNotify={showToast} />
          )}

          {activeTab === 'reports' && (
            <div className="reports-embedded">
              <DashboardReports />
            </div>
          )}

          {activeTab === 'about' && (
            <div className="about-screen">
              <div className="about-content">
                <div className="about-header">
                  <h2 className="about-title">About True Face Attendance</h2>
                </div>

                <div className="about-section">
                  <h3 className="section-title">How It Works</h3>
                  <p className="section-text">
                    True Face Attendance uses advanced facial recognition technology powered by TensorFlow.js and
                    BlazeFace models to identify and verify individuals. The system captures your face, processes it
                    securely, and marks your attendance automatically.
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
                    Your facial data is processed locally in your browser and sent securely to our servers only for
                    verification purposes. We prioritize privacy and enterprise-grade security.
                  </p>
                </div>

                <div className="about-divider"></div>

                <div className="about-company">
                  <h3 className="section-title">Developed By</h3>
                  <div className="company-info">
                    <div className="company-name">
                      <span className="company-icon">🏢</span>
                      <strong>CloudGen Technologies</strong>
                    </div>
                    <div className="company-address">
                      <p>
                        Plot #16, Arun Hi-Tech City
                        <br />
                        Surya Nagar, Madurai, Tamil Nadu
                      </p>
                    </div>
                  </div>

                  <div className="contact-info">
                    <h4 className="contact-title">Get in Touch</h4>
                    <div className="contact-grid">
                      <a href="tel:+918946066577" className="contact-item">
                        <span className="contact-icon">📞</span>
                        <div className="contact-details">
                          <span className="contact-label">Phone</span>
                          <span className="contact-value">+91 89460 66577</span>
                        </div>
                      </a>
                      <a href="tel:+916369070815" className="contact-item">
                        <span className="contact-icon">📱</span>
                        <div className="contact-details">
                          <span className="contact-label">Mobile</span>
                          <span className="contact-value">+91 63690 70815</span>
                        </div>
                      </a>
                      <a href="mailto:sales@cloudgentechnologies.com" className="contact-item">
                        <span className="contact-icon">✉️</span>
                        <div className="contact-details">
                          <span className="contact-label">Email</span>
                          <span className="contact-value">sales@cloudgentechnologies.com</span>
                        </div>
                      </a>
                      <a href="https://cloudgentechnologies.com" target="_blank" rel="noopener noreferrer" className="contact-item">
                        <span className="contact-icon">🌐</span>
                        <div className="contact-details">
                          <span className="contact-label">Website</span>
                          <span className="contact-value">cloudgentechnologies.com</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="about-footer">
                  <p className="footer-text">© {new Date().getFullYear()} CloudGen Technologies • Crafted for modern teams</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className={`bottom-tab-navigation ${isCompactNav ? 'compact' : ''}`}>
        {primaryNavItems.map((item) => (
          <button
            key={item.id}
            className={`bottom-tab-button ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleTabChange(item.id)}
          >
            <span className="bottom-tab-icon">{item.icon}</span>
            <span className="bottom-tab-label">{item.label}</span>
          </button>
        ))}
        {isCompactNav && overflowNavItems.length > 0 && (
          <div className="bottom-more-wrapper">
            <button
              className={`bottom-tab-button more-button ${overflowOpen ? 'active' : ''}`}
              onClick={() => setOverflowOpen((prev) => !prev)}
            >
              <span className="bottom-tab-icon">⋯</span>
              <span className="bottom-tab-label">More</span>
            </button>
            {overflowOpen && (
              <div className="bottom-more-menu">
                {auth && (
                  <div className="bottom-more-user">
                    <div className="bottom-user-icon">👤</div>
                    <div className="bottom-user-details">
                      <span className="bottom-user-name">{auth.name || auth.email}</span>
                      <span className="bottom-user-role">{auth.role}</span>
                    </div>
                    <button
                      className="bottom-user-logout"
                      onClick={() => {
                        logout();
                        setOverflowOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
                {overflowNavItems.map((item) => (
                  <button
                    key={item.id}
                    className={`bottom-more-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => handleOverflowSelect(item.id)}
                  >
                    <span className="bottom-tab-icon">{item.icon}</span>
                    <span className="bottom-tab-label">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isCompactNav && overflowOpen && (
        <div className="bottom-more-overlay" onClick={() => setOverflowOpen(false)} />
      )}

    </div>
  );
};

export default WebcamCapture;