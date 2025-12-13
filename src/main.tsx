import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// Import Bootstrap CSS (Make sure you ran: npm install bootstrap)
import 'bootstrap/dist/css/bootstrap.min.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)