import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'react-bootstrap-icons';

export const Footer = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <footer className="fixed-bottom glass-panel py-2 px-3 mt-auto">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        
        {/* Left: Copyright / Brand */}
        <small className="text-muted" style={{fontSize: '0.7rem'}}>
          © 2025 PPG Bio
        </small>

        {/* Right: Connectivity Status */}
        <div className="d-flex align-items-center">
          {isOnline ? (
            <div className="text-success d-flex align-items-center gap-1">
              <Wifi size={14} />
              <span style={{fontSize: '0.7rem', fontWeight: 'bold'}}>ONLINE</span>
            </div>
          ) : (
            <div className="text-danger d-flex align-items-center gap-1 animate-pulse">
              <WifiOff size={14} />
              <span style={{fontSize: '0.7rem', fontWeight: 'bold'}}>OFFLINE (Local Mode)</span>
            </div>
          )}
        </div>

      </div>
    </footer>
  );
};