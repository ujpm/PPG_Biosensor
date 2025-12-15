import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chart } from 'react-chartjs-2';
import { ArrowLeft, Share, Cpu, HeartPulse } from 'react-bootstrap-icons';
import { useHaptics } from '../hooks/useHaptics';
import { analyzeVitals } from '../services/ai/gemini';
import type { Vitals, AIHealthAnalysis } from '../types/biosensor';

export const Debrief = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vitals } = (location.state as { vitals: Vitals }) || {};
  
  const { isPlaying, playHeartbeat, stopHeartbeat } = useHaptics();
  
  // AI State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<AIHealthAnalysis | null>(null);

  // Safety Redirect if no data (e.g., user refreshed page)
  useEffect(() => {
    if (!vitals) navigate('/scan');
  }, [vitals, navigate]);

  // Generate a "Clean" Waveform for visual (Simulated based on BPM)
  // In a real app, we would pass the actual 'bufferSnippet' from the scanner here.
  const generateWaveform = () => {
    if (!vitals) return [];
    const points = [];
    const frequency = vitals.bpm / 60; 
    for (let i = 0; i < 50; i++) {
        // Simple Sine wave math to look pretty
        points.push(Math.sin((i * frequency) * 0.5) * 10 + 50);
    }
    return points;
  };

  const handleAIAnalysis = async () => {
    if (aiReport) return; // Don't fetch twice
    setAiLoading(true);
    try {
        const result = await analyzeVitals({ vitals });
        setAiReport(result);
    } catch (err) {
        alert("AI Service Unavailable");
    }
    setAiLoading(false);
  };

  const toggleAI = () => {
      if (!aiEnabled) handleAIAnalysis();
      setAiEnabled(!aiEnabled);
  };

  if (!vitals) return null;

  return (
    <div className="container py-4 animate-fade-in-up">
      
      {/* 1. HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button onClick={() => navigate('/')} className="btn btn-sm btn-outline-secondary rounded-pill">
            <ArrowLeft /> Exit
        </button>
        <span className="text-muted small">SESSION ID: #8X29</span>
        <button className="btn btn-sm btn-outline-primary rounded-pill">
            <Share /> Save
        </button>
      </div>

      {/* 2. THE BIG METRIC (Glass Card) */}
      <div className="glass-panel p-4 rounded-4 mb-4 text-center position-relative overflow-hidden">
        <div className="row align-items-center">
            <div className="col-6 border-end border-secondary">
                <h1 className="display-1 fw-bold text-white mb-0" style={{textShadow: '0 0 20px rgba(255,0,60,0.6)'}}>
                    {vitals.bpm}
                </h1>
                <small className="text-muted fw-bold">AVG BPM</small>
            </div>
            <div className="col-6">
                <h2 className="display-6 fw-bold text-primary mb-0">
                    {vitals.hrv}<span className="fs-6 text-muted">ms</span>
                </h2>
                <small className="text-muted fw-bold">HRV (STRESS)</small>
            </div>
        </div>

        {/* The Waveform Visual */}
        <div className="mt-4" style={{height: '120px', opacity: 0.8}}>
            <Chart type='line' data={{
                labels: Array(50).fill(''),
                datasets: [{
                    data: generateWaveform(),
                    borderColor: '#7000FF',
                    borderWidth: 3,
                    tension: 0.5,
                    pointRadius: 0
                }]
            }} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {x:{display:false}, y:{display:false}},
                plugins: {legend:{display:false}},
                animation: { duration: 2000 }
            }} />
        </div>
      </div>

      {/* 3. FEEL YOUR PULSE (Haptics) */}
      <button 
        onClick={() => isPlaying ? stopHeartbeat() : playHeartbeat(vitals.bpm)}
        className={`btn w-100 py-3 mb-4 rounded-4 d-flex align-items-center justify-content-center gap-2 shadow-lg transition-all ${isPlaying ? 'btn-danger' : 'glass-panel text-white'}`}
        style={{border: '1px solid rgba(255, 255, 255, 0.1)'}}
      >
        <HeartPulse size={20} className={isPlaying ? 'animate-pulse' : ''} />
        {isPlaying ? 'STOP PLAYBACK' : 'FEEL YOUR RHYTHM'}
      </button>

      {/* 4. AI INSIGHTS TOGGLE */}
      <div className="glass-panel rounded-4 p-3">
        <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0 mb-0">
            <label className="form-check-label d-flex align-items-center gap-2 text-white" htmlFor="aiToggle">
                <Cpu className="text-warning" />
                <span>Dr. Gemini Analysis</span>
            </label>
            <input 
                className="form-check-input ms-auto" 
                type="checkbox" 
                role="switch" 
                id="aiToggle" 
                checked={aiEnabled}
                onChange={toggleAI}
                style={{cursor: 'pointer', width: '3em', height: '1.5em'}}
            />
        </div>

        {/* AI CONTENT AREA */}
        {aiEnabled && (
            <div className="mt-3 pt-3 border-top border-secondary animate-fade-in">
                {aiLoading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border text-primary text-glow" role="status" />
                        <p className="small text-muted mt-2">Connecting to Neural Net...</p>
                    </div>
                ) : aiReport ? (
                    <div className="text-start">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="badge bg-dark border border-secondary text-primary">
                                {aiReport.status} PRIORITY
                            </span>
                        </div>
                        <p className="lead text-white" style={{fontSize: '1.1rem'}}>
                            "{aiReport.summary}"
                        </button>
                        <div className="bg-black rounded-3 p-3 mt-3 border border-secondary">
                            <h6 className="text-primary small fw-bold mb-2">RECOMMENDATION</h6>
                            <p className="mb-0 small text-muted">{aiReport.recommendation}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-danger small">Analysis failed. Check connection.</p>
                )}
            </div>
        )}
      </div>

    </div>
  );
};