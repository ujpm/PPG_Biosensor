import { useEffect } from 'react';
import { useScanner } from '../hooks/useScanner';
import { GuideStep } from '../components/business/WizardSteps/GuideStep';
import { ScannerStep } from '../components/business/WizardSteps/ScannerStep';
import { useNavigate } from 'react-router-dom';

export const ScanMissionPage = () => {
  const navigate = useNavigate();
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

  // Redirect to Results when done
  useEffect(() => {
    if (status === 'COMPLETED' && vitals) {
        // Pass data via Router State to the next page
        navigate('/debrief', { state: { vitals } });
    }
  }, [status, vitals, navigate]);

  // Cleanup on unmount (Hardware safety)
  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  return (
    <div className="container d-flex flex-column justify-content-center" style={{minHeight: '80vh'}}>
      
      {/* Hidden Hardware Elements */}
      <div style={{position: 'absolute', opacity: 0, pointerEvents: 'none'}}>
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} width="50" height="50" />
      </div>

      <div className="glass-panel p-4 rounded-4 shadow-lg border-0">
        
        {/* STEP 1: Guide */}
        {status === 'IDLE' && (
            <GuideStep onStart={startScan} />
        )}

        {/* STEP 2: Scanning (Calibrating or Measuring) */}
        {(status === 'CALIBRATING' || status === 'SCANNING') && (
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