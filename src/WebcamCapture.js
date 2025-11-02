import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './WebcamCapture.css';

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState('');
  const [screenSaver, setScreenSaver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isProcessing && !screenSaver) {
        captureAndSend();
      }
    }, 2000); // every 2 seconds

    return () => clearInterval(interval);
  }, [isProcessing, screenSaver]);

  const captureAndSend = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessing(true);
    const blob = await (await fetch(imageSrc)).blob();
    const formData = new FormData();
    formData.append('image', blob, 'face.jpg');

    try {
      const response = await axios.post('/attendance/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage(`✅ Attendance marked for ${response.data.employee} (Confidence: ${response.data.confidence})`);
      setScreenSaver(true);

      setTimeout(() => {
        setScreenSaver(false);
        setMessage('');
      }, 5000); // screen saver duration
    } catch (error) {
      // Optional: handle errors silently or show message
      setMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="camera-wrapper">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="camera-feed"
        videoConstraints={{ facingMode: 'user' }}
      />
      {screenSaver && <div className="screen-saver">Attendance Marked</div>}
      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default WebcamCapture;






// import React, { useRef, useState } from 'react';
// import Webcam from 'react-webcam';
// import axios from 'axios';

// const WebcamCapture = () => {
//   const webcamRef = useRef(null);
//   const [name, setName] = useState('');
//   const [mode, setMode] = useState('attendance'); // 'register' or 'attendance'
//   const [message, setMessage] = useState('');

//   const captureAndSend = async () => {
//     const imageSrc = webcamRef.current.getScreenshot();
//     if (!imageSrc) {
//       setMessage('❌ Unable to capture image. Please try again.');
//       return;
//     }

//     const blob = await (await fetch(imageSrc)).blob();
//     const formData = new FormData();
//     formData.append('image', blob, 'face.jpg');
//     if (mode === 'register') formData.append('name', name);

//     try {
//       const endpoint = mode === 'register' ? '/register/' : '/attendance/';
//       const response = await axios.post(endpoint, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       if (mode === 'register') {
//         setMessage(`✅ Registered: ${response.data.name} (ID: ${response.data.employee_id})`);
//       } else {
//         setMessage(`✅ Attendance marked for ${response.data.employee} (Confidence: ${response.data.confidence})`);
//       }
//     } catch (error) {
//       const errMsg = error.response?.data?.error || 'Server error. Try again.';
//       setMessage(`❌ ${errMsg}`);
//     }
//   };

//   return (
//     <div style={{ textAlign: 'center' }}>
//       <h2>{mode === 'register' ? 'Face Registration' : 'Mark Attendance'}</h2>
//       <Webcam
//         audio={false}
//         ref={webcamRef}
//         screenshotFormat="image/jpeg"
//         width={320}
//         height={240}
//         videoConstraints={{ facingMode: 'user' }}
//       />
//       {mode === 'register' && (
//         <input
//           type="text"
//           placeholder="Enter name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           style={{ marginTop: '10px', padding: '5px' }}
//         />
//       )}
//       <div style={{ marginTop: '10px' }}>
//         <button onClick={captureAndSend}>📷 Capture & Submit</button>
//         <button onClick={() => setMode(mode === 'register' ? 'attendance' : 'register')} style={{ marginLeft: '10px' }}>
//           🔄 Switch to {mode === 'register' ? 'Attendance' : 'Register'}
//         </button>
//       </div>
//       <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>
//     </div>
//   );
// };

// export default WebcamCapture;