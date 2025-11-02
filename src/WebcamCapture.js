import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';
import './WebcamCapture.css';

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState('');
  const [screenSaver, setScreenSaver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
    };
    loadModel();
  }, []);

  useEffect(() => {
    const detectFace = async () => {
      if (
        model &&
        webcamRef.current &&
        webcamRef.current.video.readyState === 4 &&
        !isProcessing &&
        !screenSaver
      ) {
        const predictions = await model.estimateFaces(webcamRef.current.video, false);
        if (predictions.length > 0) {
          captureAndSend();
        }
      }
    };

    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [model, isProcessing, screenSaver]);

  const captureAndSend = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessing(true);
    const blob = await (await fetch(imageSrc)).blob();
    const formData = new FormData();
    formData.append('image', blob, 'face.jpg');

    try {
      // ✅ Updated to point to Django backend
      const response = await axios.post(
        'http://127.0.0.1:8000/api/attendance/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setMessage(
        `✅ Attendance marked for ${response.data.employee} 
         (Confidence: ${response.data.confidence}) 
         at ${response.data.timestamp}`
      );
      setScreenSaver(true);
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Server error';
      setMessage(`❌ ${errMsg}`);
      setScreenSaver(true);
    } finally {
      setTimeout(() => {
        setScreenSaver(false);
        setMessage('');
        setIsProcessing(false);
      }, 5000);
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
      {screenSaver && <div className="screen-saver">{message}</div>}
    </div>
  );
};

export default WebcamCapture;
