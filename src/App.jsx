import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage'; 
import About from './pages/public/About';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import VerifyOTP from './pages/public/VerifyOTP';
import MentorApplication from './pages/public/MentorApplication';
import ForgotPassword from './pages/public/ForgotPassword';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/mentor-application" element={<MentorApplication />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

export default App;