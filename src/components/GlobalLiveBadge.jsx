import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const GlobalLiveBadge = () => {
  const [livePodcast, setLivePodcast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://13.60.72.235:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    socket.on('globalPodcastLive', (data) => setLivePodcast(data));
    socket.on('globalPodcastEnded', () => setLivePodcast(null));

    return () => socket.disconnect();
  }, []);

  if (!livePodcast) return null;

  return (
    <div className="global-live-badge" onClick={() => navigate(`/client/podcast/${livePodcast.podcastId}/live`)}>
      <span className="live-dot"></span>
      <span>LIVE: {livePodcast.title}</span>
    </div>
  );
};

export default GlobalLiveBadge;