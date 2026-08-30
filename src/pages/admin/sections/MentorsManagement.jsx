import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';

const MentorsManagement = () => {
  const [mentors, setMentors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [tab, setTab] = useState('mentors');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentorDetails, setMentorDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [suspendUserId, setSuspendUserId] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  const [unsuspendUserId, setUnsuspendUserId] = useState(null);

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showFullCoverLetter, setShowFullCoverLetter] = useState(false);

  useEffect(() => {
    document.title = "Mentors Management | MindComfort";
    if (tab === 'mentors') {
      fetchMentors();
    } else {
      fetchApplications();
    }
  }, [page, status, search, tab]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (status !== 'all') query.append('status', status);
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`/admin/mentors?${query}`);
      setMentors(res.data.mentors);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`/admin/applications/pending?${query}`);
      setApplications(res.data.applications);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendClick = (mentorId) => {
    setSuspendUserId(mentorId);
    setSuspendReason('');
  };

  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    if (!suspendUserId) return;
    try {
      await api.patch(`/admin/mentors/${suspendUserId}/suspend`, { reason: suspendReason });
      setSuspendUserId(null);
      setSuspendReason('');
      fetchMentors();
    } catch (err) {
      console.error('Error suspending mentor:', err);
      alert('Failed to suspend mentor');
    }
  };

  const handleUnsuspendClick = (mentorId) => {
    setUnsuspendUserId(mentorId);
  };

  const handleUnsuspendSubmit = async (e) => {
    e.preventDefault();
    if (!unsuspendUserId) return;
    try {
      await api.patch(`/admin/mentors/${unsuspendUserId}/unsuspend`, {});
      setUnsuspendUserId(null);
      fetchMentors();
    } catch (err) {
      console.error('Error unsuspending mentor:', err);
      alert('Failed to unsuspend mentor');
    }
  };

  const handleApprove = async (applicationId) => {
    if (window.confirm('Approve this mentor application?')) {
      try {
        await api.patch(`/admin/applications/${applicationId}/approve`, {});
        fetchApplications();
        alert('Mentor approved successfully!');
      } catch (err) {
        console.error('Error approving application:', err);
        alert('Failed to approve application');
      }
    }
  };

  const handleReject = async (applicationId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason) {
      try {
        await api.patch(`/admin/applications/${applicationId}/reject`, { reason });
        fetchApplications();
        alert('Application rejected');
      } catch (err) {
        console.error('Error rejecting application:', err);
        alert('Failed to reject application');
      }
    }
  };

  const handleViewDetails = async (mentorId) => {
    try {
      setDetailsLoading(true);
      setSelectedMentor(mentorId);
      const res = await api.get(`/admin/mentors/${mentorId}`);
      setMentorDetails(res.data);
    } catch (err) {
      console.error('Error fetching mentor details:', err);
      alert('Failed to load mentor details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedMentor(null);
    setMentorDetails(null);
  };

  const closeSuspendModal = () => {
    setSuspendUserId(null);
    setSuspendReason('');
  };

  const closeUnsuspendModal = () => {
    setUnsuspendUserId(null);
  };

  const closeApplicationModal = () => {
    setSelectedApplication(null);
  };

  const getFileName = (path) => {
    if (!path) return 'Not uploaded';
    return path.split('/').pop();
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Mentors Management</h2>
        <div className="tab-buttons">
          <button className={`tab-btn ${tab === 'mentors' ? 'active' : ''}`} onClick={() => { setTab('mentors'); setPage(1); }}>
            All Mentors
          </button>
          <button className={`tab-btn ${tab === 'applications' ? 'active' : ''}`} onClick={() => { setTab('applications'); setPage(1); }}>
            Applications ({applications.length})
          </button>
        </div>
      </div>

      {tab === 'mentors' ? (
        <>
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search mentor by name, email, or ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">All Mentors</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="mentors-grid">
            {loading ? (
              <div className="loading">Loading mentors...</div>
            ) : mentors.length === 0 ? (
              <div className="empty-state">No mentors found</div>
            ) : (
              mentors.map(mentor => (
                <div key={mentor._id} className="mentor-card">
                  <div className="card-header">
                    <div className="avatar-circle">{mentor.username.charAt(0).toUpperCase()}</div>
                    <div className="mentor-info">
                      <h4>{mentor.username}</h4>
                      <p title={mentor.email}>{mentor.email}</p>
                      <small>
                        Application: <strong>
                          {mentor.status === 'not_submitted' || !mentor.status
                            ? 'Not Submitted'
                            : mentor.status.charAt(0).toUpperCase() + mentor.status.slice(1)}
                        </strong>
                      </small>
                  </div>
                    {mentor.status !== 'pending' && (
                      <span className={`status-badge ${mentor.isSuspended ? 'suspended' : 'active'}`}>
                        {mentor.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    )}
                  </div>
                  <div className="card-actions">
                    <button className="btn-view" onClick={() => handleViewDetails(mentor._id)}>View Details</button>
                    {mentor.isSuspended ? (
                      <button className="btn-unsuspend" onClick={() => handleUnsuspendClick(mentor._id)}>Unsuspend</button>
                    ) : mentor.status !== 'pending' ? (
                      <button className="btn-suspend" onClick={() => handleSuspendClick(mentor._id)}>Suspend</button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search application..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="applications-list">
            {loading ? (
              <div className="loading">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="empty-state">No pending applications</div>
            ) : (
              applications.map(app => (
                <div key={app._id} className="application-item">
                  <div className="app-info">
                    <h4>{app.fullName || app.mentorId?.username}</h4>
                    <p>{app.mentorId?.email}</p>
                    <small>Applied: {new Date(app.createdAt).toLocaleDateString()}</small>
                  </div>
                  <div className="app-actions">
                    <button className="btn-view" onClick={() => setSelectedApplication(app)}>View Details</button>
                    <button className="btn-approve" onClick={() => handleApprove(app._id)}>Approve</button>
                    <button className="btn-reject" onClick={() => handleReject(app._id)}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {total > 20 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</button>
        </div>
      )}

      {selectedMentor && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mentor Profile Details</h3>
              <button className="modal-close" onClick={closeDetails}>×</button>
            </div>
            <div className="modal-body">
              {detailsLoading ? (
                <p>Loading details...</p>
              ) : mentorDetails ? (
                <div className="profile-details-grid">
                  <div className="detail-row">
                    <label>Username</label>
                    <span>{selectedApplication.fullName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{mentorDetails.mentor.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>User ID</label>
                    <span className="id-text">{mentorDetails.mentor._id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Join Date</label>
                    <span>{new Date(mentorDetails.mentor.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Account Status</label>
                    <span className={`status-badge ${mentorDetails.mentor.isSuspended ? 'suspended' : 'active'}`}>
                      {mentorDetails.mentor.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Application Status</label>
                    <span>{mentorDetails.mentor.status}</span>
                  </div>
                  {mentorDetails.profile && (
                    <>
                      <div className="detail-item full-width">
                        <label>Full Name</label>
                        <span>{mentorDetails.profile.fullName}</span>
                      </div>
                      <div className="detail-item full-width">
                        <label>Qualification</label>
                        <span>{mentorDetails.profile.qualification}</span>
                      </div>
                      <div className="detail-item full-width">
                        <label>Expertise</label>
                        <span>{mentorDetails.profile.expertise}</span>
                      </div>
                      <div className="detail-item full-width">
                        <label>Experience</label>
                        <span>{mentorDetails.profile.experience}</span>
                      </div>
                      {mentorDetails.profile.availabilitySchedule && mentorDetails.profile.availabilitySchedule.length > 0 && (
                        <div className="detail-item full-width">
                          <label>Availability Schedule</label>
                          <div className="availability-list">
                            {mentorDetails.profile.availabilitySchedule.map((slot, idx) => (
                              <div key={slot._id || idx} className="availability-item">
                                {slot.day && (
                                  <span className="slot-day">{slot.day}{slot.endDay ? ` - ${slot.endDay}` : ''}</span>
                                )}
                                {slot.date && (
                                  <span className="slot-date">
                                    {new Date(slot.date).toLocaleDateString()}
                                    {slot.endDate ? ` - ${new Date(slot.endDate).toLocaleDateString()}` : ''}
                                  </span>
                                )}
                                <span className="slot-time">{slot.startTime} - {slot.endTime}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p>Failed to load details.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="modal-overlay" onClick={closeApplicationModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mentor Application Details</h3>
              <button className="modal-close" onClick={closeApplicationModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="application-detail-grid">
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-row">
                    <label>Full Name</label>
                    <span>{selectedApplication.fullName || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Email</label>
                    <span>{selectedApplication.mentorId?.email || 'Not available'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Username</label>
                    <span>{selectedApplication.fullName}</span>
                  </div>
                  <div className="detail-row">
                    <label>Applied On</label>
                    <span>{new Date(selectedApplication.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Professional Information</h4>
                  <div className="detail-row">
                    <label>Qualification</label>
                    <span>
                      {Array.isArray(selectedApplication.qualification) 
                        ? selectedApplication.qualification.join(', ') 
                        : selectedApplication.qualification || 'Not provided'}
                    </span>
                  </div>
                  {selectedApplication.qualificationOther && (
                    <div className="detail-row">
                      <label>Other Qualification</label>
                      <span>{selectedApplication.qualificationOther}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <label>Experience</label>
                    <span>{selectedApplication.experience || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Expertise</label>
                    <span>
                      {Array.isArray(selectedApplication.expertise) 
                        ? selectedApplication.expertise.join(', ') 
                        : selectedApplication.expertise || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Uploaded Documents</h4>
                  <div className="document-item">
                    <label>
                      Required Documents
                      <small style={{fontWeight: 'normal', color: '#6c757d', display: 'block'}}>
                        (CNIC, Education, Experience, Photo)
                      </small>
                    </label>
                      {selectedApplication.documents?.document ? (
                        <a 
                          href={`${api.defaults.baseURL || ''}/admin/mentors/document-proxy?key=${encodeURIComponent(selectedApplication.documents.document)}&token=${localStorage.getItem('token')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="document-link"
                          style={{ wordBreak: 'break-all' }}
                        >
                          View Required Documents ({getFileName(selectedApplication.documents.document)})
                        </a>
                      ) : (
                        <span className="text-muted">Not uploaded</span>
                      )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Cover Letter</h4>
                  {selectedApplication.documents?.coverLetter ? (
                    <div className="cover-letter-box">
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {showFullCoverLetter || selectedApplication.documents.coverLetter.length <= 150
                          ? selectedApplication.documents.coverLetter
                          : `${selectedApplication.documents.coverLetter.substring(0, 150)}... `}
                        {selectedApplication.documents.coverLetter.length > 150 && (
                          <button 
                            className="btn btn-link p-0 ms-1" 
                            style={{ fontSize: '0.875rem', textDecoration: 'none' }}
                            onClick={() => setShowFullCoverLetter(!showFullCoverLetter)}
                          >
                            {showFullCoverLetter ? 'Read Less' : 'Read More'}
                          </button>
                        )}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted">No cover letter provided</span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={closeApplicationModal}>Close</button>
                <button className="btn-approve" onClick={() => handleApprove(selectedApplication._id)}>
                  Approve
                </button>
                <button className="btn-reject" onClick={() => handleReject(selectedApplication._id)}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {suspendUserId && (
        <div className="modal-overlay" onClick={closeSuspendModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Suspend Mentor</h3>
              <button className="modal-close" onClick={closeSuspendModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSuspendSubmit}>
                <p>Are you sure you want to suspend this mentor?</p>
                <div className="form-group">
                  <label>Reason (Optional)</label>
                  <textarea 
                    value={suspendReason} 
                    onChange={(e) => setSuspendReason(e.target.value)} 
                    rows="3" 
                    placeholder="Enter reason for suspension..."
                  />
                </div>
                <div className="card-actions" style={{justifyContent: 'flex-end', marginTop: '15px'}}>
                  <button type="button" className="btn-cancel" onClick={closeSuspendModal}>Cancel</button>
                  <button type="submit" className="btn-suspend">Confirm Suspend</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {unsuspendUserId && (
        <div className="modal-overlay" onClick={closeUnsuspendModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Unsuspend Mentor</h3>
              <button className="modal-close" onClick={closeUnsuspendModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUnsuspendSubmit}>
                <p>Are you sure you want to unsuspend this mentor? They will regain full access to their account.</p>
                <div className="card-actions" style={{justifyContent: 'flex-end', marginTop: '15px'}}>
                  <button type="button" className="btn-cancel" onClick={closeUnsuspendModal}>Cancel</button>
                  <button type="submit" className="btn-unsuspend">Confirm Unsuspend</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorsManagement;