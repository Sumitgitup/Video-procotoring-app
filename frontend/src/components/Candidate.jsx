import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
// Import the backends
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import '@mediapipe/face_mesh';


const CandidateView = ({ setReportId }) => {
  const videoRef = useRef(null);
  const noFaceTimerRef = useRef(null);
  const lookingAwayTimerRef = useRef(null);
  const multipleFacesTimerRef = useRef(null); // Ref for multiple faces debounce
  const detectionIntervalRef = useRef(null);
  const interviewStartRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState({ submitting: false, success: false, error: null, submittedReportId: null });
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);


  const addLog = useCallback((eventText) => {
    setLogs(prevLogs => {
      // Prevent adding the same log entry consecutively
      if (prevLogs.length > 0 && prevLogs[0].event === eventText) {
        return prevLogs;
      }
      const newLog = {
        event: eventText,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      };
      return [newLog, ...prevLogs];
    });
  }, []);

  const runDetection = useCallback(async (faceDetector, objectDetector) => {
    const video = videoRef.current;
    
    if (!video || video.readyState < 3 || !faceDetector || !objectDetector) {
      return;
    }

    try {
      const faces = await faceDetector.estimateFaces(video);

      // --- FIX #1: Multiple Face Detection with Debounce ---
      if (faces.length > 1) {
        // If multiple faces are seen, start a 2-second timer.
        // This prevents logging on momentary glitches.
        if (!multipleFacesTimerRef.current) {
          multipleFacesTimerRef.current = setTimeout(() => {
            addLog('Multiple faces detected');
          }, 2000); // Only log if condition persists for 2 seconds
        }
      } else {
        // If there's only one face (or none), clear the timer.
        if (multipleFacesTimerRef.current) {
          clearTimeout(multipleFacesTimerRef.current);
          multipleFacesTimerRef.current = null;
        }
      }

      // Rule: No Face Detection
      if (faces.length === 0) {
        if (!noFaceTimerRef.current) {
          noFaceTimerRef.current = setTimeout(() => addLog('User absent for > 10 seconds'), 10000);
        }
      } else {
        if (noFaceTimerRef.current) {
          clearTimeout(noFaceTimerRef.current);
          noFaceTimerRef.current = null;
        }
      }

      // --- FIX #2: Looking Away Logic Correction ---
      // This now runs if there is at least ONE face, making it more robust.
      if (faces.length >= 1) { 
        const { keypoints } = faces[0]; // Always check the primary face
        const noseTip = keypoints.find(p => p.name === 'noseTip');
        const leftEye = keypoints.find(p => p.name === 'leftEye');
        const rightEye = keypoints.find(p => p.name === 'rightEye');
        if (noseTip && leftEye && rightEye) {
          const eyeMidpoint = (leftEye.x + rightEye.x) / 2;
          const horizontalDistance = noseTip.x - eyeMidpoint;
          const lookingAwayThreshold = 35;
          if (Math.abs(horizontalDistance) > lookingAwayThreshold) {
            if (!lookingAwayTimerRef.current) {
              lookingAwayTimerRef.current = setTimeout(() => addLog('User looking away for > 5 seconds'), 5000);
            }
          } else {
            if (lookingAwayTimerRef.current) {
              clearTimeout(lookingAwayTimerRef.current);
              lookingAwayTimerRef.current = null;
            }
          }
        }
      } else {
        // Also clear looking away timer if no faces are present
        if (lookingAwayTimerRef.current) {
          clearTimeout(lookingAwayTimerRef.current);
          lookingAwayTimerRef.current = null;
        }
      }

      const predictions = await objectDetector.detect(video);
      const suspiciousObjects = ['cell phone', 'book'];
      for (let prediction of predictions) {
        if (suspiciousObjects.includes(prediction.class) && prediction.score > 0.65) {
          addLog(`${prediction.class.charAt(0).toUpperCase() + prediction.class.slice(1)} detected`);
        }
      }

    } catch (estimationError) {
      console.error("Error during detection: ", estimationError);
    }
  }, [addLog]);

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setVideoUrl(URL.createObjectURL(blob));
        recordedChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFinishInterview = async () => {
    if (isRecording) stopRecording();
    setSubmissionStatus({ submitting: true, success: false, error: null, submittedReportId: null });
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    
    const interviewEndTime = new Date();
    const durationInSeconds = Math.round((interviewEndTime - interviewStartRef.current) / 1000);

    const reportData = {
      candidateName: "Sumit Kumar",
      interviewDuration: durationInSeconds,
      events: logs.reverse(),
      createdAt: interviewEndTime.toISOString()
    };

    try {
      // --- FIX #3: Corrected Backend Port ---
      const response = await fetch('http://localhost:4000/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) throw new Error('Server responded with an error');

      const result = await response.json();
      setSubmissionStatus({ submitting: false, success: true, error: null, submittedReportId: result.reportId });

    } catch (submitError) {
      console.error("Error submitting report: ", submitError);
      setSubmissionStatus({ submitting: false, success: false, error: 'Failed to submit report. Please check your connection.', submittedReportId: null });
    }
  };
  
  useEffect(() => {
    const setupProctoring = async () => {
      try {
        setIsLoading(true);
        interviewStartRef.current = new Date();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await new Promise((resolve) => { video.onloadedmetadata = () => resolve(); });
          
          await tf.setBackend('webgl');
          
          const faceDetectorConfig = {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            maxFaces: 2,
          };
          
          // --- FIX #4: Corrected Detector Creation Syntax ---
          const [faceDetector, objectDetector] = await Promise.all([
            faceLandmarksDetection.createDetector(
              faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
              faceDetectorConfig
            ),
            cocoSsd.load()
          ]);
          
          setIsLoading(false);
          startRecording();
          detectionIntervalRef.current = setInterval(() => runDetection(faceDetector, objectDetector), 2000);
        }
      } catch (err) {
        console.error("Error during setup: ", err);
        setError("Setup failed. Please grant camera permissions and refresh the page.");
        setIsLoading(false);
      }
    };

    setupProctoring();

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [runDetection]);

  // The rest of the component (JSX, styles) remains the same as the improved UI version.
  const getIconForEvent = (eventText) => {
    if (eventText.includes('Multiple faces')) return '👨‍👩‍👧';
    if (eventText.includes('User absent')) return '👤❓';
    if (eventText.includes('looking away')) return '👀';
    if (eventText.includes('Cell phone')) return '📱';
    if (eventText.includes('Book')) return '📚';
    return '⚠️';
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Live Proctoring Session</h2>
      <div style={styles.mainContent}>
        <div style={styles.videoContainer}>
          {isLoading && <Overlay message="Initializing AI Models..." />}
          {error && <Overlay isError message={error} />}
          
          {isRecording && (
            <div style={styles.recIndicator}>
              <span style={styles.recDot}></span>
              <span>REC</span>
            </div>
          )}

          <video 
            ref={videoRef} 
            style={{...styles.video, visibility: isLoading || error ? 'hidden' : 'visible' }} 
            autoPlay muted playsInline
          />
        </div>
        <div style={styles.logsContainer}>
          <h3 style={styles.logsTitle}>Event Log</h3>
          <div style={styles.logsList}>
            {logs.length === 0 && !isLoading ? (
              <p style={styles.noLogsText}>No suspicious events detected yet.</p>
            ) : (
              <ul>
                {logs.map((log, index) => (
                  <li key={index} style={styles.logItem}>
                    <span style={styles.logIcon}>{getIconForEvent(log.event)}</span>
                    <span style={styles.logText}>
                      <strong>{log.timestamp}:</strong> {log.event}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div style={styles.controlsContainer}>
        <button 
          onClick={handleFinishInterview} 
          disabled={isLoading || submissionStatus.submitting || submissionStatus.success}
          style={{...styles.button, ...styles.finishButton}}
        >
          {submissionStatus.submitting ? 'Submitting...' : 'Finish Interview & Submit Report'}
        </button>
        {submissionStatus.success && (
          <div style={styles.successContainer}>
            <p style={styles.successMessage}>✔️ Report submitted successfully!</p>
            {videoUrl && (
              <a href={videoUrl} download="interview-recording.webm" style={{...styles.button, ...styles.downloadButton}}>
                Download Recording
              </a>
            )}
            <button 
              onClick={() => setReportId(submissionStatus.submittedReportId)}
              style={{...styles.button, ...styles.viewReportButton}}
            >
              View Report
            </button>
          </div>
        )}
        {submissionStatus.error && <p style={styles.errorMessage}>{submissionStatus.error}</p>}
      </div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
        }
        ul { list-style-type: none; padding: 0; margin: 0; }
      `}</style>
    </div>
  );
};

const Overlay = ({ message, isError = false }) => (
  <div style={{...styles.overlay, ...(isError && styles.errorOverlay)}}>
    <div>
      {isError && <h3 style={styles.errorTitle}>An error occurred:</h3>}
      <p>{message}</p>
    </div>
  </div>
);

const styles = {
  container: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f4f7f9', padding: '24px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxWidth: '1100px', margin: 'auto' },
  title: { textAlign: 'center', color: '#333', marginBottom: '24px' },
  mainContent: { display: 'flex', gap: '24px', alignItems: 'flex-start' },
  videoContainer: { position: 'relative', width: '640px', height: '480px' },
  video: { border: '1px solid #ddd', width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', borderRadius: '12px' },
  errorOverlay: { border: '2px solid #ff4d4d' },
  errorTitle: { color: '#ffc0c0', marginBottom: '8px' },
  recIndicator: { position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', color: 'white', fontWeight: 'bold', fontSize: '14px' },
  recDot: { width: '10px', height: '10px', backgroundColor: '#ff5252', borderRadius: '50%', marginRight: '8px', animation: 'pulse 1.5s infinite' },
  logsContainer: { flex: 1, height: '480px', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' },
  logsTitle: { textAlign: 'center', margin: 0, padding: '16px', borderBottom: '1px solid #eee', color: '#333', backgroundColor: '#f9fafb', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' },
  logsList: { flex: 1, overflowY: 'auto', padding: '8px' },
  noLogsText: { textAlign: 'center', color: '#888', paddingTop: '20px' },
  logItem: { display: 'flex', alignItems: 'center', marginBottom: '8px', padding: '8px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#555' },
  logIcon: { fontSize: '18px', marginRight: '12px' },
  logText: { flex: 1 },
  controlsContainer: { marginTop: '24px', textAlign: 'center' },
  button: { padding: '12px 24px', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', border: 'none', fontWeight: '600', transition: 'all 0.2s ease' },
  finishButton: { backgroundColor: '#dc3545', color: 'white' },
  successContainer: { marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  successMessage: { color: '#28a745', margin: 0, fontWeight: 'bold' },
  downloadButton: { backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none' },
  viewReportButton: { backgroundColor: '#007bff', color: 'white' },
  errorMessage: { color: '#dc3545', marginTop: '10px' },
};

export default CandidateView;

