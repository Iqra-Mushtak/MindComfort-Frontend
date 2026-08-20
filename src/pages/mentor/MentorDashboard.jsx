import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './MentorDashboard.css';
import logoImg from '../../assets/logo.png'; 
import NotificationBell from '../../components/NotificationBell';

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  if (!user) return null; 

  return (
    <div className="dashboard-container">
      {sidebarOpen && (
        <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
          <button className="mc-logout-btn" onClick={handleLogoutClick}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="mc-main-content">
        <div className="mc-main-header">
          <button 
            className="mc-sidebar-toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>

          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <NotificationBell />
            
            <Link to="/mentor/dashboard" className="mc-main-logo">
              MindComfort
              <img src={logoImg} alt="MindComfort Logo" />
            </Link>
          </div>
        </div>

        <div className="mc-welcome-header">
          <h3>Welcome, {user.username}!</h3>
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

      {showLogoutModal && (
        <div className="mc-modal-overlay">
          <div className="mc-logout-modal-card">
            <div className="mc-logout-modal-header">
              <h4>Confirm Logout</h4>
            </div>
            <p>Are you sure you want to logout from MindComfort?</p>
            <div className="mc-logout-modal-actions">
              <button className="btn-cancel-logout" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="btn-confirm-logout" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;