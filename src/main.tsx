/**
 * @file main.tsx
 * @description Entry point. Registers Chart.js GLOBALLY to prevent "Unregistered Scale" crashes.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/main.scss'; 

// --- CRITICAL FIX: Global Chart.js Registration ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Added Filler just in case you want area charts later
} from 'chart.js';

// Register them once, globally.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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