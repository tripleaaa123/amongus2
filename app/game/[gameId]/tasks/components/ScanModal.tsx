'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase';
import { completeTask } from '@/lib/gameUtils';
import styles from './ScanModal.module.css';

interface ScanModalProps {
  gameId: string;
  playerId: string;
  playerTasks: any[];
  onClose: () => void;
  onTaskComplete: () => void;
}

export default function ScanModal({ gameId, playerId, playerTasks, onClose, onTaskComplete }: ScanModalProps) {
  const [step, setStep] = useState<'scan' | 'capture'>('scan');
  const [scannedTaskId, setScannedTaskId] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanner = async () => {
    try {
      if (scannerRef.current) return;
      
      const html5Qrcode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qrcode;
      
      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Check if this taskId exists in player's tasks
          const task = playerTasks.find(t => t.taskId === decodedText);
          if (task && !task.completed) {
            setScannedTaskId(decodedText);
            stopScanner();
            setStep('capture');
          } else {
            alert('Task not found or already completed!');
          }
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      alert('Failed to start camera. Please check permissions.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Failed to access camera.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (step === 'scan') {
      startScanner();
    } else if (step === 'capture') {
      startCamera();
    }

    return () => {
      stopScanner();
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage(imageData);
          stopCamera();
        }
      }
    }
  };

  const uploadAndComplete = async () => {
    if (!capturedImage || !scannedTaskId) return;

    setUploading(true);
    try {
      // Convert base64 data URL to blob
      const base64Data = capturedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      // Upload to Firebase Storage
      const fileName = `${gameId}_${playerId}_${scannedTaskId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `proofs/${fileName}`);
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);

      // Mark task as complete
      await completeTask(gameId, playerId, scannedTaskId, imageUrl);
      
      onTaskComplete();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const task = playerTasks.find(t => t.taskId === scannedTaskId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        {step === 'scan' ? (
          <div className={styles.scanStep}>
            <h2>Scan QR Code</h2>
            <p>Point your camera at the task QR code</p>
            <div id="qr-reader" className={styles.qrReader}></div>
          </div>
        ) : (
          <div className={styles.captureStep}>
            <h2>Capture Proof</h2>
            {task && <p>Task: <strong>{task.name}</strong></p>}
            {!capturedImage ? (
              <>
                <video ref={videoRef} autoPlay playsInline className={styles.video} />
                <button className={styles.captureButton} onClick={captureImage}>
                  Take Picture
                </button>
              </>
            ) : (
              <>
                <img src={capturedImage} alt="Proof" className={styles.preview} />
                <div className={styles.buttonGroup}>
                  <button className={styles.retakeButton} onClick={() => {
                    setCapturedImage(null);
                    startCamera();
                  }}>
                    Retake
                  </button>
                  <button 
                    className={styles.submitButton} 
                    onClick={uploadAndComplete}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Submit Proof'}
                  </button>
                </div>
              </>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}
      </div>
    </div>
  );
}

