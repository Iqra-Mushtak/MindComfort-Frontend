import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './PodcastRecording.css';

const PodcastRecording = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(null);
  const [podcast, setPodcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecording();
    fetchPodcastDetails();
  }, [id]);

  const fetchRecording = async () => {
    try {
      const res = await api.get(`/podcasts/${id}/recording`);
      setRecording(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recording');
      setLoading(false);
    }
  };

  const fetchPodcastDetails = async () => {
    try {
      const res = await api.get(`/podcasts/${id}`);
      setPodcast(res.data.data);
    } catch (err) {
      console.error('Failed to fetch podcast details:', err);
    }
  };

  if (loading) {
    return (
      <div className="recording-container">
        <div className="loading-state">
          <i className="bi bi-hourglass-split"></i>
          <p>Loading recording...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recording-container">
        <div className="error-state">
          <i className="bi bi-exclamation-circle"></i>
          <p>{error}</p>
          <button 
            className="btn-back" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="recording-container">
        <div className="empty-state">
          <i className="bi bi-film"></i>
          <p>No recording available for this podcast</p>
          <button 
            className="btn-back" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recording-container">
      <div className="recording-header">
        <button 
          className="btn-back-small" 
          onClick={() => navigate(-1)}
          title="Go back"
        >
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <h1>{recording.title}</h1>
        {recording.uploadedAt && (
          <p className="upload-date">
            <i className="bi bi-calendar-event"></i>
            {' Uploaded: ' + new Date(recording.uploadedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      <div className="recording-player">
        <video 
          controls 
          width="100%"
          className="recording-video"
          poster={podcast?.coverImage || 'https://via.placeholder.com/800x450?text=Podcast+Recording'}
        >
          <source src={recording.recordingUrl} type="video/mp4" />
          <p>Your browser does not support the video tag. Please try a different browser or download the recording.</p>
        </video>
      </div>

      {podcast && (
        <div className="recording-info">
          <div className="info-card">
            <h3>Podcast Details</h3>
            <div className="info-item">
              <label>Speaker:</label>
              <span>{podcast.speaker?.username || 'Unknown'}</span>
            </div>
            <div className="info-item">
              <label>Stream Status:</label>
              <span className="status-badge ended">
                <i className="bi bi-check-circle-fill"></i> Ended
              </span>
            </div>
            {podcast.description && (
              <div className="info-item description">
                <label>Description:</label>
                <p>{podcast.description}</p>
              </div>
            )}
          </div>

          <div className="recording-stats">
            <div className="stat">
              <i className="bi bi-play-circle"></i>
              <div>
                <span className="stat-label">Views</span>
                <span className="stat-value">{podcast.listenCount || 0}</span>
              </div>
            </div>
            <div className="stat">
              <i className="bi bi-calendar"></i>
              <div>
                <span className="stat-label">Scheduled</span>
                <span className="stat-value">
                  {new Date(podcast.startTime).toLocaleDateString()}
                </span>
              </div>
            </div>
            {podcast.price > 0 && (
              <div className="stat">
                <i className="bi bi-currency-dollar"></i>
                <div>
                  <span className="stat-label">Price</span>
                  <span className="stat-value">R{podcast.price}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastRecording;
