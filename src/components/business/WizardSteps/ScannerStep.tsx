import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Chart } from 'react-chartjs-2';
import type { SignalQuality } from '../../../hooks/useScanner';

interface Props {
  progress: number;
  quality: SignalQuality;
  chartData: number[];
}

export const ScannerStep = ({ progress, quality, chartData }: Props) => {
  
  const getColor = () => {
    if (quality === 'NO_FINGER') return '#555'; // Grey
    if (quality === 'NOISY') return '#FF003C'; // Red
    return '#00F0FF'; // Cyan (Good)
  };

  const getMessage = () => {
    if (quality === 'NO_FINGER') return 'Place Finger on Camera';
    if (quality === 'NOISY') return 'Hold Still...';
    return 'Acquiring Signal...';
  };

  // 1. Orb Graph (Minimalist)
  const orbOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    scales: {x:{display:false}, y:{display:false}}, 
    plugins: {legend:{display:false}, tooltip:{enabled:false}},
    animation: false as const,
    elements: { point: { radius: 0 } }
  };

  // 2. Debug Graph (Detailed Telemetry)
  const debugOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
        legend: { display: false },
        title: { display: true, text: 'RAW SENSOR FEED', color: '#6c757d', font: { size: 10 } }
    },
    scales: {
        x: { display: false },
        y: { 
            display: true,
            position: 'right' as const,
            ticks: { 
                color: '#6c757d', 
                font: { size: 9 },
                precision: 1 // Show decimal changes
            },
            grid: { color: 'rgba(255,255,255,0.05)' }
        }
    },
    elements: {
        line: { borderWidth: 1, borderColor: '#0d6efd' },
        point: { radius: 0 }
    }
  };

  // Get current raw value for display
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1] : 0;

  return (
    <div className="text-center w-100">
      {/* --- THE ORB (Status Indicator) --- */}
      <div className="mx-auto mb-3 position-relative" style={{ width: 220, height: 220 }}>
        <CircularProgressbar
          value={progress}
          styles={buildStyles({
            pathColor: getColor(),
            trailColor: 'rgba(255,255,255,0.1)',
            pathTransitionDuration: 0.2
          })}
        />
        
        {/* Inner Content (Orb Graph) */}
        <div className="position-absolute top-50 start-50 translate-middle" style={{width: '160px', height: '80px'}}>
           {quality === 'GOOD' ? (
             <div style={{width: '100%', height: '100%', opacity: 0.8}}>
                <Chart 
                    type='line' 
                    data={{
                        labels: Array(60).fill(''),
                        datasets: [{ 
                            data: chartData, 
                            borderColor: getColor(), 
                            tension: 0.4 
                        }]
                    }} 
                    options={orbOptions} 
                />
             </div>
           ) : (
             <h1 className="display-4 text-muted">⚠️</h1>
           )}
        </div>
      </div>

      {/* Status Text */}
      <h4 className="fw-bold mb-1" style={{color: getColor()}}>
        {getMessage()}
      </h4>
      <p className="text-muted small mb-4">Keep flash covered. Do not press hard.</p>

      {/* --- LIVE TELEMETRY SECTION (Debug) --- */}
      <div className="card bg-dark border-secondary bg-opacity-50">
          <div className="card-body p-2">
            <div style={{ height: '100px', width: '100%' }}>
                <Chart 
                    type='line' 
                    data={{
                        labels: Array(chartData.length).fill(''),
                        datasets: [{
                            data: chartData,
                            borderColor: '#0d6efd',
                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                            fill: true,
                            tension: 0.1
                        }]
                    }} 
                    options={debugOptions} 
                />
            </div>
            <div className="d-flex justify-content-between align-items-center mt-1 px-2">
                 <span className="badge bg-secondary" style={{fontSize: '0.6rem'}}>BUFFER: {chartData.length}</span>
                 <span className="font-monospace text-info small">VAL: {currentValue.toFixed(2)}</span>
            </div>
          </div>
      </div>
    </div>
  );
};