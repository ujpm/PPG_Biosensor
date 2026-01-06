/**
 * @file main.tsx
 * @description Entry point. 
 * CRITICAL FIX: Registers Chart.js components globally to prevent 
 * "Unregistered Scale" errors in Vercel/Production builds.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/main.scss'; 

// --- CRITICAL: PREVENT VERCEL CRASH ---
// We must register these components manually so Tree-Shaking doesn't remove them.
import {
  Chart as ChartJS,
  CategoryScale, // <--- The culprit causing the crash
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register them once, globally.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)