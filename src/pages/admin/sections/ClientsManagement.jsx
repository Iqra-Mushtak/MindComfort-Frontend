import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';

const ClientsManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [suspendUserId, setSuspendUserId] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  const [unsuspendUserId, setUnsuspendUserId] = useState(null);

  useEffect(() => {
    fetchClients();
  }, [page, status, search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (status !== 'all') query.append('status', status);
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`/admin/clients?${query}`);
      setClients(res.data.clients);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendClick = (clientId) => {
    setSuspendUserId(clientId);
    setSuspendReason('');
  };

  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    if (!suspendUserId) return;
    try {
      await api.patch(`/admin/clients/${suspendUserId}/suspend`, { reason: suspendReason });
      setSuspendUserId(null);
      setSuspendReason('');
      fetchClients();
    } catch (err) {
      console.error('Error suspending client:', err);
      alert('Failed to suspend client');
    }
  };

  const handleUnsuspendClick = (clientId) => {
    setUnsuspendUserId(clientId);
  };

  const handleUnsuspendSubmit = async (e) => {
    e.preventDefault();
    if (!unsuspendUserId) return;
    try {
      await api.patch(`/admin/clients/${unsuspendUserId}/unsuspend`, {});
      setUnsuspendUserId(null);
      fetchClients();
    } catch (err) {
      console.error('Error unsuspending client:', err);
      alert('Failed to unsuspend client');
    }
  };

  const handleViewDetails = async (clientId) => {
    try {
      setDetailsLoading(true);
      setSelectedClient(clientId);
      const res = await api.get(`/admin/clients/${clientId}`);
      setClientDetails(res.data);
    } catch (err) {
      console.error('Error fetching client details:', err);
      alert('Failed to load client details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedClient(null);
    setClientDetails(null);
  };

  const closeSuspendModal = () => {
    setSuspendUserId(null);
    setSuspendReason('');
  };

  const closeUnsuspendModal = () => {
    setUnsuspendUserId(null);
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Clients Management</h2>
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search client by name, email or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="clients-grid">
        {loading ? (
          <div className="loading">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">No clients found</div>
        ) : (
          clients.map(client => (
            <div key={client._id} className="client-card">
              <div className="card-header">
                <div className="avatar-circle">{client.username.charAt(0).toUpperCase()}</div>
                <div className="client-info">
                  <h4>{client.username}</h4>
                  <p title={client.email}>{client.email}</p>
                  <small>{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : ''}</small>
                </div>
                <span className={`status-badge ${client.isSuspended ? 'suspended' : 'active'}`}>
                  {client.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </div>
              <div className="card-body">
                <p>Subscription: {client.isSubscribed ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="card-actions">
                <button className="btn-view" onClick={() => handleViewDetails(client._id)}>
                  View Details
                </button>
                {client.isSuspended ? (
                  <button className="btn-unsuspend" onClick={() => handleUnsuspendClick(client._id)}>Unsuspend</button>
                ) : (
                  <button className="btn-suspend" onClick={() => handleSuspendClick(client._id)}>Suspend</button>
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

      {selectedClient && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Client Profile Details</h3>
              <button className="modal-close" onClick={closeDetails}>×</button>
            </div>
            <div className="modal-body">
              {detailsLoading ? (
                <p>Loading details...</p>
              ) : clientDetails ? (
                <div className="profile-details-grid">
                  <div className="detail-item">
                    <label>Username</label>
                    <span>{clientDetails.client.username}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{clientDetails.client.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>User ID</label>
                    <span className="id-text">{clientDetails.client._id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Join Date</label>
                    <span>{new Date(clientDetails.client.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Account Status</label>
                    <span className={clientDetails.client.isSuspended ? 'text-danger' : 'text-success'}>
                      {clientDetails.client.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                  
                  <div className="detail-item full-width">
                    <label>Subscription History</label>
                    {clientDetails.subscriptions && clientDetails.subscriptions.length > 0 ? (
                      <div className="subscription-list">
                        {clientDetails.subscriptions.map((sub) => (
                          <div key={sub._id} className={`sub-item ${sub.status}`}>
                            <strong>{sub.planName || 'Unknown Plan'}</strong>
                            <span className="sub-type">{sub.type}</span>
                            <span className={`sub-status ${sub.status}`}>{sub.status}</span>
                            <small>
                              {new Date(sub.startDate).toLocaleDateString()} - 
                              {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Ongoing'}
                            </small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>No subscription history found.</span>
                    )}
                  </div>
                </div>
              ) : (
                <p>Failed to load details.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {suspendUserId && (
        <div className="modal-overlay" onClick={closeSuspendModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Suspend Client</h3>
              <button className="modal-close" onClick={closeSuspendModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSuspendSubmit}>
                <p>Are you sure you want to suspend this client?</p>
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
              <h3>Unsuspend Client</h3>
              <button className="modal-close" onClick={closeUnsuspendModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUnsuspendSubmit}>
                <p>Are you sure you want to unsuspend this client? They will regain full access to their account.</p>
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

export default ClientsManagement;