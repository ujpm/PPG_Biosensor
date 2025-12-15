import React from 'react';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';

const Navbar = () => (
  <nav className="navbar navbar-dark glass-panel sticky-top" style={{zIndex: 1030}}>
    <div className="container-fluid d-flex justify-content-between align-items-center">
      <span className="navbar-brand mb-0 h1 fw-bold text-glow d-flex align-items-center gap-2">
        {/* LOGO PLACEHOLDER: Put your SVG in src/assets/branding/logo.svg */}
        {/* <img src="/assets/branding/logo.svg" height="30" alt="Logo"/> */}
        ❤️ Pulse<span className="text-primary">Orb</span>
      </span>
      
      {/* Login Status (Placeholder) */}
      <small className="text-muted">Guest</small>
    </div>
  </nav>
);

export const HUDLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isScanPage = location.pathname === '/scan';

  return (
    <div className="app-container">
      {/* Hide Navbar during active scanning to reduce distractions */}
      {!isScanPage && <Navbar />}
      
      <main className="main-content">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};