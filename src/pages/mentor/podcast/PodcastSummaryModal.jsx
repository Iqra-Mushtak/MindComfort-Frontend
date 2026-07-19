import React from 'react';

const PodcastSummaryModal = ({ podcast, onClose }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="modal show d-block podcast-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          
          <div className="modal-header">
            <h4 className="modal-title">{podcast.title}</h4>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {/* Status Badge */}
            <div className="mb-3">
              <span className={`badge ${
                podcast.status === 'pending' ? 'bg-warning text-dark' :
                podcast.status === 'upcoming' ? 'bg-primary' : 'bg-secondary'
              } rounded-pill px-3 py-2`}>
                {podcast.status === 'pending' ? 'Pending Approval' :
                 podcast.status === 'upcoming' ? 'Approved & Scheduled' : 'Completed'}
              </span>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h6 className="fw-bold mb-2">Description</h6>
              <p className="text-muted mb-0">{podcast.description || 'No description provided.'}</p>
            </div>

            {/* Date & Time */}
            <div className="mb-4">
              <h6 className="fw-bold mb-2">Schedule</h6>
              <p className="mb-1"><i className="bi bi-calendar3 me-2"></i>{formatDate(podcast.date)}</p>
              <p className="mb-0"><i className="bi bi-clock me-2"></i>{podcast.time}</p>
            </div>

            {/* Price */}
            <div className="mb-4">
              <h6 className="fw-bold mb-2">Ticket Price</h6>
              <p className="mb-0 fs-5 text-primary fw-bold">
                {podcast.price === 0 ? 'Free' : `PKR ${podcast.price.toFixed(2)}`}
              </p>
            </div>

            {/* Stats - Only for Past Podcasts */}
            {podcast.status === 'ended' && (
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="stats-card purchased">
                    <h3>{podcast.purchased || 0}</h3>
                    <small>Tickets Purchased</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="stats-card attended">
                    <h3>{podcast.attended || 0}</h3>
                    <small>Actually Attended</small>
                  </div>
                </div>
              </div>
            )}

            {/* Recording - Only for Past Podcasts */}
            {podcast.status === 'ended' && (
              podcast.hasRecording ? (
                <div className="recording-section">
                  <i className="bi bi-play-circle"></i>
                  <h6>Podcast Recording</h6>
                  <p>Click to start playing the session recording.</p>
                  <button className="btn">
                    <i className="bi bi-play-fill me-2"></i> Play Recording
                  </button>
                </div>
              ) : (
                <div className="no-recording-section">
                  <i className="bi bi-file-earmark-text"></i>
                  <h6>No Recording Available</h6>
                  <p>This session was not recorded.</p>
                </div>
              )
            )}

            {/* Pending Message */}
            {podcast.status === 'pending' && (
              <div className="alert alert-warning mb-0">
                <i className="bi bi-info-circle me-2"></i>
                This podcast is pending admin approval. Once approved, it will appear in the Upcoming section and clients will be able to purchase tickets.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PodcastSummaryModal;