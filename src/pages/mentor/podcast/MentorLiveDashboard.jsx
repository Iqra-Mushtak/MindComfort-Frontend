import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../../../utils/api';
import './MentorLiveDashboard.css';

const MentorLiveDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [socket, setSocket] = useState(null);
  const [agoraClient, setAgoraClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEndingStream, setIsEndingStream] = useState(false);

  useEffect(() => {
    startLiveSession();
    return () => cleanup();
  }, [id]);

  const startLiveSession = async () => {
    try {
      // 1. Call your existing backend endpoint
      const res = await api.put(`/podcasts/${id}/start-stream`);
      const { token, channelName } = res.data;

      // 2. Initialize Agora (Mentor = Publisher)
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      await client.join(import.meta.env.VITE_AGORA_APP_ID, channelName, token, null);
      
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish(micTrack);
      setAgoraClient(client);

      // 3. Initialize Socket for Comments
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('token') }
      });
      
      socketInstance.on('connect', () => {
        socketInstance.emit('joinPodcastRoom', id); // Uses your existing socketHandler event
      });

      socketInstance.on('newComment', (comment) => {
        setComments(prev => [comment, ...prev]);
      });

      setSocket(socketInstance);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to start live session.');
      setLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (isEndingStream) return; // Prevent multiple submissions
    
    if (window.confirm('Are you sure you want to end the live stream?')) {
      try {
        setIsEndingStream(true);
        await api.put(`/podcasts/${id}/end-stream`);
        await cleanup();
        navigate('/mentor/podcasts');
      } catch (err) {
        console.error(err);
        alert('Failed to end stream.');
        setIsEndingStream(false);
      }
    }
  };

  const cleanup = async () => {
    if (agoraClient) await agoraClient.leave();
    if (socket) socket.disconnect();
  };

  if (loading) return <div className="live-loading">Starting live stream...</div>;
  if (error) return <div className="live-error">{error}</div>;

  return (
    <div className="mentor-live-container">
      <div className="live-header">
        <h2><i className="bi bi-broadcast text-danger"></i> LIVE NOW</h2>
        <button 
          className="btn-end-stream" 
          onClick={handleEndStream}
          disabled={isEndingStream}
        >
          {isEndingStream ? 'Ending Stream...' : 'End Stream'}
        </button>
      </div>

      <div className="live-content-grid">
        {/* Left: Mentor Audio Status */}
        <div className="mentor-audio-card">
          <i className="bi bi-mic-fill audio-icon"></i>
          <h3>You are broadcasting</h3>
          <p>Your microphone is active and streaming to clients.</p>
        </div>

        {/* Right: Live Comments (Only visible to Mentor) */}
        <div className="comments-feed">
          <h4>Live Comments ({comments.length})</h4>
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">Waiting for client questions...</p>
            ) : (
              comments.map((c, i) => (
                <div key={c._id || i} className="comment-bubble">
                  <span className="anon-id">{(c.anonymousId || 'Anonymous').substring(0, 8)}...</span>
                  <p>{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorLiveDashboard;