import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import './ClientPodcast.css';
import logoImg from '../../assets/logo.png';
import PurchaseModal from './PurchaseModal';

const ClientPodcasts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('discover'); 
  const [libraryView, setLibraryView] = useState('upcoming'); 
  const [upcomingPodcasts, setUpcomingPodcasts] = useState([]);
  const [library, setLibrary] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!token || !userData) { 
      navigate('/login'); 
      return; 
    }
    setUser(userData);
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const viewParam = params.get('view');

    if (location.pathname === '/client/my-podcasts') {
      setActiveTab('library');
      setLibraryView('upcoming');
      return;
    }

    if (location.pathname === '/client/upcoming-podcasts') {
      setActiveTab('discover');
      return;
    }

    if (tabParam === 'discover' || tabParam === 'library') {
      setActiveTab(tabParam);
    }

    if (viewParam === 'upcoming' || viewParam === 'recordings') {
      setLibraryView(viewParam);
    }
  }, [location.pathname, location.search]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setLoadError(false);
    try {
      const [upcomingRes, libraryRes] = await Promise.all([
        api.get('/podcasts/client/upcoming'),
        api.get('/podcasts/client/my-library')
      ]);
      setUpcomingPodcasts(upcomingRes.data.data || []);
      setLibrary(libraryRes.data);
    } catch (err) {
      setLoadError(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (podcast) => {
    setSelectedPodcast(podcast);
    setPurchaseError('');
    setIsPurchaseModalOpen(true);
  };

  const handleConfirmPurchase = async () => {
      if (!selectedPodcast) return;
      setIsPurchasing(true);
      setPurchaseError('');
      try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/subscriptions/podcast/${selectedPodcast._id}`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to create purchase');
          }
          const data = await response.json();
          
          // Build and auto-submit PayFast form
          if (data.payfastData && data.payfastUrl) {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = data.payfastUrl;
              
              Object.keys(data.payfastData).forEach(key => {
                  const input = document.createElement('input');
                  input.type = 'hidden';
                  input.name = key;
                  input.value = data.payfastData[key];
                  form.appendChild(input);
              });
              
              document.body.appendChild(form);
              form.submit();
          } else {
              throw new Error('No PayFast payment data received');
          }
      } catch (err) {
          console.error('Purchase error:', err);
          setPurchaseError(err.message || 'Failed to process purchase. Please try again.');
      } finally {
          setIsPurchasing(false);
      }
  };

  const handleCancelPurchase = () => {
    setIsPurchaseModalOpen(false);
    setSelectedPodcast(null);
    setPurchaseError('');
  };

  const handlePlayRecording = async (podcastId) => {
    try {
      const res = await api.get(`/podcasts/${podcastId}/recording`);
      window.open(res.data.recordingUrl, '_blank');
    } catch (err) {
      console.error('Error loading recording:', err);
      setError(err.response?.data?.message || 'Failed to load recording');
    }
  };

  const handleJoinLive = async (podcastId) => {
    try {
      await api.get(`/podcasts/${podcastId}/join-stream`);
      setError('Connected to live session. Live player UI is not available yet, but your access was verified.');
    } catch (err) {
      console.error('Error joining live session:', err);
      setError(err.response?.data?.message || 'Unable to join live session');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true
    });
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (!user) return null;

  return (
    <div className="client-podcasts-container">
      
      <aside className="mc-sidebar">
        <Link to="/client/profile" style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div className="mc-user-details">
              <h6>{user.username}</h6>
              <small>Client</small>
            </div>
          </div>
        </Link>
        <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to="/client/dashboard" className="mc-nav-link">
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
            <Link to="/client/podcasts" className="mc-nav-link active">
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
          <button className="mc-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="client-podcasts-main">
        <div className="mc-main-header">
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="mc-notification-btn">
              <i className="bi bi-bell-fill"></i>
              <span className="mc-badge">3</span>
            </button>
            <Link to="/client/dashboard" className="mc-main-logo">
              MindComfort <img src={logoImg} alt="Logo" />
            </Link>
          </div>
        </div>

        <div className="podcasts-header">
          <h2>Podcasts</h2>
          <p>Discover live sessions and access your purchased content</p>
        </div>

        <div className="podcasts-tabs">
          <button 
            className={`podcast-tab ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <i className="bi bi-compass"></i> Discover
          </button>
          <button 
            className={`podcast-tab ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <i className="bi bi-collection-play"></i> My Library
          </button>
        </div>

        {loadError && <p className="error-text">Failed to load podcasts. Please try again.</p>}
        {error && <p className="error-text">{error}</p>}

        {loading ? (
          <div className="loading-text">Loading podcasts...</div>
        ) : (
          <>
        
            {activeTab === 'discover' && (
              <div className="podcasts-grid">
                {upcomingPodcasts.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-broadcast-pin"></i>
                    <p>No upcoming podcasts at the moment. Check back soon!</p>
                  </div>
                ) : (
                  upcomingPodcasts.map(podcast => (
                    <div key={podcast._id} className="podcast-card">
                      <div className="podcast-card-visual">
                        <i className="bi bi-mic-fill"></i>
                        {podcast.isPurchased && (
                          <span className="purchased-badge">
                            <i className="bi bi-check-circle-fill"></i> Purchased
                          </span>
                        )}
                      </div>
                      <div className="podcast-card-body">
                        <h4>{podcast.title}</h4>
                        <p className="podcast-speaker">
                          <i className="bi bi-person-fill"></i> {podcast.speaker?.fullName || podcast.speaker?.username}
                        </p>
                        <p className="podcast-desc">{podcast.description}</p>
                        <div className="podcast-meta">
                          <span><i className="bi bi-calendar3"></i> {formatDate(podcast.startTime)}</span>
                          <span><i className="bi bi-clock"></i> {formatTime(podcast.startTime)}</span>
                        </div>
                        <div className="podcast-card-footer">
                          <span className="podcast-price">
                            {podcast.price === 0 ? 'Free' : `PKR ${podcast.price}`}
                          </span>
                          {podcast.isPurchased ? (
                            <button className="btn-purchased" disabled>
                              <i className="bi bi-check-lg"></i> In Library
                            </button>
                          ) : (
                            <button 
                              className="btn-purchase"
                              onClick={() => handlePurchase(podcast)}
                            >
                              <i className="bi bi-bag-plus"></i> Purchase
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'library' && (
              <>
                <div className="library-subtabs">
                  <button 
                    className={`subtab ${libraryView === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setLibraryView('upcoming')}
                  >
                    Upcoming ({library.upcoming.length})
                  </button>
                  <button 
                    className={`subtab ${libraryView === 'recordings' ? 'active' : ''}`}
                    onClick={() => setLibraryView('recordings')}
                  >
                    Recordings ({library.past.length})
                  </button>
                </div>

                {libraryView === 'upcoming' && (
                  <div className="podcasts-grid">
                    {library.upcoming.length === 0 ? (
                      <div className="empty-state">
                        <i className="bi bi-calendar-event"></i>
                        <p>You haven't purchased any upcoming podcasts yet.</p>
                        <button className="btn-browse" onClick={() => setActiveTab('discover')}>
                          Browse Podcasts
                        </button>
                      </div>
                    ) : (
                      library.upcoming.map(podcast => (
                        <div key={podcast._id} className="podcast-card">
                          <div className="podcast-card-visual">
                            <i className="bi bi-mic-fill"></i>
                            {podcast.streamStatus === 'live' && (
                              <span className="live-badge">
                                <span className="live-dot"></span> LIVE
                              </span>
                            )}
                          </div>
                          <div className="podcast-card-body">
                            <h4>{podcast.title}</h4>
                            <p className="podcast-speaker">
                              <i className="bi bi-person-fill"></i> {podcast.speaker?.fullName || podcast.speaker?.username}
                            </p>
                            <p className="podcast-desc">{podcast.description}</p>
                            <div className="podcast-meta">
                              <span><i className="bi bi-calendar3"></i> {formatDate(podcast.startTime)}</span>
                              <span><i className="bi bi-clock"></i> {formatTime(podcast.startTime)}</span>
                            </div>
                            <div className="podcast-card-footer">
                              {podcast.streamStatus === 'live' ? (
                                <button 
                                  className="btn-join-live"
                                  onClick={() => handleJoinLive(podcast._id)}
                                >
                                  <i className="bi bi-broadcast"></i> Join Live
                                </button>
                              ) : (
                                <span className="scheduled-badge">
                                  <i className="bi bi-hourglass-split"></i> Scheduled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {libraryView === 'recordings' && (
                  <div className="podcasts-grid">
                    {library.past.length === 0 ? (
                      <div className="empty-state">
                        <i className="bi bi-play-circle"></i>
                        <p>No past podcasts in your library yet.</p>
                      </div>
                    ) : (
                      library.past.map(podcast => (
                        <div key={podcast._id} className="podcast-card past-podcast">
                          <div className="podcast-card-visual past-visual">
                            <i className="bi bi-play-circle-fill"></i>
                            {podcast.hasRecording ? (
                              <span className="recording-badge">
                                <i className="bi bi-check-circle-fill"></i> Recording Available
                              </span>
                            ) : (
                              <span className="no-recording-badge">
                                <i className="bi bi-x-circle"></i> No Recording
                              </span>
                            )}
                          </div>
                          <div className="podcast-card-body">
                            <h4>{podcast.title}</h4>
                            <p className="podcast-speaker">
                              <i className="bi bi-person-fill"></i> {podcast.speaker?.fullName || podcast.speaker?.username}
                            </p>
                            <p className="podcast-desc">{podcast.description}</p>
                            <div className="podcast-meta">
                              <span><i className="bi bi-calendar3"></i> {formatDate(podcast.endTime)}</span>
                            </div>
                            <div className="podcast-card-footer">
                              {podcast.hasRecording ? (
                                <button 
                                  className="btn-play-recording"
                                  onClick={() => handlePlayRecording(podcast._id)}
                                >
                                  <i className="bi bi-play-fill"></i> Play Recording
                                </button>
                              ) : (
                                <span className="no-recording-note">
                                  <i className="bi bi-info-circle"></i> Recording not available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        item={selectedPodcast}
        itemType="podcast"
        onConfirm={handleConfirmPurchase}
        onCancel={handleCancelPurchase}
        isLoading={isPurchasing}
        error={purchaseError}
      />
    </div>
  );
};

export default ClientPodcasts;