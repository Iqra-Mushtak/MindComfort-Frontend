import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';

const ModeratorsManagement = () => {
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [suspendUserId, setSuspendUserId] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [unsuspendUserId, setUnsuspendUserId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newModerator, setNewModerator] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    document.title = "Moderators Management | MindComfort";
    fetchModerators();
  }, [page, status, search]);

  const fetchModerators = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (status !== 'all') query.append('status', status);
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`/admin/moderators?${query}`);
      setModerators(res.data.moderators);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching moderators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendClick = (modId) => {
    setSuspendUserId(modId);
    setSuspendReason('');
  };

  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    if (!suspendUserId) return;
    try {
      await api.patch(`/admin/moderators/${suspendUserId}/suspend`, { reason: suspendReason });
      setSuspendUserId(null);
      setSuspendReason('');
      fetchModerators();
    } catch (err) {
      console.error('Error suspending moderator:', err);
      alert('Failed to suspend moderator');
    }
  };

  const handleUnsuspendClick = (modId) => {
    setUnsuspendUserId(modId);
  };

  const handleUnsuspendSubmit = async (e) => {
    e.preventDefault();
    if (!unsuspendUserId) return;
    try {
      await api.patch(`/admin/moderators/${unsuspendUserId}/unsuspend`, {});
      setUnsuspendUserId(null);
      fetchModerators();
    } catch (err) {
      console.error('Error unsuspending moderator:', err);
      alert('Failed to unsuspend moderator');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/moderators', newModerator);
      alert('Moderator created successfully!');
      setNewModerator({ username: '', email: '', password: '' });
      setShowCreateForm(false);
      fetchModerators();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create moderator');
    }
  };

  const closeSuspendModal = () => { setSuspendUserId(null); setSuspendReason(''); };
  const closeUnsuspendModal = () => { setUnsuspendUserId(null); };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Moderators Management</h2>
        <button className="btn-create" onClick={() => setShowCreateForm(!showCreateForm)}>
          Create Moderator
        </button>
      </div>

      {showCreateForm && (
        <div className="create-moderator-card">
          <div className="form-header">
            <h3><i className="bi bi-person-plus-fill"></i> Create New Moderator</h3>
            <button type="button" className="btn-close-form" onClick={() => setShowCreateForm(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <form onSubmit={handleCreate} className="create-form">
            <div className="create-form-grid">
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="Enter Name" value={newModerator.username} onChange={(e) => setNewModerator({...newModerator, username: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="Enter email address" value={newModerator.email} onChange={(e) => setNewModerator({...newModerator, email: e.target.value})} required />
              </div>
              <div className="form-group full-width">
                <label>Password</label>
                <input type="password" placeholder="Enter a strong password" value={newModerator.password} onChange={(e) => setNewModerator({...newModerator, password: e.target.value})} required />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel-action" onClick={() => setShowCreateForm(false)}>Cancel</button>
              <button type="submit" className="btn-submit-action">Create Moderator</button>
            </div>
          </form>
        </div>
      )}

      <div className="search-filter">
        <input
          type="text"
          placeholder="Search moderator by name, email, or ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">All Moderators</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="moderators-grid">
        {loading ? (
          <div className="loading">Loading moderators...</div>
        ) : moderators.length === 0 ? (
          <div className="empty-state">No moderators found</div>
        ) : (
          moderators.map(mod => (
            <div key={mod._id} className="moderator-card">
              <div className="card-header">
                <div className="avatar-circle">{mod.username.charAt(0).toUpperCase()}</div>
                <div className="mod-info">
                  <h4>{mod.username}</h4>
                  <p title={mod.email}>{mod.email}</p>
                </div>
                <span className={`status-badge ${mod.isSuspended ? 'suspended' : 'active'}`}>
                  {mod.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </div>
              <div className="card-actions">
                {mod.isSuspended ? (
                  <button className="btn-unsuspend" onClick={() => handleUnsuspendClick(mod._id)}>Unsuspend</button>
                ) : (
                  <button className="btn-suspend" onClick={() => handleSuspendClick(mod._id)}>Suspend</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {total > 20 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</button>
        </div>
      )}

      {suspendUserId && (
        <div className="modal-overlay" onClick={closeSuspendModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Suspend Moderator</h3>
              <button className="modal-close" onClick={closeSuspendModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSuspendSubmit}>
                <p>Are you sure you want to suspend this moderator?</p>
                <div className="form-group">
                  <label>Reason (Optional)</label>
                  <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows="3" placeholder="Enter reason for suspension..." />
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
              <h3>Unsuspend Moderator</h3>
              <button className="modal-close" onClick={closeUnsuspendModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUnsuspendSubmit}>
                <p>Are you sure you want to unsuspend this moderator? They will regain full access to their account.</p>
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

export default ModeratorsManagement;