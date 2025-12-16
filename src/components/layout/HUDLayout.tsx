import React from 'react';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { useLocation } from 'react-router-dom';

export const HUDLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Only hide Navbar on the specific scanning page to focus attention
  const isScanPage = location.pathname === '/scan';

  return (
    <div className="app-container">
      {!isScanPage && <Navbar />}
      
      <main className="main-content">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};