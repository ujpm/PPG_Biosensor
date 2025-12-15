import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chart } from 'react-chartjs-2';
import { ArrowLeft, Share, Cpu, HeartPulse, Download, FileEarmarkPdf } from 'react-bootstrap-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Hooks & Services
import { useHaptics } from '../hooks/useHaptics';
import { useFirestore } from '../hooks/useFirestore';
import { analyzeVitals } from '../services/ai/gemini';
import { auth } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';
import type { Vitals, AIHealthAnalysis } from '../types/biosensor';

export const Debrief = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vitals } = (location.state as { vitals: Vitals }) || {};
  
  // Refs
  const reportRef = useRef<HTMLDivElement>(null); // Target for PDF generation

  // Hooks
  const { isPlaying, playHeartbeat, stopHeartbeat } = useHaptics();
  const { saveSession, isSaving, saveError } = useFirestore();
  
  // Local State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<AIHealthAnalysis | null>(null);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVED'>('IDLE');

  // 1. Safety Redirect
  useEffect(() => {
    if (!vitals) navigate('/scan');
  }, [vitals, navigate]);

  // 2. Generate a "Clean" Clinical Waveform (Simulated for Visuals)
  // In a future update, we will pass the actual cleaned buffer from the scanner.
  const generateWaveform = () => {
    if (!vitals) return [];
    const points = [];
    const frequency = vitals.bpm / 60; 
    for (let i = 0; i < 60; i++) {
        // Create a P-QRS-T like shape (simplified sine combo)
        const t = i * frequency * 0.2;
        const wave = Math.sin(t) + 0.5 * Math.sin(2 * t) + 0.2 * Math.sin(4 * t);
        points.push(wave * 10 + 50);
    }
    return points;
  };

  // 3. AI Analysis Handler
  const handleAIAnalysis = async () => {
    if (aiReport) return;
    setAiLoading(true);
    try {
        const result = await analyzeVitals({ vitals });
        setAiReport(result);
    } catch (err) {
        alert("AI Service Unavailable. Check API Key.");
    }
    setAiLoading(false);
  };

  const toggleAI = () => {
      if (!aiEnabled) handleAIAnalysis();
      setAiEnabled(!aiEnabled);
  };

  // 4. Save to Cloud Handler
  const handleSave = async () => {
    // DEV MODE: Allow anonymous save for testing
    if (!auth.currentUser) {
        await signInAnonymously(auth).catch(console.error);
    }

    const success = await saveSession(vitals, aiReport);
    if (success) {
        setSaveStatus('SAVED');
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success buzz
    }
  };

  // 5. PDF Export Handler
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    try {
        const canvas = await html2canvas(reportRef.current, {
            backgroundColor: '#050505', // Match Void Black theme
            scale: 2 // High resolution
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Bioscan_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        console.error("PDF Export Failed", err);
        alert("Could not generate PDF.");
    }
  };

  if (!vitals) return null;

  return (
    <div className="container py-4 animate-fade-in-up">
      
      {/* --- HEADER --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button onClick={() => navigate('/')} className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-2">
            <ArrowLeft /> Exit
        </button>
        
        <div className="d-flex gap-2">
            {/* Error Message */}
            {saveError && <span className="text-danger small align-self-center d-none d-md-block">{saveError}</span>}
            
            {/* Export Button */}
            <button onClick={handleExportPDF} className="btn btn-sm btn-outline-info rounded-pill" title="Download PDF">
                <FileEarmarkPdf />
            </button>

            {/* Save Button */}
            <button 
                onClick={handleSave} 
                disabled={isSaving || saveStatus === 'SAVED'}
                className={`btn btn-sm rounded-pill d-flex align-items-center gap-2 ${saveStatus === 'SAVED' ? 'btn-success' : 'btn-primary'}`}
            >
                {isSaving ? <span className="spinner-border spinner-border-sm" /> : saveStatus === 'SAVED' ? <Share /> : <Download />}
                {saveStatus === 'SAVED' ? 'Saved' : 'Save'}
            </button>
        </div>
      </div>

      {/* --- PRINTABLE REPORT AREA --- */}
      <div ref={reportRef} className="glass-panel p-4 rounded-4 mb-4 position-relative overflow-hidden">
        
        {/* Watermark/Brand for PDF */}
        <div className="position-absolute top-0 start-50 translate-middle-x mt-2 opacity-50">
            <small className="text-muted letter-spacing-2">CONFIDENTIAL BIOSCAN REPORT</small>
        </div>

        {/* Big Metrics */}
        <div className="row align-items-center mt-3">
            <div className="col-6 border-end border-secondary text-center">
                <h1 className="display-1 fw-bold text-white mb-0 text-glow">
                    {vitals.bpm}
                </h1>
                <small className="text-primary fw-bold letter-spacing-1">AVG BPM</small>
            </div>
            <div className="col-6 text-center">
                <h2 className={`display-6 fw-bold mb-0 ${vitals.hrv < 30 ? 'text-danger' : 'text-success'}`}>
                    {vitals.hrv}<span className="fs-6 text-muted">ms</span>
                </h2>
                <small className="text-muted fw-bold letter-spacing-1">HRV (STRESS)</small>
            </div>
        </div>

        {/* The Waveform Visual */}
        <div className="mt-4" style={{height: '150px', opacity: 0.9}}>
            <Chart type='line' data={{
                labels: Array(60).fill(''),
                datasets: [{
                    label: 'Cleaned Signal',
                    data: generateWaveform(),
                    borderColor: '#7000FF',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: {
                        target: 'origin',
                        above: 'rgba(112, 0, 255, 0.1)' // Area glow
                    }
                }]
            }} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {x:{display:false}, y:{display:false}},
                plugins: {legend:{display:false}},
                animation: { duration: 1500, easing: 'easeOutQuart' }
            }} />
        </div>

        {/* AI Report Section (Embedded for PDF) */}
        {aiReport && (
            <div className="mt-4 pt-3 border-top border-secondary text-start">
                <div className="d-flex align-items-center gap-2 mb-2">
                    <Cpu className="text-warning" />
                    <span className="fw-bold text-white">AI ASSESSMENT</span>
                    <span className={`badge ms-auto ${aiReport.status === 'NORMAL' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {aiReport.status}
                    </span>
                </div>
                <p className="text-light fst-italic mb-3" style={{fontSize: '0.95rem'}}>
                    "{aiReport.summary}"
                </p>
                <div className="p-3 rounded-3" style={{background: 'rgba(0,0,0,0.3)'}}>
                    <strong className="text-primary small d-block mb-1">RECOMMENDATION:</strong>
                    <span className="text-muted small">{aiReport.recommendation}</span>
                </div>
            </div>
        )}
      </div>

      {/* --- INTERACTIVE CONTROLS (Not in PDF) --- */}
      
      {/* 1. Haptics Player */}
      <button 
        onClick={() => isPlaying ? stopHeartbeat() : playHeartbeat(vitals.bpm)}
        className={`btn w-100 py-3 mb-4 rounded-4 d-flex align-items-center justify-content-center gap-2 shadow-lg transition-all ${isPlaying ? 'btn-danger' : 'glass-panel text-white border-secondary'}`}
      >
        <HeartPulse size={20} className={isPlaying ? 'animate-pulse' : ''} />
        {isPlaying ? 'STOP PLAYBACK' : 'FEEL YOUR RHYTHM'}
      </button>

      {/* 2. AI Toggle */}
      {!aiReport && (
          <div className="glass-panel rounded-4 p-3 d-flex align-items-center justify-content-between cursor-pointer" onClick={toggleAI}>
            <div className="d-flex align-items-center gap-3">
                <div className="bg-dark p-2 rounded-circle">
                    <Cpu className="text-warning" size={20} />
                </div>
                <div>
                    <h6 className="mb-0 text-white">Unlock Insights</h6>
                    <small className="text-muted">Analyze variability with Gemini</small>
                </div>
            </div>
            
            {aiLoading ? (
                <div className="spinner-border text-primary spinner-border-sm" />
            ) : (
                <div className="form-check form-switch pointer-events-none">
                    <input className="form-check-input" type="checkbox" checked={aiEnabled} readOnly />
                </div>
            )}
          </div>
      )}

    </div>
  );
};