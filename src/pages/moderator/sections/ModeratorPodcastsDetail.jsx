import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../../admin/AdminDashboard.css';

const ModeratorPodcastsDetail = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [selectedPodcast, setSelectedPodcast] = useState(null);

  useEffect(() => {
    document.title = "Live Podcasts | MindComfort";
    fetchPodcasts();
  }, [search, type]);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (type !== 'all') query.append('type', type);

      const res = await api.get(`/moderator/podcasts?${query}`);
      setPodcasts(res.data.podcasts || []);
    } catch (err) {
      console.error('Error fetching podcasts:', err);
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const streamStatus = status?.toLowerCase();
    switch (streamStatus) {
      case 'scheduled': return 'status-scheduled';
      case 'live': return 'status-live';
      case 'ended': return 'status-ended';
      default: return 'status-pending';
    }
  };

  const getStatusLabel = (status) => {
    const streamStatus = status?.toLowerCase();
    switch (streamStatus) {
      case 'scheduled': return 'Scheduled';
      case 'live': return 'Live Now';
      case 'ended': return 'Ended';
      default: return 'Pending';
    }
  };

  const getSpeakerName = (podcast) => {
    if (podcast.speaker?.fullName) return podcast.speaker.fullName;
    if (podcast.speaker?.username) return podcast.speaker.username;
    if (podcast.mentorId?.fullName) return podcast.mentorId.fullName;
    if (podcast.mentorId?.username) return podcast.mentorId.username;
    return 'N/A';
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Podcasts</h2>
      </div>

      <div className="search-filter">
        <input
          type="text"
          placeholder="Search by title, description, or speaker name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All Podcasts</option>
          <option value="upcoming">Scheduled</option>
          <option value="live">Live Now</option>
          <option value="past">Ended</option>
        </select>
      </div>

      <div className="podcasts-grid">
        {loading ? (
          <div className="loading">Loading podcasts...</div>
        ) : podcasts.length === 0 ? (
          <div className="empty-state">No podcasts found</div>
        ) : (
          podcasts.map(podcast => (
            <div key={podcast._id} className="podcast-card">
              <div className="card-header">
                <h4>{podcast.title}</h4>
                <span className={`status-badge ${getStatusBadgeClass(podcast.status || podcast.streamStatus)}`}>
                  {getStatusLabel(podcast.status || podcast.streamStatus)}
                </span>
              </div>
              <div className="card-body">
                <p className="description">
                  {podcast.description ? podcast.description.substring(0, 100) + '...' : 'No description'}
                </p>
                <p><strong>Speaker:</strong> {getSpeakerName(podcast)}</p>
                <p><strong>Date:</strong> {new Date(podcast.startTime).toLocaleString()}</p>
              </div>
              <div className="card-actions">
                <button className="btn-view" onClick={() => setSelectedPodcast(podcast)}>
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPodcast && (
        <div className="modal-overlay" onClick={() => setSelectedPodcast(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-flex">
              <div className="modal-title-flex">
                <h3>{selectedPodcast.title}</h3>
                <span className={`status-badge ${getStatusBadgeClass(selectedPodcast.status || selectedPodcast.streamStatus)}`}>
                  {getStatusLabel(selectedPodcast.status || selectedPodcast.streamStatus)}
                </span>
              </div>
              <button className="modal-close" onClick={() => setSelectedPodcast(null)}>×</button>
            </div>

            <div className="modal-body">
              {selectedPodcast.description && (
                <div className="podcast-description-full">
                  <p>{selectedPodcast.description}</p>
                </div>
              )}

              <div className="podcast-detail-grid">
                <div className="detail-section">
                  <div className="detail-row">
                    <label>Speaker</label>
                    <span>{getSpeakerName(selectedPodcast)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status</label>
                    <span>{getStatusLabel(selectedPodcast.status || selectedPodcast.streamStatus)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Start Time</label>
                    <span>{new Date(selectedPodcast.startTime).toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-section">
                  {(selectedPodcast.status?.toLowerCase() === 'scheduled' || selectedPodcast.streamStatus?.toLowerCase() === 'scheduled') && (
                    <>
                      <div className="detail-row">
                        <label>Duration</label>
                        <span>{selectedPodcast.duration || 60} minutes</span>
                      </div>
                      <div className="detail-row">
                        <label>Category</label>
                        <span>{selectedPodcast.category || 'General'}</span>
                      </div>
                    </>
                  )}
                  {(selectedPodcast.status?.toLowerCase() === 'live' || selectedPodcast.streamStatus?.toLowerCase() === 'live') && (
                    <div className="detail-row">
                      <label>Current Listeners</label>
                      <span className="stat-value live-count">{selectedPodcast.participants || selectedPodcast.currentViewers || 0}</span>
                    </div>
                  )}
                  {(selectedPodcast.status?.toLowerCase() === 'ended' || selectedPodcast.streamStatus?.toLowerCase() === 'ended') && (
                    <>
                      <div className="detail-row">
                        <label>End Time</label>
                        <span>{new Date(selectedPodcast.endTime).toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <label>Total Participants</label>
                        <span className="stat-value">{selectedPodcast.participants || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorPodcastsDetail;
