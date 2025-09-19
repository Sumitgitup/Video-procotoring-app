import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
// Import the backends
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import '@mediapipe/face_mesh';


const CandidateView = ({ setReportId }) => { // Prop is received here
  const videoRef = useRef(null);
  const noFaceTimerRef = useRef(null);
  const lookingAwayTimerRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const interviewStartRef = useRef(null);

  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState({ submitting: false, success: false, error: null, submittedReportId: null });

  const addLog = useCallback((eventText) => {
    setLogs(prevLogs => {
      // To prevent spamming, don't log the same event consecutively
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
      // Run both detections in parallel for efficiency
      const [faces, predictions] = await Promise.all([
        faceDetector.estimateFaces(video),
        objectDetector.detect(video)
      ]);

      // --- FOCUS DETECTION LOGIC ---
      if (faces.length > 1) {
        addLog('Multiple faces detected');
      }

      if (faces.length === 0) {
        if (!noFaceTimerRef.current) {
          noFaceTimerRef.current = setTimeout(() => {
            addLog('User absent for > 10 seconds');
          }, 10000);
        }
      } else {
        if (noFaceTimerRef.current) {
          clearTimeout(noFaceTimerRef.current);
          noFaceTimerRef.current = null;
        }
      }

      if (faces.length === 1) {
        const { keypoints } = faces[0];
        const noseTip = keypoints.find(p => p.name === 'noseTip');
        const leftEye = keypoints.find(p => p.name === 'leftEye');
        const rightEye = keypoints.find(p => p.name === 'rightEye');
        if (noseTip && leftEye && rightEye) {
          const eyeMidpoint = (leftEye.x + rightEye.x) / 2;
          const horizontalDistance = noseTip.x - eyeMidpoint;
          const lookingAwayThreshold = 35;
          if (Math.abs(horizontalDistance) > lookingAwayThreshold) {
            if (!lookingAwayTimerRef.current) {
              lookingAwayTimerRef.current = setTimeout(() => {
                addLog('User looking away for > 5 seconds');
              }, 5000);
            }
          } else {
            if (lookingAwayTimerRef.current) {
              clearTimeout(lookingAwayTimerRef.current);
              lookingAwayTimerRef.current = null;
            }
          }
        }
      } else {
        if (lookingAwayTimerRef.current) {
          clearTimeout(lookingAwayTimerRef.current);
          lookingAwayTimerRef.current = null;
        }
      }

      // --- OBJECT DETECTION LOGIC ---
      const suspiciousObjects = ['cell phone', 'book'];
      for (let prediction of predictions) {
        if (suspiciousObjects.includes(prediction.class) && prediction.score > 0.6) {
          addLog(`${prediction.class.charAt(0).toUpperCase() + prediction.class.slice(1)} detected`);
        }
      }

    } catch (estimationError) {
      console.error("Error during detection: ", estimationError);
    }
  }, [addLog]);

  const handleFinishInterview = async () => {
    setSubmissionStatus({ submitting: true, success: false, error: null, submittedReportId: null });

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    const interviewEndTime = new Date();
    const durationInSeconds = Math.round((interviewEndTime - interviewStartRef.current) / 1000);

    const reportData = {
      candidateName: "Sumit Kumar", // Placeholder
      interviewDuration: durationInSeconds,
      events: logs.reverse(), // Put logs in chronological order for the report
      createdAt: interviewEndTime.toISOString()
    };

    try {
      const response = await fetch('http://localhost:4000/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      const result = await response.json();
      console.log('Report submitted successfully:', result);
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

          const [faceDetector, objectDetector] = await Promise.all([
            faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
              runtime: 'mediapipe',
              solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            }),
            cocoSsd.load()
          ]);

          console.log("All models loaded successfully.");
          setIsLoading(false);

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

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div className="candidate-view" style={{ position: 'relative', width: '640px', height: '480px' }}>
          {isLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px' }}><p>Loading AI Models...</p></div>}
          {error && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', borderRadius: '8px', border: '2px solid #ff4d4d' }}><div><h3 style={{color: '#ffc0c0'}}>An error occurred:</h3><p>{error}</p></div></div>}
          <video
            ref={videoRef}
            style={{ border: '2px solid black', width: '100%', height: '100%', borderRadius: '8px', visibility: isLoading || error ? 'hidden' : 'visible' }}
            autoPlay muted playsInline
          />
        </div>
        <div className="logs-view" style={{ width: '350px', height: '480px', border: '2px solid #ccc', borderRadius: '8px', overflowY: 'auto', padding: '10px', backgroundColor: '#f9f9f9' }}>
          <h3 style={{ textAlign: 'center', marginTop: '0', borderBottom: '1px solid #ddd', paddingBottom: '10px', color: '#333' }}>Event Log</h3>
          {logs.length === 0 ? <p style={{textAlign: 'center', color: '#888', paddingTop: '20px' }}>No events detected yet.</p> : <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>{logs.map((log, index) => <li key={index} style={{ marginBottom: '8px', padding: '5px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#555' }}><strong style={{color: '#000'}}>{log.timestamp}:</strong> {log.event}</li>)}</ul>}
        </div>
      </div>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={handleFinishInterview}
          disabled={isLoading || submissionStatus.submitting || submissionStatus.success}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', borderRadius: '5px', border: 'none', backgroundColor: '#28a745', color: 'white' }}
        >
          {submissionStatus.submitting ? 'Submitting...' : 'Finish Interview & Submit Report'}
        </button>
        {submissionStatus.success && (
          <div>
            <p style={{ color: 'green', marginTop: '10px' }}>Report submitted successfully!</p>
            <button
              onClick={() => setReportId(submissionStatus.submittedReportId)}
              style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white' }}
            >
              View Report
            </button>
          </div>
        )}
        {submissionStatus.error && <p style={{ color: 'red', marginTop: '10px' }}>{submissionStatus.error}</p>}
      </div>
    </div>
  );
};

export default CandidateView;

