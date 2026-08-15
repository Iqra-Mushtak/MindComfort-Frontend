import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';
import { useLocation } from 'react-router-dom';

const PodcastsManagement = ({ isModerator = false }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const apiPrefix = isModerator || user?.role === 'moderator' ? '/moderator' : '/admin';
  
  const [tab, setTab] = useState(() => {
    return location.state?.defaultTab === 'pending' ? 'pending' : 'all';
  });
  const [podcasts, setPodcasts] = useState([]);
  const [pendingPodcasts, setPendingPodcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);
  
  const [expandedPodcasts, setExpandedPodcasts] = useState({});

  useEffect(() => {
    if (tab === 'all') {
      fetchPodcasts();
    } else {
      fetchPendingPodcasts();
    }
  }, [page, type, search, tab]);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (type !== 'all') query.append('type', type);
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`${apiPrefix}/podcasts?${query}`);
      setPodcasts(res.data.podcasts);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPodcasts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`${apiPrefix}/podcasts/pending/list?${query}`);
      setPendingPodcasts(res.data.podcasts);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching pending podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (podcastId) => {
    setPendingActionId(podcastId);
    setShowApproveConfirm(true);
  };

  const handleApproveConfirm = async () => {
    try {
      await api.patch(`${apiPrefix}/podcasts/${pendingActionId}/approve`, {});
      setShowApproveConfirm(false);
      setPendingActionId(null);
      fetchPendingPodcasts();
      alert('Podcast approved!');
    } catch (err) {
      console.error('Error approving podcast:', err);
      alert('Failed to approve podcast');
    }
  };

  const handleRejectClick = (podcastId) => {
    setPendingActionId(podcastId);
    setShowRejectConfirm(true);
  };

  const handleRejectConfirm = async () => {
    setShowRejectConfirm(false);
    const reason = window.prompt('Enter rejection reason:');
    if (reason) {
      try {
        await api.patch(`${apiPrefix}/podcasts/${pendingActionId}/reject`, { reason });
        setPendingActionId(null);
        fetchPendingPodcasts();
        alert('Podcast rejected');
      } catch (err) {
        console.error('Error rejecting podcast:', err);
        alert('Failed to reject podcast');
      }
    }
    setShowRejectConfirm(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`${apiPrefix}/podcasts/${selectedPodcast._id}`);
      setSelectedPodcast(null);
      setShowDeleteConfirm(false);
      fetchPodcasts();
      alert('Podcast recording deleted successfully');
    } catch (err) {
      console.error('Error deleting podcast:', err);
      alert('Failed to delete podcast');
    }
  };

  const handleDeleteCancel = () => setShowDeleteConfirm(false);
  const handleApproveCancel = () => { setShowApproveConfirm(false); setPendingActionId(null); };
  const handleRejectCancel = () => { setShowRejectConfirm(false); setPendingActionId(null); };

  const togglePodcastExpand = (podcastId) => {
    setExpandedPodcasts(prev => ({
      ...prev,
      [podcastId]: !prev[podcastId]
    }));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'live': return 'status-live';
      case 'ended': return 'status-ended';
      default: return 'status-pending';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'live': return 'Live Now';
      case 'ended': return 'Ended';
      default: return 'Pending';
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Podcasts Management</h2>
        <div className="tab-buttons">
          <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => { setTab('all'); setPage(1); }}>
            All Podcasts
          </button>
          <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => { setTab('pending'); setPage(1); }}>
            Pending Approval
          </button>
        </div>
      </div>

      {tab === 'all' ? (
        <>
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search by title, description, or speaker name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
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
              podcasts.map(podcast => {
                const isExpanded = expandedPodcasts[podcast._id];
                const isSeries = podcast.sessions && podcast.sessions.length > 1;
                const displaySessions = isExpanded ? podcast.sessions : podcast.sessions?.slice(0, 2);
                
                return (
                  <div key={podcast._id} className="podcast-card">
                    <div className="card-header">
                      <h4>{podcast.title}</h4>
                      <span className={`status-badge ${getStatusBadgeClass(podcast.streamStatus)}`}>
                        {getStatusLabel(podcast.streamStatus)}
                      </span>
                    </div>
                    <div className="card-body">
                      <p className="description">{podcast.description ? podcast.description.substring(0, 100) + '...' : 'No description'}</p>
                      <p><strong>Speaker:</strong> {podcast.speaker?.fullName || podcast.speaker?.username}</p>
                      
                      {isSeries ? (
                        <>
                          <p 
                            className="series-toggle"
                            onClick={() => togglePodcastExpand(podcast._id)}
                            style={{
                              cursor: 'pointer',
                              fontWeight: '600',
                              color: '#007bff',
                              userSelect: 'none'
                            }}
                          >
                            <strong>Series:</strong> {podcast.sessions.length} sessions {isExpanded ? '▼' : '▶'}
                          </p>
                          
                          {isExpanded && (
                            <div className="expanded-sessions" style={{ marginTop: '8px', paddingLeft: '12px' }}>
                              {podcast.sessions.map((session, idx) => (
                                <p key={idx} style={{ fontSize: '0.85rem', color: '#6c757d', margin: '4px 0' }}>
                                  <strong>{idx + 1}.</strong> {new Date(session.startTime).toLocaleString()}
                                </p>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p><strong>Date:</strong> {new Date(podcast.startTime).toLocaleString()}</p>
                      )}
                      
                      <p><strong>Price:</strong> PKR {podcast.price}</p>
                    </div>
                    <div className="card-actions">
                      <button className="btn-view" onClick={() => setSelectedPodcast(podcast)}>
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="pending-podcasts-list">
          {loading ? (
            <div className="loading">Loading pending podcasts...</div>
          ) : pendingPodcasts.length === 0 ? (
            <div className="empty-state">No pending podcasts</div>
          ) : (
            pendingPodcasts.map(podcast => (
              <div key={podcast._id} className="podcast-item">
                <div className="podcast-info">
                  <h4>{podcast.title}</h4>
                  {podcast.sessions && podcast.sessions.length > 1 && (
                    <span className="series-badge">
                      SERIES • {podcast.sessions.length} SESSIONS
                    </span>
                  )}
                  <p>{podcast.description}</p>
                  <p><strong>Speaker:</strong> {podcast.speaker?.fullName || podcast.speaker?.username}</p>
                  
                  {podcast.sessions && podcast.sessions.length > 1 ? (
                    <div className="sessions-list">
                      <p className="sessions-list-title">Session Schedule:</p>
                      {podcast.sessions.map((session, idx) => (
                        <p key={idx} className="session-item">
                          <strong>{idx + 1}.</strong> {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString()}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p><strong>Date:</strong> {new Date(podcast.startTime).toLocaleString()}</p>
                  )}
                  
                  <p><strong>Price:</strong> PKR {podcast.price}</p>
                  <small className="submitted-date">Submitted: {new Date(podcast.createdAt).toLocaleDateString()}</small>
                </div>
                <div className="podcast-actions">
                  <button className="btn-approve" onClick={() => handleApproveClick(podcast._id)}>Approve</button>
                  <button className="btn-reject" onClick={() => handleRejectClick(podcast._id)}>Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {total > 20 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</button>
        </div>
      )}

      {selectedPodcast && !showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setSelectedPodcast(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-flex">
              <div className="modal-title-flex">
                <h3>{selectedPodcast.title}</h3>
                <span className={`status-badge ${getStatusBadgeClass(selectedPodcast.streamStatus)}`}>
                  {getStatusLabel(selectedPodcast.streamStatus)}
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
                    <span>{selectedPodcast.speaker?.fullName || selectedPodcast.speaker?.username}</span>
                  </div>
                  <div className="detail-row">
                    <label>Date & Time</label>
                    <span>{new Date(selectedPodcast.startTime).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <label>Ticket Price</label>
                    <span>PKR {selectedPodcast.price}</span>
                  </div>
                </div>

                <div className="detail-section">
                  {selectedPodcast.streamStatus === 'scheduled' && (
                    <div className="detail-row">
                      <label>Tickets Sold</label>
                      <span className="stat-value">{selectedPodcast.ticketsSold || 0}</span>
                    </div>
                  )}
                  {selectedPodcast.streamStatus === 'ended' && (
                    <>
                      <div className="detail-row">
                        <label>Tickets Sold</label>
                        <span className="stat-value">{selectedPodcast.ticketsSold || 0}</span>
                      </div>
                      <div className="detail-row">
                        <label>Actual Attendees</label>
                        <span className="stat-value">{selectedPodcast.attendees || 0}</span>
                      </div>
                    </>
                  )}
                  {selectedPodcast.streamStatus === 'live' && (
                    <div className="detail-row">
                      <label>Current Viewers</label>
                      <span className="stat-value live-count">{selectedPodcast.currentViewers || 0}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedPodcast.streamStatus === 'ended' && (
                <div className="delete-recording-wrapper">
                  <button className="btn-delete" onClick={handleDeleteClick}>
                    Delete Recording
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedPodcast && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Delete Recording?</h3>
            <p className="confirm-text">
              Are you sure you want to delete this recording? This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={handleDeleteCancel}>Cancel</button>
              <button className="btn-delete" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showApproveConfirm && (
        <div className="modal-overlay" onClick={handleApproveCancel}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Approve Podcast?</h3>
            <p className="confirm-text">
              Are you sure you want to approve this podcast? It will be published and visible to users.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={handleApproveCancel}>Cancel</button>
              <button className="btn-approve" onClick={handleApproveConfirm}>Approve</button>
            </div>
          </div>
        </div>
      )}

      {showRejectConfirm && (
        <div className="modal-overlay" onClick={handleRejectCancel}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Reject Podcast?</h3>
            <p className="confirm-text">
              Are you sure you want to reject this podcast? The speaker will be notified.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={handleRejectCancel}>Cancel</button>
              <button className="btn-reject" onClick={handleRejectConfirm}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastsManagement;