'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Camera, AlertCircle, Play, Square, Sparkles, Award, History, Clock } from 'lucide-react';

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

export default function PosturePage() {
  const { user } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [exercise, setExercise] = useState<'SQUAT' | 'PUSHUP' | 'PLANK'>('SQUAT');
  const [repCount, setRepCount] = useState(0);
  const [accuracyScore, setAccuracyScore] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('Align your body and click Start Session');
  const [duration, setDuration] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [webcamAvailable, setWebcamAvailable] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const poseInstanceRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);
  
  // Rep tracking state refs to avoid closure stale state
  const squatStateRef = useRef({ stage: 'up', reps: 0 });
  const pushupStateRef = useRef({ stage: 'up', reps: 0 });

  // Load MediaPipe CDN Scripts dynamically
  useEffect(() => {
    const loadScript = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'),
      loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'),
      loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')
    ])
      .then(() => {
        setScriptLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load MediaPipe from CDN', err);
      });

    fetchPostureHistory();

    return () => {
      stopSession();
    };
  }, []);

  const fetchPostureHistory = async () => {
    try {
      const data = await api.getPostureHistory();
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Math helper to calculate angle between three points
  // Points format: {x, y}
  const calculateAngle = (p1: any, p2: any, p3: any) => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360.0 - angle;
    }
    return angle;
  };

  const onPoseResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions matching container
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw camera frame to canvas
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;
      
      // Extract needed key points
      // MediaPipe landmarks: Left Shoulder (11), Left Elbow (13), Left Wrist (15)
      // Left Hip (23), Left Knee (25), Left Ankle (27)
      const lShoulder = landmarks[11];
      const lElbow = landmarks[13];
      const lWrist = landmarks[15];
      const lHip = landmarks[23];
      const lKnee = landmarks[25];
      const lAnkle = landmarks[27];

      let currentAccuracy = 100;
      let formFeedback = 'Perfect alignment!';

      // 1. geometric calculations
      if (exercise === 'SQUAT') {
        const kneeAngle = calculateAngle(lHip, lKnee, lAnkle);
        
        // Count reps
        // Squat down: knee angle is low (< 100)
        // Squat up: knee angle is high (> 150)
        if (kneeAngle < 105) {
          squatStateRef.current.stage = 'down';
          formFeedback = 'Good depth, push up!';
        }
        if (kneeAngle > 155 && squatStateRef.current.stage === 'down') {
          squatStateRef.current.stage = 'up';
          squatStateRef.current.reps += 1;
          setRepCount(squatStateRef.current.reps);
        }

        // Assess posture: knees buckling or hips too high
        if (kneeAngle > 115 && squatStateRef.current.stage === 'down') {
          currentAccuracy -= 20;
          formFeedback = 'Go lower for full depth!';
        }

        setAccuracyScore(prev => [...prev, currentAccuracy]);
        setFeedback(formFeedback);

      } else if (exercise === 'PUSHUP') {
        const elbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
        const hipAngle = calculateAngle(lShoulder, lHip, lKnee);

        // Count reps
        // Pushup down: elbow angle < 95
        // Pushup up: elbow angle > 150
        if (elbowAngle < 100) {
          pushupStateRef.current.stage = 'down';
          formFeedback = 'Push up, engage your chest!';
        }
        if (elbowAngle > 150 && pushupStateRef.current.stage === 'down') {
          pushupStateRef.current.stage = 'up';
          pushupStateRef.current.reps += 1;
          setRepCount(pushupStateRef.current.reps);
        }

        // Check if back is bent (Hip angle should be close to 170-180 degrees)
        if (hipAngle < 155 || hipAngle > 195) {
          currentAccuracy -= 30;
          formFeedback = 'Keep your hips straight - tighten core!';
        }

        setAccuracyScore(prev => [...prev, currentAccuracy]);
        setFeedback(formFeedback);

      } else if (exercise === 'PLANK') {
        // Straight line check: Shoulder, Hip, Knee, Ankle
        const bodyAngle = calculateAngle(lShoulder, lHip, lKnee);
        
        if (bodyAngle < 160 || bodyAngle > 200) {
          currentAccuracy -= 35;
          formFeedback = 'Adjust hips! Keep body straight.';
        } else {
          formFeedback = 'Holding great plank form!';
        }

        setAccuracyScore(prev => [...prev, currentAccuracy]);
        setFeedback(formFeedback);
      }

      // Draw MediaPipe skeleton with color coded feedback
      const strokeColor = currentAccuracy < 80 ? '#f43f5e' : '#10b981'; // Red for warning, Emerald for correct
      
      // Draw custom joints canvas overlays
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 5;
      
      // Draw lines
      const drawLine = (pt1: any, pt2: any) => {
        ctx.beginPath();
        ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
        ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
        ctx.stroke();
      };

      if (exercise === 'SQUAT') {
        drawLine(lHip, lKnee);
        drawLine(lKnee, lAnkle);
      } else {
        drawLine(lShoulder, lElbow);
        drawLine(lElbow, lWrist);
        drawLine(lShoulder, lHip);
        drawLine(lHip, lKnee);
      }
      
      // Draw circular highlight joints
      ctx.fillStyle = '#ffffff';
      [lShoulder, lElbow, lWrist, lHip, lKnee, lAnkle].forEach(pt => {
        if (pt) {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }
  };

  const startSession = async () => {
    if (!scriptLoaded) return;
    setIsTracking(true);
    setRepCount(0);
    setAccuracyScore([]);
    setDuration(0);
    setFeedback('Calibrating webcam - stand in frame');
    
    // Reset state refs
    squatStateRef.current = { stage: 'up', reps: 0 };
    pushupStateRef.current = { stage: 'up', reps: 0 };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamAvailable(true);

      // Initialize MediaPipe Pose

      console.log("window.Pose =", window.Pose);
      console.log("window.Camera =", window.Camera);

      if (!window.Pose || !window.Camera) {
        alert("MediaPipe failed to load");
        return;
      }
      const pose = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onPoseResults);
      poseInstanceRef.current = pose;

      // Initialize MediaPipe Camera helper
      if (videoRef.current) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && poseInstanceRef.current) {
              await poseInstanceRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
        cameraInstanceRef.current = camera;
      }

      // Start duration clock
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Camera access failed', err);
      setWebcamAvailable(false);
      setIsTracking(false);
    }
  };

  const stopSession = async () => {
    setIsTracking(false);
    
    // Clear interval timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop camera streams
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (cameraInstanceRef.current) {
      cameraInstanceRef.current.stop();
      cameraInstanceRef.current = null;
    }

    // Save report to database if accuracy values exist
    if (accuracyScore.length > 0) {
      const avgAccuracy = Math.round(
        accuracyScore.reduce((acc, curr) => acc + curr, 0) / accuracyScore.length
      );
      
      const sessionSummary = exercise === 'PLANK' 
        ? `Held plank posture for ${duration}s.` 
        : `Completed ${repCount} reps of ${exercise.toLowerCase()}s.`;
        
      try {
        await api.logPostureSession({
          exercise_type: exercise,
          feedback_summary: `${sessionSummary} Form compliance score: ${avgAccuracy}%.`,
          accuracy_score: avgAccuracy,
          duration_seconds: duration,
        });
        fetchPostureHistory();
      } catch (e) {
        console.error('Failed to save posture log', e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900 border-blue-500/20">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Real-time Posture AI</h1>
        <p className="text-sm text-slate-400 mt-1">Get immediate skeletal safety metrics using webcam feeds.</p>
      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Webcam Screen */}
        <div className="glass-card p-6 md:col-span-2 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-2xl aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-850 flex items-center justify-center">
            {/* Camera elements */}
            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas ref={canvasRef} className="w-full h-full object-cover transform scale-x-[-1]" />

            {!isTracking && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Camera className="h-12 w-12 text-slate-600" />
                <div>
                  <h3 className="text-lg font-bold">Webcam Video Feed</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    {!scriptLoaded ? 'Loading MediaPipe CV dependencies...' : 'Ensure your camera permissions are enabled.'}
                  </p>
                </div>
                <button
                  onClick={startSession}
                  disabled={!scriptLoaded}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center disabled:opacity-50"
                >
                  <Play className="h-4.5 w-4.5 mr-2" /> Start AI Tracker
                </button>
              </div>
            )}

            {isTracking && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold uppercase tracking-wider text-slate-350">{exercise} Tracking</span>
                </div>
                <div className="flex items-center space-x-4 font-semibold text-slate-200">
                  <span>Time: {duration}s</span>
                  {exercise !== 'PLANK' && <span>Reps: {repCount}</span>}
                </div>
                <button 
                  onClick={stopSession}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold rounded-lg flex items-center"
                >
                  <Square className="h-3.5 w-3.5 mr-1.5 fill-current" /> End
                </button>
              </div>
            )}
          </div>

          {/* Form assessment status banner */}
          <div className="w-full max-w-2xl mt-4 bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center space-x-3 text-xs">
            <AlertCircle className="h-5 w-5 text-blue-400 shrink-0" />
            <p className="text-slate-300 font-medium leading-relaxed">{feedback}</p>
          </div>
        </div>

        {/* Right Column: Settings and History */}
        <div className="space-y-6">
          {/* Settings panel */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4">Assessment Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Choose Exercise</label>
                <select
                  disabled={isTracking}
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none"
                >
                  <option value="SQUAT">Squat Depth & Knees</option>
                  <option value="PUSHUP">Pushup Depth & Back</option>
                  <option value="PLANK">Plank Alignment</option>
                </select>
              </div>
              
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-2 text-xs text-slate-400">
                <p className="font-semibold text-slate-300 mb-1">Form Correction Guidelines:</p>
                {exercise === 'SQUAT' && (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Stand completely inside the camera frame.</li>
                    <li>Squat down below 100 degrees knee bend.</li>
                    <li>Keep your back straight.</li>
                  </ul>
                )}
                {exercise === 'PUSHUP' && (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Set camera profile from the side.</li>
                    <li>Align shoulders, hips, and knees.</li>
                    <li>Buckling your back will trigger accuracy warnings.</li>
                  </ul>
                )}
                {exercise === 'PLANK' && (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Hold straight shoulder-hip-knee line.</li>
                    <li>Hips drooping or elevated reduces accuracy.</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Session history panel */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <History className="h-5 w-5 mr-2 text-slate-400" /> Session History
            </h3>
            
            <div className="divide-y divide-slate-850 max-h-60 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">No session reports recorded.</p>
              ) : (
                history.map(item => (
                  <div key={item.id} className="py-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-200">{item.exercise_type} Session</span>
                      <span className={`font-semibold ${item.accuracy_score >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.accuracy_score}% Accuracy
                      </span>
                    </div>
                    <p className="text-slate-450 leading-relaxed">{item.feedback_summary}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 pt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{item.duration_seconds} seconds</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
