import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage'; 
import About from './pages/public/About';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import VerifyOTP from './pages/public/VerifyOTP';
import MentorApplication from './pages/public/MentorApplication';
import ForgotPassword from './pages/public/ForgotPassword';
import ClientDashboard from './pages/client/ClientDashboard';
import ChatroomList from './pages/shared/ChatroomList';
import ChatInterface from './pages/shared/ChatInterface';
import MentorDashboard from './pages/mentor/MentorDashboard';

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
      <Route path="/client/dashboard" element={<ClientDashboard />} />
      <Route path="/chatrooms" element={<ChatroomList />} /> 
      <Route path="/chatrooms" element={<ChatroomList />} /> 
      <Route path="/chatroom/:id" element={<ChatInterface />} />
      <Route path="/mentor/dashboard" element={<MentorDashboard />} />

    </Routes>
  );
}

export default App;