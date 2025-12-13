import { BiosensorView } from './components/BiosensorView';

function App() {
  return (
    // min-vh-100 ensures the dark background covers the full mobile screen
    <div className="min-vh-100 bg-dark">
      <BiosensorView />
    </div>
  );
}

export default App;