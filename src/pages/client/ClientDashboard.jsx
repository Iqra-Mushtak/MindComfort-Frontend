import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClientDashboard.css';
import logoImg from '../../assets/logo.png'; 
import NotificationBell from '../../components/NotificationBell';

const ClientDashboard = () => {
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
        <Link to="/client/profile" style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="mc-user-details">
              <h6>{user.username}</h6>
              <small>{user.role === 'mentor' ? 'Mentor' : 'Client'}</small>
            </div>
          </div>
        </Link>

        <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to="/client/dashboard" className="mc-nav-link active">
              <i className="bi bi-house-fill"></i> Home
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/client/plans" className="mc-nav-link">
              <i className="bi bi-bookmark-star-fill"></i> Subscription Plans
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/chatrooms" className="mc-nav-link">
              <i className="bi bi-chat-dots-fill"></i> Community Chat
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/client/podcasts" className="mc-nav-link">
              <i className="bi bi-broadcast-pin"></i> Podcasts
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/client/mentors" className="mc-nav-link">
              <i className="bi bi-person-heart"></i> Mentors
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
            
            <Link to="/client/dashboard" className="mc-main-logo">
              MindComfort
              <img src={logoImg} alt="MindComfort Logo" />
            </Link>
          </div>
        </div>

        <div className="mc-welcome-header">
          <h3>Welcome, {user.username}!</h3>
          <p>We're so glad to see you. What do you want to do today?</p>
        </div>

        <div className="mc-dashboard-grid">
          <Link to="/chatrooms" className="mc-dash-card">
            <div className="mc-card-visual visual-chat">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Chatrooms</h4>
              <p>Enter anonymous, topic-based rooms for peer support.</p>
            </div>
          </Link>

          <Link to="/client/plans" className="mc-dash-card">
            <div className="mc-card-visual visual-plans">
              <i className="bi bi-tag-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Subscription Plans</h4>
              <p>Subscribe to plans and unlock exclusive content.</p>
            </div>
          </Link>

          <Link to="/client/podcasts?tab=discover" className="mc-dash-card">
            <div className="mc-card-visual visual-live">
              <i className="bi bi-calendar-event-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Upcoming Podcasts</h4>
              <p>See the new scheduled live audio sessions by mentors.</p>
            </div>
          </Link>

          <Link to="/client/podcasts?tab=library&view=upcoming" className="mc-dash-card">
            <div className="mc-card-visual visual-recordings">
              <i className="bi bi-play-circle-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Purchased Podcasts</h4>
              <p>Access your live and recorded podcast library anytime.</p>
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

export default ClientDashboard;