import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClientDashboard.css';
import logoImg from '../../assets/logo.png'; 

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData) {
      navigate('/login');
    } else {
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
  
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="mc-sidebar">
        <Link to="/" className="mc-sidebar-logo">
          <img src={logoImg} alt="MindComfort Logo" className="mc-logo-img" style={{ height: '35px' }} />
          MindComfort
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
            <Link to="/client/chatrooms" className="mc-nav-link">
              <i className="bi bi-chat-dots-fill"></i> Community Chat
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/client/podcasts" className="mc-nav-link">
              <i className="bi bi-broadcast-pin"></i> Podcasts
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/client/profile" className="mc-nav-link">
              <i className="bi bi-person-fill"></i> Profile
            </Link>
          </li>
        </ul>

        <div className="mc-sidebar-footer">
          <div className="mc-user-info">
            <div className="mc-user-avatar">
              {getInitials(user.username)}
            </div>
            <div className="mc-user-details">
              <h6>{user.username}</h6>
              <small>{user.email || 'Client'}</small>
            </div>
          </div>
          <button className="mc-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </aside>

            {/* Main Content */}
      <main className="mc-main-content">
        
        <div className="mc-header-row">
          <div className="mc-welcome-header">
            <h1>Welcome, {user.username}!</h1>
            <p>We're so glad to see you. What would you like to do today?</p>
          </div>
          
          <div className="mc-top-bar">
            <button className="mc-notification-btn">
              <i className="bi bi-bell-fill"></i>
              <span className="mc-badge">3</span>
            </button>
          </div>
        </div>

        <div className="mc-dashboard-grid">
          {/* Card 1: Chatrooms */}
          <Link to="/client/chatrooms" className="mc-dash-card">
            <div className="mc-card-visual visual-chat">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Chatrooms</h4>
              <p>Enter anonymous, topic-based rooms for peer support.</p>
            </div>
          </Link>

          {/* Card 2: Subscription Plans */}
          <Link to="/client/plans" className="mc-dash-card">
            <div className="mc-card-visual visual-plans">
              <i className="bi bi-tag-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Subscription Plans</h4>
              <p>Subscribe to plans and unlock exclusive content.</p>
            </div>
          </Link>

          {/* Card 3: Upcoming Podcasts */}
          <Link to="/client/upcoming-podcasts" className="mc-dash-card">
            <div className="mc-card-visual visual-live">
              <i className="bi bi-calendar-event-fill"></i>
            </div>
            <div className="mc-card-body">
              <h4>Upcoming Podcasts</h4>
              <p>See the new scheduled live audio sessions by mentors.</p>
            </div>
          </Link>

          {/* Card 4: Purchased Podcasts */}
          <Link to="/client/my-podcasts" className="mc-dash-card">
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
    </div>
  );
};

export default ClientDashboard;