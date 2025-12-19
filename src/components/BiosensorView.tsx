import { useEffect, useRef, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { cameraManager } from '../core/camera/cameraManager';
import { signalProcessor } from '../core/signal/processor';
import type { Vitals } from '../types/biosensor';

export const BiosensorView = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [vitals, setVitals] = useState<Vitals>({ bpm: 0, hrv: 0, breathingRate: 0, confidence: 0 });
  const [status, setStatus] = useState("Ready to Scan");
  const [chartData, setChartData] = useState<number[]>(new Array(50).fill(0));
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafId = useRef<number>(0);
  const frameCount = useRef<number>(0);

  const startScan = async () => {
    try {
      setStatus("Initializing...");
      const stream = await cameraManager.startCamera();
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        try { await cameraManager.toggleTorch(true); } catch(e) {}
        
        setIsScanning(true);
        setStatus("Scanning...");
        signalProcessor.reset();
        frameCount.current = 0;
        loop();
      }
    } catch (err) {
      console.error(err);
      setStatus("Camera Failed");
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    cameraManager.stopCamera();
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setStatus("Stopped");
  };

  const loop = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, 50, 50);
    const frame = ctx.getImageData(0, 0, 50, 50);
    const redValue = signalProcessor.processFrame(frame, Date.now());
    
    frameCount.current++;

    if (frameCount.current % 4 === 0) {
        setChartData(prev => [...prev, redValue].slice(-50));
        
        if (frameCount.current % 30 === 0) {
            setVitals(signalProcessor.calculateVitals());
        }
    }
    
    if (isScanning) {
        rafId.current = requestAnimationFrame(loop);
    }
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  return (
    <div className="container py-4">
      <div className="card shadow mb-4 border-primary">
        <div className="card-body text-center">
            <canvas ref={canvasRef} width="50" height="50" style={{ display: 'none' }} />
            
            <div className="ratio ratio-16x9 mb-3 bg-dark rounded overflow-hidden">
                <video ref={videoRef} muted playsInline style={{ objectFit: 'cover', opacity: 0.6 }} />
                <div className="position-absolute top-50 start-50 translate-middle text-white fw-bold">
                    {status}
                </div>
            </div>

            {!isScanning ? (
                <button onClick={startScan} className="btn btn-success w-100">Start Bioscan</button>
            ) : (
                <button onClick={stopScan} className="btn btn-danger w-100">Stop Scan</button>
            )}

            {/* Vitals Display */}
            <div className="row mt-3">
                <div className="col-4">
                    <h3>{vitals.bpm}</h3>
                    <small>BPM</small>
                </div>
                <div className="col-4">
                    <h3>{vitals.hrv}</h3>
                    <small>HRV</small>
                </div>
                <div className="col-4">
                    <h3>{vitals.breathingRate}</h3>
                    <small>Resp</small>
                </div>
            </div>

            <div className="mt-3" style={{height: '150px'}}>
                 <Chart type='line' data={{
                    labels: Array(50).fill(''),
                    datasets: [{ data: chartData, borderColor: 'red', pointRadius: 0, tension: 0.4 }]
                 }} options={{ 
                    responsive: true, maintainAspectRatio: false, animation: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { display: false }, y: { display: false } }
                 }} />
            </div>
        </div>
      </div>
    </div>
  );
};