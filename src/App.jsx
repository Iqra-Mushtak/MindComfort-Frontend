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
import Profile from './pages/shared/Profile';
import EditProfile from './pages/shared/EditProfile';
import MentorMyPodcasts from './pages/mentor/podcast/MentorMyPodcasts';
import CreatePodcast from './pages/mentor/podcast/CreatePodcast';
import ClientPodcast from './pages/client/ClientPodcast';
import PlansList from './pages/client/PlansList';
import PaymentSuccess from './pages/client/PaymentSuccess';
import MentorLiveDashboard from './pages/mentor/podcast/MentorLiveDashboard';
import ClientLivePlayer from './pages/client/ClientLivePlayer';
import GlobalLiveBadge from './components/GlobalLiveBadge';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/mentor-application" element={<MentorApplication />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/client/dashboard" element={<ClientDashboard />} />
      <Route path="/client/plans" element={<PlansList />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/chatrooms" element={<ChatroomList />} /> 
      <Route path="/chatroom/:id" element={<ChatInterface />} />
      <Route path="/mentor/dashboard" element={<MentorDashboard />} />
      <Route path="/client/profile" element={<Profile />} />
      <Route path="/mentor/profile" element={<Profile />} />
      <Route path="/client/profile/edit" element={<EditProfile />} />
      <Route path="/mentor/profile/edit" element={<EditProfile />} />
      <Route path="/mentor/my-podcasts" element={<MentorMyPodcasts />} />
      <Route path="/mentor/podcasts" element={<MentorMyPodcasts />} />
      <Route path="/mentor/create-podcast" element={<CreatePodcast />} />    
      <Route path="/client/podcasts" element={<ClientPodcast />} />
      <Route path="/client/upcoming-podcasts" element={<ClientPodcast />} />
      <Route path="/client/my-podcasts" element={<ClientPodcast />} />
      <Route path="/mentor/podcast/:id/live" element={<MentorLiveDashboard />} />
      <Route path="/client/podcast/:id/live" element={<ClientLivePlayer />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
          <GlobalLiveBadge />
    </>
  );
}

export default App;