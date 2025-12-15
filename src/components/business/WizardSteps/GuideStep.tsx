export const GuideStep = ({ onStart }: { onStart: () => void }) => (
  <div className="text-center animate-fade-in">
    <div className="mb-4">
      <div className="pulse-orb mx-auto mb-3" style={{width: '120px', height: '120px', background: 'rgba(0,240,255,0.1)'}}>
        <span style={{fontSize: '3rem'}}>👆</span>
      </div>
    </div>
    <h2 className="fw-bold mb-3 text-glow">Setup Protocol</h2>
    <ul className="list-unstyled text-muted mb-4" style={{lineHeight: '2rem'}}>
      <li>1. Sit comfortably & relax.</li>
      <li>2. Cover the <b>Camera & Flash</b>.</li>
      <li>3. Hold steady until the Orb fills.</li>
    </ul>
    <button onClick={onStart} className="btn btn-lg btn-primary rounded-pill px-5 shadow-lg">
      ACTIVATE SENSOR
    </button>
  </div>
);