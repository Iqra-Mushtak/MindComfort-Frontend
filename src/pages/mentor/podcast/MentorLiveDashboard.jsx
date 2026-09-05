import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../../../utils/api';
import './MentorLiveDashboard.css';
import logoImg from '../../../assets/logo.png';
import NotificationBell from '../../../components/NotificationBell';

const MentorLiveDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [podcast, setPodcast] = useState(null);
  const [comments, setComments] = useState([]);
  const [listenersCount, setListenersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEndingStream, setIsEndingStream] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const timerIntervalRef = useRef(null);

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    document.title = "Mentor Live Broadcast | MindComfort";
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(storedUser);

    fetchPodcastDetails();
    initOrAttachStream();

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [id]);

  const fetchPodcastDetails = async () => {
    try {
      const res = await api.get(`/podcasts/${id}`);
      const data = res.data.data || res.data.podcast;
      setPodcast(data);
    } catch (err) {
      console.error('Failed to load podcast info:', err);
    }
  };

  useEffect(() => {
    if (!podcast) return;

    const startMs = new Date(podcast.startTime || podcast.createdAt || Date.now()).getTime();
    const durationMinutes = podcast.duration || 60;
    const endMs = podcast.endTime ? new Date(podcast.endTime).getTime() : startMs + durationMinutes * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - startMs) / 1000));
      setElapsedSeconds(elapsed);

      const remaining = Math.floor((endMs - now) / 1000);
      setSecondsRemaining(remaining);

      if (remaining <= 0 && !isEndingStream) {
        handleAutoEndStream();
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [podcast, isEndingStream]);

  const initOrAttachStream = async () => {
    try {
      setLoading(true);

      if (window.__mentorStream && window.__mentorStream.podcastId === id) {
        setIsMuted(!window.__mentorStream.micTrack.enabled);
        attachSocketListeners(window.__mentorStream.socket);
        setLoading(false);
        return;
      }

      const tokenStr = localStorage.getItem('token');
      const res = await api.put(
        `/podcasts/${id}/start-stream`,
        {},
        { headers: { Authorization: `Bearer ${tokenStr}` } }
      );

      const { token, channelName, appId } = res.data;
      const targetAppId = appId || import.meta.env.VITE_AGORA_APP_ID;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      await client.join(targetAppId, channelName, token, 100);

      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([micTrack]);

      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://13.60.72.235:5000', {
        auth: { token: tokenStr }
      });

      socketInstance.on('connect', () => {
        socketInstance.emit('joinPodcastRoom', id);
      });

      attachSocketListeners(socketInstance);

      window.__mentorStream = {
        podcastId: id,
        client,
        micTrack,
        socket: socketInstance
      };

      setLoading(false);
    } catch (err) {
      console.error('Mentor start stream error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initialize broadcast.');
      setLoading(false);
    }
  };

  const attachSocketListeners = (socketInst) => {
    if (!socketInst) return;

    socketInst.off('newComment');
    socketInst.off('listenerCountUpdate');

    socketInst.on('newComment', (comment) => {
      setComments((prev) => [comment, ...prev]);
    });

    socketInst.on('listenerCountUpdate', (count) => {
      setListenersCount(count);
    });
  };

  const toggleMic = async () => {
    const track = window.__mentorStream?.micTrack;
    if (track) {
      await track.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleAutoEndStream = async () => {
    setIsEndingStream(true);
    try {
      await api.put(`/podcasts/${id}/end-stream`);
      destroyGlobalStream();
      alert('Podcast duration has ended. The session has finished.');
      navigate('/mentor/podcasts');
    } catch (err) {
      console.error('Auto end stream error:', err);
    }
  };

  const handleEndStream = async () => {
    if (isEndingStream) return;
    if (window.confirm('Are you sure you want to end this live broadcast for all attendees?')) {
      try {
        setIsEndingStream(true);
        await api.put(`/podcasts/${id}/end-stream`);
        destroyGlobalStream();
        navigate('/mentor/podcasts');
      } catch (err) {
        console.error(err);
        alert('Failed to end stream.');
        setIsEndingStream(false);
      }
    }
  };

  const destroyGlobalStream = () => {
    if (window.__mentorStream) {
      const { micTrack, client, socket } = window.__mentorStream;
      if (micTrack) {
        micTrack.stop();
        micTrack.close();
      }
      if (client) client.leave();
      if (socket) socket.disconnect();
      window.__mentorStream = null;
    }
  };

  const confirmLogout = async () => {
    destroyGlobalStream();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatHMS = (totalSec) => {
    const sec = Math.max(0, totalSec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const groupedComments = comments.reduce((groups, comment) => {
    const lastGroup = groups[groups.length - 1];
    const commentId = comment.anonymousId || 'Anonymous';

    if (lastGroup && lastGroup.anonymousId === commentId) {
      lastGroup.messages.push(comment);
    } else {
      groups.push({
        anonymousId: commentId,
        messages: [comment]
      });
    }
    return groups;
  }, []);

  if (loading) {
    return <div className="mentor-live-loading">Connecting to audio broadcast...</div>;
  }

  if (error) {
    return (
      <div className="live-error-container">
        <div className="live-error-card">
          <h3>Stream Initialization Error</h3>
          <p>{error}</p>
          <button className="btn-return-podcasts" onClick={() => navigate('/mentor/podcasts')}>
            Return to Podcasts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-live-layout">
      {sidebarOpen && (
        <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/mentor/profile" style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">{(user?.username || 'M').charAt(0).toUpperCase()}</div>
            <div className="mc-user-details">
              <h6>{user?.username || 'Mentor'}</h6>
              <small>Mentor</small>
            </div>
          </div>
        </Link>

        <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to="/mentor/dashboard" className="mc-nav-link">
              <i className="bi bi-grid-fill"></i> Home
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/mentor/chatrooms" className="mc-nav-link">
              <i className="bi bi-chat-dots-fill"></i> Chatrooms
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/mentor/podcasts" className="mc-nav-link active">
              <i className="bi bi-broadcast-pin"></i> Podcasts
            </Link>
          </li>
        </ul>

        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={() => setShowLogoutModal(true)}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="mentor-live-main">
        <div className="mc-main-header">
          <button
            className="mc-sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Menu"
          >
            <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>

          <div style={{ flex: 1 }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <NotificationBell />
            <Link to="/mentor/dashboard" className="mc-main-logo">
              MindComfort <img src={logoImg} alt="Logo" />
            </Link>
          </div>
        </div>

        <div className="mentor-live-master-container">
          <div className="mentor-broadcast-pane">
            <div className="pane-header-meta">
              <div className="live-status-tags">
                <span className="badge-live-now">
                  <i className="bi bi-broadcast me-1"></i> LIVE NOW
                </span>
                <span className="badge-listeners">
                  <i className="bi bi-people-fill me-1"></i> {listenersCount} Listeners
                </span>
              </div>

              <h2 className="podcast-title-text">{podcast?.title || 'Live Broadcast'}</h2>

              <div className="mentor-desc-box">
                <p className={`podcast-desc-text ${isDescExpanded ? 'expanded' : ''}`}>
                  {podcast?.description || 'No description provided.'}
                </p>
                {podcast?.description && podcast.description.length > 100 && (
                  <button
                    type="button"
                    className="btn-desc-toggle"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    {isDescExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>

            <div className="mentor-stage-box">
              <div className={`broadcast-circle-icon ${isMuted ? 'muted' : 'active'}`}>
                <i className={`bi ${isMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`}></i>
              </div>
              <h3>{isMuted ? 'Microphone Muted' : 'You are broadcasting'}</h3>
              <p className="broadcast-subtext">
                {isMuted
                  ? 'Your audio is paused. Clients cannot hear you.'
                  : 'Your microphone is active and streaming live audio.'}
              </p>

              <div className="stream-timeline-row">
                <span className="timer-badge">
                  <i className="bi bi-stopwatch me-1"></i> {formatHMS(elapsedSeconds)}
                </span>
                <div className="timeline-track">
                  <div className="timeline-fill"></div>
                </div>
              </div>

              {secondsRemaining !== null && (
                <div className={`countdown-timeline-box ${secondsRemaining < 300 ? 'warning' : ''}`}>
                  <div className="countdown-labels">
                    <span>
                      <i className="bi bi-hourglass-split me-1"></i> Time Left
                    </span>
                    <strong>{formatHMS(secondsRemaining)}</strong>
                  </div>
                  <div className="countdown-track">
                    <div
                      className="countdown-fill"
                      style={{
                        width: `${Math.max(0, Math.min(100, (secondsRemaining / ((podcast?.duration || 60) * 60)) * 100))}%`
                      }}
                    ></div>
                  </div>
                  {secondsRemaining <= 300 && secondsRemaining > 0 && (
                    <small className="time-warning-text">
                      Stream will automatically end when timer reaches 00:00:00
                    </small>
                  )}
                </div>
              )}

              <div className="mentor-control-buttons">
                <button
                  className={`btn-mic-action ${isMuted ? 'btn-unmute' : 'btn-mute'}`}
                  onClick={toggleMic}
                >
                  <i className={`bi ${isMuted ? 'bi-mic-fill' : 'bi-mic-mute-fill'} me-1`}></i>
                  {isMuted ? 'Unmute Audio' : 'Mute Audio'}
                </button>

                <button
                  className="btn-end-broadcast"
                  onClick={handleEndStream}
                  disabled={isEndingStream}
                >
                  <i className="bi bi-stop-circle-fill me-1"></i>
                  {isEndingStream ? 'Ending Stream...' : 'End Stream'}
                </button>
              </div>
            </div>
          </div>

          <div className="mentor-comments-pane">
            <div className="comments-pane-header">
              <h4>
                <i className="bi bi-chat-left-text-fill me-2"></i>
                Live Questions & Comments ({comments.length})
              </h4>
            </div>

            <div className="mentor-comments-scroll">
              {groupedComments.length === 0 ? (
                <div className="no-comments-view">
                  <i className="bi bi-chat-square-dots"></i>
                  <p>Waiting for client questions...</p>
                </div>
              ) : (
                groupedComments.map((group, groupIdx) => (
                  <div key={groupIdx} className="comment-user-cluster">
                    <div className="user-id-header">
                      <i className="bi bi-person-badge-fill me-1"></i>
                      <span className="full-id-code">ID: {group.anonymousId}</span>
                    </div>

                    <div className="cluster-messages">
                      {group.messages.map((c, mIdx) => (
                        <div key={c._id || mIdx} className="message-item">
                          <p className="message-content">{c.content}</p>
                          <span className="message-time">
                            {c.createdAt ? new Date(c.createdAt).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {showLogoutModal && (
        <div className="mc-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="mc-logout-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mc-logout-modal-header">
              <h4>Confirm Logout</h4>
            </div>
            <p>Logging out will immediately end your live broadcast. Continue?</p>
            <div className="mc-logout-modal-actions">
              <button className="btn-cancel-logout" onClick={() => setShowLogoutModal(false)}>
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

export default MentorLiveDashboard;