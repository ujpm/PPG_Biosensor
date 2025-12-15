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
  
  // Dynamic Color based on Quality
  const getColor = () => {
    if (quality === 'NO_FINGER') return '#555'; // Grey
    if (quality === 'NOISY') return '#FF003C'; // Plasma Red
    return '#00F0FF'; // Cyan Glitch (Good)
  };

  const getMessage = () => {
    if (quality === 'NO_FINGER') return 'Place Finger on Camera';
    if (quality === 'NOISY') return 'Hold Still...';
    return 'Acquiring Signal...';
  };

  return (
    <div className="text-center">
      {/* THE ORB (Progress Ring) */}
      <div className="mx-auto mb-4 position-relative" style={{ width: 220, height: 220 }}>
        <CircularProgressbar
          value={progress}
          styles={buildStyles({
            pathColor: getColor(),
            trailColor: 'rgba(255,255,255,0.1)',
            pathTransitionDuration: 0.2
          })}
        />
        
        {/* Inner Content (Live Graph) */}
        <div className="position-absolute top-50 start-50 translate-middle" style={{width: '160px'}}>
           {quality === 'GOOD' ? (
             <div style={{height: '80px', opacity: 0.8}}>
                <Chart type='line' data={{
                    labels: Array(60).fill(''),
                    datasets: [{ 
                        data: chartData, 
                        borderColor: getColor(), 
                        tension: 0.4, 
                        pointRadius: 0 
                    }]
                }} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    scales: {x:{display:false}, y:{display:false}}, 
                    plugins: {legend:{display:false}},
                    animation: false
                }} />
             </div>
           ) : (
             <h1 className="display-4">⚠️</h1>
           )}
        </div>
      </div>

      {/* Status Text */}
      <h4 className="fw-bold mb-2" style={{color: getColor()}}>
        {getMessage()}
      </h4>
      <p className="text-muted small">Keep flash covered. Do not press hard.</p>
    </div>
  );
};