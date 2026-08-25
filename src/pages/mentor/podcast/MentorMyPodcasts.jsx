import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MentorPodcastItem from './MentorPodcastItem';
import PodcastSummaryModal from './PodcastSummaryModal';
import api from '../../../utils/api';
import './MentorMyPodcasts.css';
import logoImg from '../../../assets/logo.png';
import NotificationBell from '../../../components/NotificationBell';

const MentorMyPodcasts = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [podcasts, setPodcasts] = useState({
    pending: [],
    upcoming: [],
    past: []
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    document.title = "My Podcasts | MindComfort";
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'mentor') {
      navigate('/login');
    } else {
      setUser(userData);
    }
    
    fetchPodcasts();
  }, [navigate]);

  const fetchPodcasts = async () => {
    try {
      const response = await api.get('/podcasts/mentor/my');
      setPodcasts({
        pending: response.data.pending || [],
        upcoming: response.data.upcoming || [],
        past: response.data.past || []
      });
    } catch (error) {
      console.error('Failed to fetch podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const renderSection = (sectionTitle, sectionKey, items) => {
    const count = items.length;
    const now = new Date();

    return (
      <div className="mb-5">
        <h4>{sectionTitle}</h4>
        {count > 0 ? (
          <p className="section-count">{count} {sectionKey} podcast{count !== 1 ? 's' : ''}</p>
        ) : (
          <p className="section-count">No {sectionKey} podcasts available</p>
        )}
        {count > 0 && (
          <div>
            {items.map((item) => {
              const startTime = new Date(item.startTime || item.date);
              const isLiveTime = now >= new Date(startTime.getTime() - 5 * 60000); 
              
              return (
                <div key={item._id || item.id} className="podcast-item-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1 }} onClick={() => setSelectedPodcast(item)}>
                    <MentorPodcastItem 
                      {...item} 
                      onClick={() => setSelectedPodcast(item)}
                    />
                  </div>
                  
                  {sectionKey === 'upcoming' && isLiveTime && item.status === 'upcoming' && (
                    <button 
                      className="btn-go-live"
                      onClick={() => navigate(`/mentor/podcast/${item._id}/live`)}
                      style={{
                        background: '#dc3545', color: 'white', border: 'none', 
                        padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <i className="bi bi-broadcast"></i> Go Live
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="mentor-podcasts-container">
      {sidebarOpen && (
        <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/mentor/profile" style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
            <div className="mc-user-details">
              <h6>{user.username}</h6>
              <small>Mentor</small>
            </div>
          </div>
        </Link>
        <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to="/mentor/dashboard" className="mc-nav-link"><i className="bi bi-house-fill"></i> Home</Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/chatrooms" className="mc-nav-link"><i className="bi bi-chat-dots-fill"></i> Community Chat</Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/mentor/podcasts" className="mc-nav-link active"><i className="bi bi-broadcast-pin"></i> Podcasts</Link>
          </li>
        </ul>
        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogoutClick}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mentor-podcasts-main">
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
            <Link to="/mentor/dashboard" className="mc-main-logo">MindComfort <img src={logoImg} alt="Logo" /></Link>
          </div>
        </div>

        <div className="mentor-podcasts-header">
          <h2>My Podcasts</h2>
          <button className="create-podcast-btn" onClick={() => navigate('/mentor/create-podcast')}>
            <i className="bi bi-plus-circle"></i> Create Podcast
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">Loading...</div>
        ) : (
          <>
            {renderSection('Pending Approvals', 'pending', podcasts.pending)}
            {renderSection('Upcoming Podcasts', 'upcoming', podcasts.upcoming)}
            {renderSection('Past Podcasts', 'past', podcasts.past)}
          </>
        )}

        {selectedPodcast && (
          <PodcastSummaryModal 
            podcast={selectedPodcast} 
            onClose={() => setSelectedPodcast(null)} 
          />
        )}
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

export default MentorMyPodcasts;