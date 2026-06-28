import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';

function App() {
  return (
    
    <Router>
      <Routes>
        {/* <h1>mindComfort is online</h1> */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        {/* <Route path="/auth" element={<Auth />} />
        <Route path="/mentor-application" element={<h1>Mentor Application Form</h1>} />
        <Route path="/dashboard" element={<h1>Dashboard</h1>} /> */}
        <Route path="/dashboard" element={<clientLandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;