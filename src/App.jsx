import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage'; 
import About from './pages/public/About';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App;