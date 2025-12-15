import React from 'react';
import { Footer } from './Footer';
import { Navbar } from './Navbar'; // Import the new separate file
import { useLocation } from 'react-router-dom';

export const HUDLayout = ({ children }: { children: React.ReactNode }) => {
  // ... (Keep existing device check logic if you want) ...
  const location = useLocation();
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