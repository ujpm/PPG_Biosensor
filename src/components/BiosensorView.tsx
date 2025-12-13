import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { cameraManager } from '../core/camera/cameraManager';
import { signalProcessor } from '../core/signal/processor';
import { Vitals } from '../types/biosensor';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const BiosensorView = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [vitals, setVitals] = useState<Vitals>({ bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 });
  const [status, setStatus] = useState("Ready to Scan");
  const [chartData, setChartData] = useState<number[]>(new Array(50).fill(0));
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameId = useRef<number>(0);

  // --- ACTIONS ---

  const startScan = async () => {
    try {
      setStatus("Initializing Camera...");
      const stream = await cameraManager.startCamera();
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
      setStatus("Detecting Pulse... Place finger gently over camera/flash.");
      loop();
    } catch (err) {
      console.error(err);
      setStatus("Error: Camera access denied or HTTPS missing.");
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    cameraManager.stopCamera();
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }
    setStatus("Scan Stopped");
  };

  // --- CORE LOOP ---

  const loop = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // 1. Draw video frame to hidden canvas
    ctx.drawImage(videoRef.current, 0, 0, 50, 50);
    const frame = ctx.getImageData(0, 0, 50, 50);

    // 2. Process Signal (Math)
    const redValue = signalProcessor.processFrame(frame, Date.now());

    // 3. Update Vitals every 10 frames (Optimization)
    if (Date.now() % 10 === 0) {
        const currentVitals = signalProcessor.calculateVitals();
        setVitals(currentVitals);
    }

    // 4. Update Chart Data
    setChartData(prev => {
        const newData = [...prev, redValue];
        return newData.slice(-50); // Keep last 50 points
    });

    animationFrameId.current = requestAnimationFrame(loop);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        stopScan();
    };
  }, []);

  // --- RENDER ---

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          
          {/* HEADER CARD */}
          <div className="card shadow mb-4 border-primary">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">❤️ MicroSmart Biosensor</h5>
              {isScanning && <span className="badge bg-danger animate-pulse">LIVE</span>}
            </div>
            <div className="card-body text-center">
               
              {/* HIDDEN PROCESSING CANVAS */}
              <canvas ref={canvasRef} width="50" height="50" style={{ display: 'none' }} />
              
              {/* VIDEO PREVIEW (For Aiming) */}
              <div className="ratio ratio-16x9 mb-3 bg-dark rounded border border-secondary position-relative overflow-hidden">
                <video 
                    ref={videoRef} 
                    muted 
                    playsInline 
                    style={{ objectFit: 'cover', opacity: 0.6 }} 
                />
                <div className="position-absolute top-50 start-50 translate-middle text-white fw-bold" style={{ textShadow: '0px 0px 5px black', width: '100%', textAlign: 'center' }}>
                    {status}
                </div>
              </div>

              {/* ACTION BUTTON */}
              {!isScanning ? (
                <button onClick={startScan} className="btn btn-lg btn-success w-100 shadow">
                   ▶ Start Bioscan
                </button>
              ) : (
                <button onClick={stopScan} className="btn btn-lg btn-danger w-100 shadow">
                   ⏹ Stop Scan
                </button>
              )}
            </div>
          </div>

          {/* VITALS GRID */}
          <div className="row g-2 mb-4">
            {/* BPM */}
            <div className="col-4">
              <div className="card text-center h-100 border-danger">
                <div className="card-body p-2">
                  <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>HEART RATE</small>
                  <h2 className="text-danger fw-bold display-6 mb-0">
                    {vitals.bpm > 0 ? vitals.bpm : '--'}
                  </h2>
                  <small>BPM</small>
                </div>
              </div>
            </div>

            {/* HRV */}
            <div className="col-4">
              <div className="card text-center h-100 border-success">
                <div className="card-body p-2">
                  <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>HRV (STRESS)</small>
                  <h2 className="text-success fw-bold display-6 mb-0">
                    {vitals.hrv > 0 ? vitals.hrv : '--'}
                  </h2>
                  <small>ms</small>
                </div>
              </div>
            </div>

            {/* RESPIRATION */}
            <div className="col-4">
              <div className="card text-center h-100 border-info">
                <div className="card-body p-2">
                  <small className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>BREATHING</small>
                  <h2 className="text-info fw-bold display-6 mb-0">
                    {vitals.breathingRate > 0 ? vitals.breathingRate : '--'}
                  </h2>
                  <small>rpm</small>
                </div>
              </div>
            </div>
          </div>

          {/* CHART CARD */}
          <div className="card shadow mb-3">
             <div className="card-header py-1">
                <small className="text-muted">Live PPG Signal (Raw)</small>
             </div>
             <div className="card-body p-2 bg-dark">
                <div style={{ height: '150px' }}>
                    <Chart 
                        type='line' 
                        data={{
                            labels: new Array(50).fill(''),
                            datasets: [{
                                label: 'Blood Flow',
                                data: chartData,
                                borderColor: 'rgb(220, 53, 69)', // Bootstrap Danger Color
                                borderWidth: 2,
                                pointRadius: 0,
                                tension: 0.4,
                                fill: false
                            }]
                        }} 
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            animation: false, // CRITICAL: Disable animation for real-time performance
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { display: false },
                                y: { display: false }
                            }
                        }}
                    />
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};