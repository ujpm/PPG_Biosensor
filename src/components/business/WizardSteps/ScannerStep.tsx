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
    if (quality === 'NO_FINGER') return '#555'; 
    if (quality === 'NOISY') return '#FF003C'; 
    return '#00F0FF'; 
  };

  const getMessage = () => {
    if (quality === 'NO_FINGER') return 'Place Finger on Camera';
    if (quality === 'NOISY') return 'Hold Still...';
    return 'Acquiring Signal...';
  };

  // Safe Chart Options to prevent "Canvas already in use" errors during rapid updates
  const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const, // CRITICAL: Disable animation for performance
      scales: {
          x: { display: false }, // "category" scale is hidden but used
          y: { display: false }
      },
      plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
      },
      elements: {
          point: { radius: 0 } // Performance optimization
      }
  };

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 position-relative" style={{ width: 220, height: 220 }}>
        <CircularProgressbar
          value={progress}
          styles={buildStyles({
            pathColor: getColor(),
            trailColor: 'rgba(255,255,255,0.1)',
            pathTransitionDuration: 0.2
          })}
        />
        
        <div className="position-absolute top-50 start-50 translate-middle" style={{width: '160px', height: '80px'}}>
           {quality === 'GOOD' ? (
             <div style={{width: '100%', height: '100%', opacity: 0.8}}>
                <Chart 
                    type='line' 
                    data={{
                        labels: Array(60).fill(''), // X-Axis labels
                        datasets: [{ 
                            data: chartData, 
                            borderColor: getColor(), 
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 0
                        }]
                    }} 
                    options={chartOptions} 
                />
             </div>
           ) : (
             <h1 className="display-4 text-muted">⚠️</h1>
           )}
        </div>
      </div>

      <h4 className="fw-bold mb-2" style={{color: getColor()}}>
        {getMessage()}
      </h4>
      <p className="text-muted small">Keep flash covered. Do not press hard.</p>
    </div>
  );
};