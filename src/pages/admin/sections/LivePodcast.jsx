import React, { useState, useEffect, useRef } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';
import io from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';

const LivePodcast = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [agoraClient, setAgoraClient] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [podcastDetails, setPodcastDetails] = useState(null);
  const commentsEndRef = useRef(null);
  const socketRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchLivePodcasts();
    const interval = setInterval(fetchLivePodcasts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPodcast && !socketRef.current) {
      initializeSocket();
      initializeAgora();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (agoraClient) {
        agoraClient.leave();
        setAgoraClient(null);
        setIsListening(false);
      }
    };
  }, [selectedPodcast]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected for live podcast');
      newSocket.emit('joinPodcastRoom', selectedPodcast);
    });

    newSocket.on('newComment', (comment) => {
      setComments(prev => [...prev, comment]);
    });

    newSocket.on('commentDeleted', (data) => {
      setComments(prev => prev.filter(c => c._id !== data.commentId));
    });

    newSocket.on('podcastModerationSuccess', (message) => {
      console.log('Podcast moderation success:', message);
    });

    newSocket.on('podcastModerationError', (error) => {
      console.error('Podcast moderation error:', error);
      alert('Error: ' + error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const initializeAgora = async () => {
    try {
      const res = await api.get(`/podcasts/${selectedPodcast}/admin/join-stream`);
      const { token, channelName, sessionId } = res.data;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.play();
          console.log('Playing podcast audio');
        }
        if (mediaType === 'video') {
          user.videoTrack.play('podcast-video-container');
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          user.audioTrack.stop();
        }
      });

      await client.join(import.meta.env.VITE_AGORA_APP_ID, channelName, token, null);
      setAgoraClient(client);
      setIsListening(true);

      const user = JSON.parse(localStorage.getItem('user'));
      const apiPrefix = user?.role === 'moderator' ? '/moderator' : '/admin';
      
      const podcastRes = await api.get(`${apiPrefix}/podcasts/${selectedPodcast}`);
      setPodcastDetails(podcastRes.data.podcast);

      const commentsRes = await api.get(`${apiPrefix}/podcasts/${selectedPodcast}/comments`);
      setComments(commentsRes.data.comments || []);
    } catch (err) {
      console.error('Error joining podcast stream:', err);
      alert('Failed to join podcast stream: ' + err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchLivePodcasts = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const apiPrefix = user?.role === 'moderator' ? '/moderator' : '/admin';
      const res = await api.get(`${apiPrefix}/podcasts?type=live`);
      const livePodcasts = res.data.podcasts.filter(p => p.streamStatus === 'live');
      setPodcasts(livePodcasts);
    } catch (err) {
      console.error('Error fetching live podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPodcast = async (podcastId) => {
    if (agoraClient && selectedPodcast !== podcastId) {
      await agoraClient.leave();
      setAgoraClient(null);
      setIsListening(false);
    }

    setSelectedPodcast(podcastId);
    setComments([]);
  };

  const handleDeleteComment = (commentId, userId) => {
    if (window.confirm('Delete this comment?')) {
      if (socketRef.current) {
        socketRef.current.emit('adminDeleteComment', {
          commentId,
          podcastId: selectedPodcast,
          userId
        });
      }
    }
  };

  const handleWarnCommentUser = (userId, commentId) => {
    const reason = window.prompt('Enter reason for warning:');
    if (reason) {
      if (socketRef.current) {
        socketRef.current.emit('adminWarnPodcastUser', {
          userId,
          commentId,
          podcastId: selectedPodcast,
          reason
        });
      }
    }
  };

  const handleSuspendCommentUser = (userId, commentId) => {
    const reason = window.prompt('Enter reason for suspension:');
    if (reason) {
      if (socketRef.current) {
        socketRef.current.emit('adminSuspendPodcastUser', {
          userId,
          commentId,
          podcastId: selectedPodcast,
          reason
        });
      }
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Live Podcast Monitor</h2>
        <small>Watch live podcasts and moderate comments in real-time</small>
      </div>

      <div className="admin-podcast-layout">
        <div className="podcasts-sidebar">
          <h3>Live Podcasts</h3>
          <div className="podcasts-list">
            {podcasts.length === 0 ? (
              <div className="empty-state-small">No live podcasts currently</div>
            ) : (
              podcasts.map(podcast => (
                <button
                  key={podcast._id}
                  className={`podcast-btn ${selectedPodcast === podcast._id ? 'active' : ''}`}
                  onClick={() => handleSelectPodcast(podcast._id)}
                  title={podcast.title}
                >
                  <span className="live-badge">● LIVE</span>
                  <span className="podcast-title">{podcast.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="podcast-content-area">
          {selectedPodcast ? (
            <>
              <div className="podcast-player-section">
                <div className="podcast-header-info">
                  <h3>{podcastDetails?.title || 'Loading...'}</h3>
                  <div className="listening-status">
                    {isListening ? (
                      <span className="status-badge active">
                        🎧 Connected
                      </span>
                    ) : (
                      <span className="status-badge loading">
                        ⏳ Connecting...
                      </span>
                    )}
                  </div>
                </div>

                <div className="podcast-player-container">
                  <div className="agora-video-area">
                    <div id="podcast-video-container" className="video-stream">
                      {isListening ? (
                        <div className="audio-playing">
                          <i className="bi bi-headphones audio-icon-large"></i>
                          <p>🎧 Listening to Podcast</p>
                          <small>{podcastDetails?.description}</small>
                        </div>
                      ) : (
                        <div className="connecting">
                          <i className="bi bi-hourglass-split"></i>
                          <p>Connecting to stream...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="comments-container">
                    <div className="comments-header">
                      <h4>Comments</h4>
                      {socket ? (
                        <small className="online-status">● Live</small>
                      ) : (
                        <small>Connecting...</small>
                      )}
                    </div>

                    <div className="comments-feed">
                      {comments.length === 0 ? (
                        <div className="empty-state">No comments yet</div>
                      ) : (
                        comments.map(comment => (
                          <div key={comment._id} className="comment-item">
                            <div className="comment-header">
                              <strong>{comment.user?.username || comment.anonymousId || 'Anonymous'}</strong>
                              <span className="comment-time">
                                {new Date(comment.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="comment-content">
                              {comment.content}
                            </div>
                            <div className="comment-actions">
                              <div className="action-menu-container">
                                <button
                                  className="btn-dots"
                                  onClick={() => setOpenMenuId(openMenuId === comment._id ? null : comment._id)}
                                  title="Comment actions"
                                >
                                  ⋮
                                </button>
                                {openMenuId === comment._id && (
                                  <div className="action-menu">
                                    <button
                                      className="menu-item delete"
                                      onClick={() => handleDeleteComment(comment._id, comment.user?._id)}
                                    >
                                    Delete Comment
                                    </button>
                                    <button
                                      className="menu-item warn"
                                      onClick={() => handleWarnCommentUser(comment.user?._id, comment._id)}
                                    >
                                     Warn User
                                    </button>
                                    <button
                                      className="menu-item suspend"
                                      onClick={() => handleSuspendCommentUser(comment.user?._id, comment._id)}
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
              </div>
            </>
          ) : (
            <div className="empty-state">Select a live podcast to watch and moderate comments</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePodcast;
