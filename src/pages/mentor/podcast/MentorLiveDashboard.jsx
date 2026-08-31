import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../../../utils/api';
import './MentorLiveDashboard.css';
import NotificationBell from '../../../components/NotificationBell';

const MentorLiveDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [socket, setSocket] = useState(null);
  const [agoraClient, setAgoraClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEndingStream, setIsEndingStream] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const micTrackRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    document.title = "Mentor Live Podcast | MindComfort";
    isMountedRef.current = true;
    startLiveSession();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [id]);

  const startLiveSession = async () => {
    try {
      setLoading(true);
      setError('');

      const tokenStr = localStorage.getItem('token');
      const res = await api.put(
        `/podcasts/${id}/start-stream`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenStr}`
          }
        }
      );

      if (!isMountedRef.current) return;

      const { token, channelName } = res.data;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      await client.join(import.meta.env.VITE_AGORA_APP_ID, channelName, token, 100);       
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = micTrack;
      await client.publish([micTrack]);

      if (!isMountedRef.current) {
        micTrack.stop();
        micTrack.close();
        await client.leave();
        return;
      }

      setAgoraClient(client);

      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://13.60.72.235:5000', {
        auth: { token: tokenStr }
      });
      
      socketInstance.on('connect', () => {
        socketInstance.emit('joinPodcastRoom', id);
      });

      socketInstance.on('newComment', (comment) => {
        if (isMountedRef.current) {
          setComments(prev => [comment, ...prev]);
        }
      });

      setSocket(socketInstance);
      setLoading(false);
    } catch (err) {
      console.error('CRITICAL START STREAM ERROR:', err);
      if (isMountedRef.current) {
        const serverMessage = err.response?.data?.message || err.message;
        setError(serverMessage || 'Failed to start live session.');
        setLoading(false);
      }
    }
  };

  const toggleMic = async () => {
    if (micTrackRef.current) {
      await micTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleEndStream = async () => {
    if (isEndingStream) return;
    
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
    if (micTrackRef.current) {
      micTrackRef.current.stop();
      micTrackRef.current.close();
      micTrackRef.current = null;
    }
    if (agoraClient) {
      await agoraClient.leave();
    }
    if (socket) {
      socket.disconnect();
    }
  };

  if (loading) {
    return <div className="live-loading">Starting live stream and initializing recording...</div>;
  }

  if (error) {
    return (
      <div className="live-error-container">
        <div className="live-error-card">
          <h3>Stream Error</h3>
          <p>{error}</p>
          <button className="btn-return-podcasts" onClick={() => navigate('/mentor/podcasts')}>
            Return to Podcasts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-live-container">
      <div className="live-header">
        <h2><i className="bi bi-broadcast text-danger"></i> LIVE NOW</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NotificationBell />
          <button 
            className="btn-end-stream" 
            onClick={handleEndStream}
            disabled={isEndingStream}
          >
            {isEndingStream ? 'Ending Stream...' : 'End Stream'}
          </button>
        </div>
      </div>

      <div className="live-content-grid">
        <div className="mentor-audio-card">
          <i className={`bi ${isMuted ? 'bi-mic-mute-fill text-muted' : 'bi-mic-fill audio-icon'}`}></i>
          <h3>{isMuted ? 'Microphone Muted' : 'You are broadcasting'}</h3>
          <p>{isMuted ? 'Clients cannot hear you right now.' : 'Your microphone is active and streaming to clients.'}</p>
          
          <button 
            className={`btn-toggle-mic ${isMuted ? 'unmute' : 'mute'}`}
            onClick={toggleMic}
          >
            <i className={`bi ${isMuted ? 'bi-mic-fill' : 'bi-mic-mute-fill'}`}></i>
            {isMuted ? 'Unmute Audio' : 'Mute Audio'}
          </button>
        </div>

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