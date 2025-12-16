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
    canvasRef,
    errorMsg // <--- GET THIS FROM HOOK
  } = useScanner();

  useEffect(() => {
    if (status === 'COMPLETED' && vitals) {
        navigate('/debrief', { state: { vitals } });
    }
  }, [status, vitals, navigate]);

  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

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
      
      <div className="fixed-top p-3">
        <button onClick={() => navigate('/')} className="btn btn-sm btn-dark rounded-pill border-secondary" style={{zIndex: 2000}}>
            <ArrowLeft /> Quit
        </button>
      </div>

      <div style={{position: 'absolute', opacity: 0, pointerEvents: 'none'}}>
        {/* CRITICAL: Add explicit playsInline for iOS */}
        <video ref={videoRef} playsInline muted autoPlay />
        <canvas ref={canvasRef} width="50" height="50" />
      </div>

      <div className="glass-panel p-4 rounded-4 shadow-lg border-0 position-relative">
        
        {status === 'ERROR' && (
            <div className="text-center py-5">
                <h3 className="text-danger">Camera Error</h3>
                {/* SHOW THE REAL ERROR */}
                <p className="text-muted small mt-2">{errorMsg || "Hardware Access Failed"}</p>
                <button onClick={() => window.location.reload()} className="btn btn-outline-light mt-3">
                    Reset System
                </button>
            </div>
        )}

        {status === 'IDLE' && <GuideStep onStart={startScan} />}

        {status === 'INITIALIZING' && (
            <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status" />
                <h4 className="text-white animate-pulse">Initializing Sensor...</h4>
                <p className="small text-muted">Please wait...</p>
            </div>
        )}

        {status === 'SCANNING' && (
            <ScannerStep progress={progress} quality={quality} chartData={chartData} />
        )}

      </div>
    </div>
  );
};