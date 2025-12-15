import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HUDLayout } from './components/layout/HUDLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ScanMissionPage } from './pages/ScanMission';
import { Debrief } from './pages/Debrief';
import { BioProfile } from './pages/BioProfile'; // <--- NEW
import { AuthPage } from './pages/Auth';         // <--- NEW

function App() {
  return (
    <BrowserRouter>
      <HUDLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/scan" element={<ScanMissionPage />} />
          <Route path="/debrief" element={<Debrief />} />
          <Route path="/profile" element={<BioProfile />} />
        </Routes>
      </HUDLayout>
    </BrowserRouter>
  );
}

export default App;