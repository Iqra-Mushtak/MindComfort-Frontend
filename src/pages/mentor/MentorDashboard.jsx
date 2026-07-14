import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './MentorDashboard.css';
import logoImg from '../../assets/logo.png'; 

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData) {
      navigate('/login');
    } else {
      if (userData.role !== 'mentor') {
        navigate('/client/dashboard');
        return;
      }
      setUser(userData);
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      if (window.confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) return null; 

  return (
    <div className="dashboard-container">
      <aside className="mc-sidebar">
        <Link to="/mentor/profile" style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="mc-user-details">
              <h6>{user.username}</h6>
              <small>Mentor</small>
            </div>
          </div>
        </Link>

        <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to="/mentor/dashboard" className="mc-nav-link active">
              <i className="bi bi-house-fill"></i> Home
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/chatrooms" className="mc-nav-link">
              <i className="bi bi-chat-dots-fill"></i> Community Chat
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/mentor/podcasts" className="mc-nav-link">
              <i className="bi bi-broadcast-pin"></i> Podcasts
            </Link>
          </li>
        </ul>

        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="mc-main-content">
        
        <div className="mc-main-header">
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            <button className="mc-notification-btn">
              <i className="bi bi-bell-fill"></i>
              <span className="mc-badge">3</span>
            </button>
            
            <Link to="/mentor/dashboard" className="mc-main-logo">
              MindComfort
              <img src={logoImg} alt="MindComfort Logo" />
            </Link>
          </div>
        </div>

        <div className="mc-welcome-header" >
            <h3>Welcome, {user.username}!</h3>
            {/* <p>We're so glad to see you. What do you want to do today?</p>  */}
        </div>

        <div className="mc-dashboard-grid">
          <Link to="/chatrooms" className="mc-dash-card">
            <div className="mc-card-visual visual-chat">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Chatrooms</h4>
              <p>Join discussions and support your community members.</p>
            </div>
          </Link>

          <Link to="/mentor/profile" className="mc-dash-card">
            <div className="mc-card-visual visual-plans">
              <i className="bi bi-person-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>My Profile</h4>
              <p>Update your profile and availability settings.</p>
            </div>
          </Link>

          <Link to="/mentor/create-podcast" className="mc-dash-card">
            <div className="mc-card-visual visual-live">
              <i className="bi bi-mic-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Create Podcast</h4>
              <p>Create and schedule new upcoming podcasts.</p>
            </div>
          </Link>

          <Link to="/mentor/my-podcasts" className="mc-dash-card">
            <div className="mc-card-visual visual-recordings">
              <i className="bi bi-play-circle-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>My Podcasts</h4>
              <p>Manage your recorded podcast episodes.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default MentorDashboard;