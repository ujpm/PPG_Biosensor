import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HUDLayout } from './components/layout/HUDLayout';
import { LandingPage } from './pages/LandingPage';
import { ScanMissionPage } from './pages/ScanMission';
function App() {
  return (
    <BrowserRouter>
      <HUDLayout>
        <Routes>
          {/* The Home Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* The Scanner (The "Wizard") */}
<Route path="/scan" element={<ScanMissionPage />} />
          
          {/* Future Routes */}
          {/* <Route path="/results" element={<Debrief />} /> */}
          {/* <Route path="/profile" element={<BioProfile />} /> */}
        </Routes>
      </HUDLayout>
    </BrowserRouter>
  );
}

export default App;