import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './ModeratorDashboard.css';
import logoImg from '../../assets/logo.png';
import NotificationBell from '../../components/NotificationBell';

import ReportsManagement from '../admin/sections/ReportsManagement';
import AdminProfile from '../admin/sections/AdminProfile';
import LiveChatFeed from '../admin/sections/LiveChatFeed';
import LivePodcast from '../admin/sections/LivePodcast';
import ModeratorPodcastsDetail from './sections/ModeratorPodcastsDetail';

const ModeratorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [liveStreams, setLiveStreams] = useState([]);
  
  const [stats, setStats] = useState({
    pendingReports: 0,
    chatroomsCount: 0,
    podcastsCount: 0,
    quickView: { reports: [] }
  });

  const fetchModeratorStats = async () => {
    try {
      const res = await api.get('/moderator/insights');
      const data = res.data.insights;

      setStats({
        pendingReports: data.moderation?.pendingReports || 0,
        chatroomsCount: data.chat?.activeChatrooms || 0,
        podcastsCount: data.podcasts?.totalPodcasts || 0,
        quickView: data.quickView || { reports: [] }
      });
      
      fetchLiveStreams();
    } catch (err) {
      console.error('Failed to fetch moderator stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStreams = async () => {
    try {
      const res = await api.get('/moderator/podcasts?status=live');
      setLiveStreams(res.data.podcasts || []);
    } catch (err) {
      console.error('Failed to fetch live streams:', err);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'moderator') {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchModeratorStats();
  }, [navigate]);

  useEffect(() => {
    window.onNavigateToReports = () => setActiveSection('reports');
    
    return () => {
      delete window.onNavigateToReports;
    };
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    setIsSidebarOpen(false); 
  };

  if (loading) {
    return <div className="mod-loading-container">Loading...</div>;
  }

  return (
    <div className="mod-dashboard-container">
      {isSidebarOpen && (
        <div 
          className="mc-sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`mod-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div 
          className="mod-user-info-top clickable-profile"
          onClick={() => handleNavClick('profile')}
          title="View My Profile"
        >
          <div className="mod-user-avatar">
            {user?.username?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <div className="mod-user-details">
            <h6>{user?.username || 'Moderator'}</h6>
            <small>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Moderator'}</small>
          </div>
        </div>

        <nav className="mod-nav-menu">
          <button
            className={`mod-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <i className="bi bi-speedometer2"></i> Home
          </button>

          <button
            className={`mod-nav-item ${activeSection === 'podcasts' ? 'active' : ''}`}
            onClick={() => handleNavClick('podcasts')}
          >
            <i className="bi bi-broadcast"></i> Podcasts
          </button>

          <button
            className={`mod-nav-item ${activeSection === 'live-chat' ? 'active' : ''}`}
            onClick={() => handleNavClick('live-chat')}
          >
            <i className="bi bi-chat-left-dots"></i> Live Chat Feed
          </button>

          <button
            className={`mod-nav-item ${activeSection === 'live-podcast' ? 'active' : ''}`}
            onClick={() => handleNavClick('live-podcast')}
          >
            <i className="bi bi-broadcast"></i> Live Podcasts
          </button>

          <button
            className={`mod-nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
          >
            <i className="bi bi-flag"></i> Reports
            {stats.pendingReports > 0 && (
              <span className="mod-badge-danger">{stats.pendingReports}</span>
            )}
          </button>
        </nav>

        <div className="mod-sidebar-footer">
          <button className="mod-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </div>

      <div className="mod-main-content">
        <div className="mod-navbar">
          <button 
            className="mc-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Menu"
          >
            <i className="bi bi-list"></i>
          </button>

          <div style={{ flex: 1 }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {liveStreams.length > 0 && (
              <button 
                className="mod-live-btn"
                onClick={() => handleNavClick('live-podcast')}
              >
                <span className="mod-live-dot"></span>
                LIVE ({liveStreams.length})
              </button>
            )}
            
            <NotificationBell />

            <Link to="/moderator/dashboard" className="mod-logo-text">
              MindComfort <img src={logoImg} alt="Logo" />
            </Link>
          </div>
        </div>

        <div className="mod-content-wrapper">
          {activeSection === 'dashboard' && (
            <div className="mod-dashboard-section">
              <h2 className="mod-section-title">Moderation Dashboard</h2>
              
              <div className="mod-cards-grid">
                <div className="mod-main-card mod-card-chatroom">
                  <div className="mod-card-header-main">
                    <i className="bi bi-chat-dots"></i>
                    <h3>Chatrooms</h3>
                  </div>
                  <button 
                    className="mod-card-action-btn"
                    onClick={() => handleNavClick('live-chat')}
                  >
                    View Chatrooms
                  </button>
                </div>

                <div className="mod-main-card mod-card-podcast">
                  <div className="mod-card-header-main">
                    <i className="bi bi-broadcast"></i>
                    <h3>Podcasts</h3>
                  </div>
                  <button 
                    className="mod-card-action-btn"
                    onClick={() => handleNavClick('podcasts')}
                  >
                    View Podcasts
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'podcasts' && <ModeratorPodcastsDetail />}

          {activeSection === 'live-chat' && <LiveChatFeed />}

          {activeSection === 'live-podcast' && <LivePodcast />}

          {activeSection === 'reports' && <ReportsManagement isModerator={true} />}

          {activeSection === 'profile' && <AdminProfile user={user} />}
        </div>
      </div>

      {showLogoutModal && (
        <div className="mod-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="mod-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="mod-modal-buttons">
              <button className="mod-btn-cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="mod-btn-danger" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboard;