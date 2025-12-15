import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, LightningCharge } from 'react-bootstrap-icons';
import { useDevice } from '../hooks/useDevice';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useDevice();

  const handleStart = () => {
    if (isMobile) {
      navigate('/scan');
    } else {
      alert("⚠️ Desktop Detected\n\nThis scanner requires a rear camera and flash. Please open this link on your smartphone.");
    }
  };

  return (
    <div className="container py-5 text-center text-white">
      
      {/* 1. HERO SECTION */}
      <div className="mb-5 animate-fade-in-up">
        <h1 className="display-4 fw-bold mb-3 text-glow">
          Bio-Metric <span className="text-primary">Triage</span>
        </h1>
        <p className="lead text-muted mb-4">
          Clinical-grade heart analysis using your smartphone camera.
          <br/>No wearables required.
        </p>

        {/* --- GIF PLACEHOLDER --- */}
        {/* Instructions: 
            1. Put your gif in public/demo.gif 
            2. Uncomment the img tag below
        */}
        <div className="ratio ratio-16x9 mx-auto mb-4 glass-panel rounded-4 overflow-hidden" style={{maxWidth: '350px', border: '1px solid rgba(0, 240, 255, 0.3)'}}>
           {/* <img src="/demo.gif" alt="App Demo" style={{objectFit: 'cover'}} /> */}
           <div className="d-flex align-items-center justify-content-center h-100 text-muted">
              [ App Usage Demo GIF ]
           </div>
        </div>

        {/* CTA BUTTON */}
        <button 
          onClick={handleStart}
          className="btn btn-lg btn-primary rounded-pill px-5 py-3 shadow-lg"
          style={{
            background: 'linear-gradient(45deg, #00F0FF, #005F73)',
            border: 'none',
            fontSize: '1.2rem',
            letterSpacing: '1px'
          }}
        >
          {isMobile ? 'INITIALIZE SCANNER' : 'OPEN ON MOBILE'}
        </button>
      </div>

      {/* 2. FEATURES GRID */}
      <div className="row g-4 mt-5">
        <div className="col-4">
          <div className="p-3 glass-panel rounded-3 h-100">
            <Activity className="text-primary mb-2" size={24} />
            <h6 className="small fw-bold">HRV Analysis</h6>
          </div>
        </div>
        <div className="col-4">
          <div className="p-3 glass-panel rounded-3 h-100">
            <ShieldCheck className="text-success mb-2" size={24} />
            <h6 className="small fw-bold">100% Private</h6>
          </div>
        </div>
        <div className="col-4">
          <div className="p-3 glass-panel rounded-3 h-100">
            <LightningCharge className="text-warning mb-2" size={24} />
            <h6 className="small fw-bold">Instant AI</h6>
          </div>
        </div>
      </div>

    </div>
  );
};