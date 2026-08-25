import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../../utils/api';
import './ClientLivePlayer.css';
import NotificationBell from '../../components/NotificationBell';

const ClientLivePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agoraClient, setAgoraClient] = useState(null);
  const [socket, setSocket] = useState(null);
  const [anonymousId, setAnonymousId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Podcast Live Player | MindComfort";
    joinLiveSession();
    return () => cleanup();
  }, [id]);

  const joinLiveSession = async () => {
    try {
      const res = await api.get(`/podcasts/${id}/join-stream`);
      const { token, channelName, anonymousId } = res.data;
      setAnonymousId(anonymousId);

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      await client.join(import.meta.env.VITE_AGORA_APP_ID, channelName, token, null);
      
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });
      setAgoraClient(client);

      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('token') }
      });
      socketInstance.on('connect', () => socketInstance.emit('joinPodcastRoom', id));
      setSocket(socketInstance);
      
      setLoading(false);
    } catch (err) {
      alert('Failed to join live session.');
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

  const handleLeave = () => {
    cleanup();
    navigate('/client/podcasts');
  };

  const cleanup = async () => {
    if (agoraClient) await agoraClient.leave();
    if (socket) socket.disconnect();
  };

  if (loading) return <div className="live-loading">Joining live session...</div>;

  return (
    <div className="client-live-container">
      <div className="live-header">
        <h2><i className="bi bi-broadcast text-danger"></i> LIVE SESSION</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NotificationBell />
          <button className="btn-leave" onClick={handleLeave}>Leave Session</button>
        </div>
      </div>

      <div className="live-content-grid">
        {/* Left: Audio Player */}
        <div className="client-audio-card">
          <i className="bi bi-headphones audio-icon"></i>
          <h3>Listening to Host</h3>
          <p>You are connected to the live audio stream.</p>
        </div>

        {/* Right: Private Comment Input */}
        <div className="comment-input-area">
          <h4>Send a Private Comment to Host</h4>
          <p className="anon-note">Your ID: {anonymousId.substring(0, 8)}...</p>
          
          <form onSubmit={handleSendComment}>
            <textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your question or comment..."
              maxLength={500}
            />
            <button type="submit" disabled={!commentText.trim()}>Send to Host</button>
          </form>
          {sendStatus && <p className="status-msg">{sendStatus}</p>}
        </div>
      </div>
    </div>
  );
};

export default ClientLivePlayer;