import { Chart } from 'react-chartjs-2';
import { ArrowLeft, BoxArrowRight, Calendar3 } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useHistory } from '../hooks/useHistory';

export const BioProfile = () => {
  const navigate = useNavigate();
  const { history, loading } = useHistory();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Prepare Chart Data (Reverse array so graph goes Left->Right in time)
  const chartData = {
    labels: [...history].reverse().map(h => h.dateStr),
    datasets: [
      {
        label: 'Heart Rate Variability (ms)',
        data: [...history].reverse().map(h => h.hrv),
        borderColor: '#00F0FF', // Cyan
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  return (
    <div className="container py-4 animate-fade-in-up">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button onClick={() => navigate('/')} className="btn btn-sm btn-outline-secondary rounded-pill">
            <ArrowLeft /> Home
        </button>
        <button onClick={handleLogout} className="btn btn-sm btn-outline-danger rounded-pill">
            Logout <BoxArrowRight />
        </button>
      </div>

      <div className="text-center mb-4">
        <div className="d-inline-block p-1 rounded-circle border border-primary mb-2">
            <img 
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${auth.currentUser?.uid}`} 
              alt="Avatar" 
              className="rounded-circle bg-dark"
              width="64" 
              height="64"
            />
        </div>
        <h4 className="fw-bold text-white mb-0">{auth.currentUser?.email || 'Anonymous User'}</h4>
        <small className="text-muted">Bio-Metric Vault</small>
      </div>

      {/* TREND CHART */}
      <div className="glass-panel p-3 rounded-4 mb-4">
        <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
            <Calendar3 /> HRV TRENDS (STRESS)
        </h6>
        <div style={{height: '200px'}}>
            {loading ? (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                    Loading Data...
                </div>
            ) : history.length > 1 ? (
                <Chart type='line' data={chartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { display: false },
                        y: { grid: { color: 'rgba(255,255,255,0.1)' } }
                    },
                    plugins: { legend: { display: false } }
                }} />
            ) : (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                    Not enough data. Take more scans!
                </div>
            )}
        </div>
      </div>

      {/* HISTORY LIST */}
      <div className="glass-panel rounded-4 overflow-hidden">
        <div className="p-3 border-bottom border-secondary bg-dark">
            <h6 className="mb-0 fw-bold text-white">RECENT SCANS</h6>
        </div>
        <div className="list-group list-group-flush">
            {history.map(item => (
                <div key={item.id} className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center py-3">
                    <div>
                        <div className="fw-bold fs-5">{item.bpm} <span className="text-muted fs-6">BPM</span></div>
                        <small className="text-muted">{item.dateStr}</small>
                    </div>
                    <div className="text-end">
                        <div className={`badge ${item.hrv < 30 ? 'bg-danger' : 'bg-success'}`}>
                            HRV: {item.hrv}ms
                        </div>
                        <div className="small text-primary mt-1">{item.aiStatus}</div>
                    </div>
                </div>
            ))}
            {history.length === 0 && !loading && (
                <div className="p-4 text-center text-muted">No records found.</div>
            )}
        </div>
      </div>

    </div>
  );
};