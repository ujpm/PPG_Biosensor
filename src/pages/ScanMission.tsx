import { useEffect } from 'react';
import { useScanner } from '../hooks/useScanner';
import { GuideStep } from '../components/business/WizardSteps/GuideStep';
import { ScannerStep } from '../components/business/WizardSteps/ScannerStep';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useDevice } from '../hooks/useDevice';

export const ScanMissionPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useDevice();
  
  const { 
    status, 
    progress, 
    quality, 
    vitals, 
    chartData, 
    startScan, 
    stopScan,
    videoRef, 
    canvasRef 
  } = useScanner();

  // Navigation: Go to Debrief when done
  useEffect(() => {
    if (status === 'COMPLETED' && vitals) {
        navigate('/debrief', { state: { vitals } });
    }
  }, [status, vitals, navigate]);

  // Cleanup: Stop camera on exit
  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  // DESKTOP BLOCKER
  if (!isMobile) {
    return (
      <div className="container d-flex flex-column justify-content-center align-items-center" style={{minHeight: '80vh'}}>
        <div className="glass-panel p-5 text-center rounded-4 shadow-lg text-white">
            <h2>Mobile Only</h2>
            <p>Please use a smartphone with a camera.</p>
            <button className="btn btn-outline-light" onClick={() => navigate('/')}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container d-flex flex-column justify-content-center" style={{minHeight: '100vh'}}>
      
      {/* SAFE NAV: Always visible exit button */}
      <div className="fixed-top p-3">
        <button onClick={() => navigate('/')} className="btn btn-sm btn-dark rounded-pill border-secondary" style={{zIndex: 2000}}>
            <ArrowLeft /> Quit
        </button>
      </div>

      {/* HARDWARE: Hidden video elements */}
      <div style={{position: 'absolute', opacity: 0, pointerEvents: 'none'}}>
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} width="50" height="50" />
      </div>

      <div className="glass-panel p-4 rounded-4 shadow-lg border-0 position-relative">
        
        {/* 1. ERROR STATE */}
        {status === 'ERROR' && (
            <div className="text-center py-5">
                <h3 className="text-danger">Camera Error</h3>
                <p className="text-muted">Could not access hardware.</p>
                <button onClick={() => window.location.reload()} className="btn btn-outline-light mt-3">
                    Reset
                </button>
            </div>
        )}

        {/* 2. IDLE STATE (Guide) */}
        {status === 'IDLE' && (
            <GuideStep onStart={startScan} />
        )}

        {/* 3. INITIALIZING STATE (The "Warmup" Spinner) */}
        {/* This replaces the old "WARMING_UP" state */}
        {status === 'INITIALIZING' && (
            <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status" />
                <h4 className="text-white animate-pulse">Starting Sensor...</h4>
                <p className="small text-muted">Adjusting exposure...</p>
            </div>
        )}

        {/* 4. SCANNING STATE (The Orb) */}
        {/* This handles the active measurement */}
        {status === 'SCANNING' && (
            <ScannerStep 
                progress={progress} 
                quality={quality} 
                chartData={chartData} 
            />
        )}

      </div>
    </div>
  );
};