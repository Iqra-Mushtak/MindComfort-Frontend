import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../../utils/api';
import './ClientLivePlayer.css';
import logoImg from '../../assets/logo.png';
import NotificationBell from '../../components/NotificationBell';

const ClientLivePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [podcast, setPodcast] = useState(null);
  const [agoraClient, setAgoraClient] = useState(null);
  const [socket, setSocket] = useState(null);
  const [anonymousId, setAnonymousId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    document.title = "Live Podcast Session | MindComfort";
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(storedUser);

    fetchPodcastDetails();
    joinLiveSession();

    return () => {
      cleanup();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  useEffect(() => {
    if (!podcast) return;
    const startTimestamp = new Date(podcast.startTime || podcast.createdAt || Date.now()).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTimestamp) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [podcast]);

  const fetchPodcastDetails = async () => {
    try {
      const res = await api.get(`/podcasts/${id}`);
      setPodcast(res.data.data || res.data.podcast);
    } catch (err) {
      console.error('Failed to fetch podcast metadata:', err);
    }
  };

  const joinLiveSession = async () => {
    try {
      const res = await api.get(`/podcasts/${id}/join-stream`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const { token, channelName, anonymousId: anonId, appId, uid } = res.data;
      setAnonymousId(anonId);

      const targetAppId = appId || import.meta.env.VITE_AGORA_APP_ID;
      if (!targetAppId) {
        throw new Error('Agora App ID not provided by server.');
      }

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      await client.join(targetAppId, channelName, token, uid);

      client.on('user-published', async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === 'audio') {
          remoteUser.audioTrack.play();
        }
      });
      setAgoraClient(client);

      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://13.60.72.235:5000', {
        auth: { token: localStorage.getItem('token') }
      });
      socketInstance.on('connect', () => socketInstance.emit('joinPodcastRoom', id));

      socketInstance.on('podcastEnded', (data) => {
        alert(data?.message || 'The host has ended this live podcast session.');
        if (agoraClient) {
          agoraClient.leave();
        }
        navigate('/client/podcasts');
      });

      setSocket(socketInstance);

      setLoading(false);
    } catch (err) {
      console.error('CRITICAL CLIENT JOIN ERROR:', err);
      const serverMessage = err.response?.data?.message || err.message || 'Failed to join live session.';
      alert(`Join Stream Error: ${serverMessage}`);
      navigate('/client/podcasts');
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await api.post(`/podcasts/${id}/comment`, {
        content: commentText,
        anonymousId
      });
      setCommentText('');
      setSendStatus('Sent to host successfully.');
      setTimeout(() => setSendStatus(''), 3000);
    } catch (err) {
      setSendStatus('Failed to send comment.');
    }
  };

  const cleanup = async () => {
    if (agoraClient) await agoraClient.leave();
    if (socket) socket.disconnect();
  };

  const handleLeaveSession = async () => {
    await cleanup();
    navigate('/client/podcasts');
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await cleanup();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  if (loading) {
    return <div className="client-live-loading">Joining live session...</div>;
  }

  return (
    <div className="client-live-layout">
      {sidebarOpen && (
        <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/client/profile" style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">
              {(user?.username || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="mc-user-details">
              <h6>{user?.username || 'Client'}</h6>
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
          <button className="mc-logout-btn" onClick={handleLogoutClick}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="client-live-main">
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
              MindComfort <img src={logoImg} alt="Logo" />
            </Link>
          </div>
        </div>

        <div className="podcast-single-card">
          <div className="card-top-section">
            <div className="podcast-info">
              <h2>{podcast?.title || 'Live Podcast'}</h2>
              <p className="speaker-name">
                <i className="bi bi-person-fill me-1"></i>
                {podcast?.speaker?.fullName || podcast?.speaker?.username || 'Host Mentor'}
              </p>
              <div className="podcast-desc-container">
                <p className={`podcast-description-full ${isDescExpanded ? 'expanded' : ''}`}>
                  {podcast?.description}
                </p>
                {podcast?.description && podcast.description.length > 120 && (
                  <button
                    type="button"
                    className="btn-read-toggle"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    {isDescExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>

            <button className="btn-leave-session" onClick={handleLeaveSession}>
              Leave Session
            </button>
          </div>

          <div className="card-middle-section">
            <div className="audio-listening-box">
              <div className="headphones-circle">
                <i className="bi bi-headphones"></i>
              </div>
              <h3>Listening to Host</h3>
              <p className="listening-subtext">You are connected to the live audio stream.</p>

              <div className="stream-timeline-bar">
                <span className="time-indicator">{formatDuration(elapsedSeconds)}</span>
                <div className="progress-track">
                  <div className="progress-fill"></div>
                </div>
                <span className="live-pulse-text">
                  <i className="bi bi-record-fill text-danger me-1"></i> Live
                </span>
              </div>
            </div>
          </div>

          <div className="card-bottom-section">
            <div className="comment-meta-bar">
              <h4>Send a Private Comment to Host</h4>
              <p className="full-id-text">
                <strong>Your Full Anonymous ID:</strong> <code>{anonymousId}</code>
              </p>
            </div>

            <form onSubmit={handleSendComment} className="live-comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your question or private comment for the host..."
                maxLength={500}
                rows={3}
              />
              <div className="form-bottom-row">
                {sendStatus && <span className="send-status-msg">{sendStatus}</span>}
                <button type="submit" disabled={!commentText.trim()} className="btn-send-comment">
                  Send
                </button>
              </div>
            </form>
          </div>
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

export default ClientLivePlayer;