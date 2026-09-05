import React, { useState, useEffect, useRef } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';
import io from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';

const LivePodcast = () => {
  const [livePodcasts, setLivePodcasts] = useState([]);
  const [activePodcast, setActivePodcast] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [socket, setSocket] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [agoraClient, setAgoraClient] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);

  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const timerIntervalRef = useRef(null);

  const commentsEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    document.title = "Live Podcast Monitor | MindComfort";
    fetchLivePodcasts();
    const pollInterval = setInterval(fetchLivePodcasts, 20000);
    return () => {
      clearInterval(pollInterval);
      handleLeaveSession();
    };
  }, []);

  useEffect(() => {
    if (!activePodcast || !isJoined) return;

    const startMs = new Date(activePodcast.startTime || activePodcast.createdAt || Date.now()).getTime();
    const durationMins = activePodcast.duration || 60;
    const endMs = activePodcast.endTime 
      ? new Date(activePodcast.endTime).getTime() 
      : startMs + durationMins * 60 * 1000;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activePodcast, isJoined]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchLivePodcasts = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const apiPrefix = user?.role === 'moderator' ? '/moderator' : '/admin';
      const res = await api.get(`${apiPrefix}/podcasts?type=live`);
      const list = (res.data.podcasts || []).filter(p => p.streamStatus === 'live');
      setLivePodcasts(list);

      if (!activePodcast && list.length > 0) {
        setActivePodcast(list[0]);
      }
    } catch (err) {
      console.error('Error fetching live podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLive = async () => {
    if (!activePodcast) return;
    setConnecting(true);

    try {
      const tokenStr = localStorage.getItem('token');
      const res = await api.get(`/podcasts/${activePodcast._id}/admin/join-stream`, {
        headers: { Authorization: `Bearer ${tokenStr}` }
      });
      const { token, channelName, appId, uid } = res.data;

      const targetAppId = appId || import.meta.env.VITE_AGORA_APP_ID;
      if (!targetAppId) {
        throw new Error('Agora App ID not provided by server.');
      }

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          user.audioTrack.stop();
        }
      });

      await client.join(targetAppId, channelName, token, uid);
      setAgoraClient(client);
      setIsListening(true);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://13.60.72.235:5000';
      const newSocket = io(apiUrl, {
        auth: { token: tokenStr },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        newSocket.emit('joinPodcastRoom', activePodcast._id);
      });

      newSocket.on('newComment', (comment) => {
        setComments(prev => [...prev, comment]);
      });

      newSocket.on('commentDeleted', (data) => {
        setComments(prev => prev.filter(c => c._id !== data.commentId));
      });

      newSocket.on('listenerCountUpdate', (count) => {
        setListenerCount(count);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      const user = JSON.parse(localStorage.getItem('user'));
      const apiPrefix = user?.role === 'moderator' ? '/moderator' : '/admin';
      const commentsRes = await api.get(`${apiPrefix}/podcasts/${activePodcast._id}/comments`);
      setComments(commentsRes.data.comments || []);

      setIsJoined(true);
    } catch (err) {
      console.error('Failed to join stream:', err);
      alert(err.response?.data?.message || err.message || 'Failed to connect to live stream.');
    } finally {
      setConnecting(false);
    }
  };

  const handleLeaveSession = async () => {
    if (agoraClient) {
      await agoraClient.leave();
      setAgoraClient(null);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsListening(false);
    setIsJoined(false);
    setComments([]);
  };

  const handleDeleteComment = (commentId, userId) => {
    if (window.confirm('Delete this comment?')) {
      if (socketRef.current) {
        socketRef.current.emit('adminDeleteComment', {
          commentId,
          podcastId: activePodcast._id,
          userId
        });
      }
    }
  };

  const handleWarnUser = (userId, commentId) => {
    const reason = window.prompt('Enter reason for warning:');
    if (reason && socketRef.current) {
      socketRef.current.emit('adminWarnPodcastUser', {
        userId,
        commentId,
        podcastId: activePodcast._id,
        reason
      });
    }
  };

  const handleSuspendUser = (userId, commentId) => {
    const reason = window.prompt('Enter reason for suspension:');
    if (reason && socketRef.current) {
      socketRef.current.emit('adminSuspendPodcastUser', {
        userId,
        commentId,
        podcastId: activePodcast._id,
        reason
      });
    }
  };

  const formatHMS = (totalSeconds) => {
    if (totalSeconds === null || isNaN(totalSeconds)) return '--:--:--';
    const s = Math.max(0, totalSeconds);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  if (loading) {
    return <div className="apm-loading-state">Loading live podcast monitor...</div>;
  }

  if (livePodcasts.length === 0) {
    return (
      <div className="apm-no-streams-card">
        <i className="bi bi-broadcast"></i>
        <h3>No Live Podcasts Currently</h3>
        <p>When a mentor begins broadcasting, the session will appear here for moderation.</p>
      </div>
    );
  }

  return (
    <div className="apm-monitor-wrapper">
      {!isJoined ? (
        <div className="apm-details-card">
          <div className="apm-details-header">
            <span className="apm-badge-live">
              <i className="bi bi-broadcast me-1"></i> Live Stream Available
            </span>
            <span className="apm-meta-time">
              <i className="bi bi-clock me-1"></i> Started at {new Date(activePodcast?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h2 className="apm-details-title">{activePodcast?.title}</h2>
          
          <p className="apm-details-speaker">
            <i className="bi bi-person-fill me-1"></i> Speaker: <strong>{activePodcast?.speaker?.fullName || activePodcast?.speaker?.username || 'Mentor'}</strong>
          </p>

          <p className="apm-details-desc">{activePodcast?.description}</p>

          <div className="apm-details-action">
            <button 
              className="apm-btn-join" 
              onClick={handleJoinLive}
              disabled={connecting}
            >
              <i className="bi bi-headphones me-2"></i>
              {connecting ? 'Connecting...' : 'Join Live Stream'}
            </button>
          </div>
        </div>
      ) : (
        <div className="apm-active-grid">
          <div className="apm-stage-pane">
            <div className="apm-stage-top">
              <div className="apm-title-group">
                <h3 className="apm-live-title">{activePodcast?.title}</h3>
                <p className="apm-speaker-tag">
                  <i className="bi bi-person-fill me-1"></i> {activePodcast?.speaker?.fullName || activePodcast?.speaker?.username || 'Mentor'}
                </p>
              </div>

              <button className="apm-btn-leave" onClick={handleLeaveSession}>
                <i className="bi bi-box-arrow-right me-1"></i> Leave Session
              </button>
            </div>

            <div className="apm-visual-box">
              <div className="apm-headphones-glyph">
                <i className="bi bi-headphones"></i>
              </div>
              <h4 className="apm-status-text">Listening to Podcast</h4>
              <p className="apm-connected-desc">{activePodcast?.description}</p>
            </div>

            <div className="apm-stage-footer">
              <div className="apm-metric-pill">
                <i className="bi bi-people-fill me-1"></i> {listenerCount} Listeners
              </div>

              <div className="apm-timeline-pill">
                <i className="bi bi-hourglass-split me-1"></i> Time Left: <strong>{formatHMS(secondsRemaining)}</strong>
              </div>
            </div>
          </div>

          <div className="apm-comments-pane">
            <div className="apm-comments-header">
              <h4>Live Comments ({comments.length})</h4>
              <span className="apm-live-dot-tag">
                <i className="bi bi-circle-fill me-1"></i> Live
              </span>
            </div>

            <div className="apm-comments-feed">
              {comments.length === 0 ? (
                <div className="apm-empty-comments">No client comments yet</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="apm-comment-bubble">
                    <div className="apm-bubble-head">
                      <code className="apm-user-id">
                        ID: {comment.anonymousId || comment.user?.username || 'Client'}
                      </code>
                      <span className="apm-comment-time">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="apm-bubble-body">
                      <p className="apm-comment-text">{comment.content}</p>

                      <div className="apm-action-anchor">
                        <button
                          className="apm-btn-dots"
                          onClick={() => setOpenMenuId(openMenuId === comment._id ? null : comment._id)}
                          title="Actions"
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>

                        {openMenuId === comment._id && (
                          <div className="apm-menu-popover">
                            <button
                              className="apm-menu-opt delete"
                              onClick={() => handleDeleteComment(comment._id, comment.user?._id)}
                            >
                              Delete Comment
                            </button>
                            <button
                              className="apm-menu-opt warn"
                              onClick={() => handleWarnUser(comment.user?._id, comment._id)}
                            >
                              Warn User
                            </button>
                            <button
                              className="apm-menu-opt suspend"
                              onClick={() => handleSuspendUser(comment.user?._id, comment._id)}
                            >
                              Suspend User
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePodcast;