import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';

const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [transactionIdSearch, setTransactionIdSearch] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    document.title = "Subscriptions Management | MindComfort";
    fetchSubscriptions();
  }, [page, typeFilter, statusFilter]);

  const openEditModal = async (subscription) => {
    try {
      setSelectedSubscription(subscription);
      setEditFormData({
        status: subscription.status,
        endDate: subscription.endDate ? subscription.endDate.split('T')[0] : '',
        overrideNotes: subscription.overrideNotes || ''
      });
      
      if (subscription.paymentId?._id) {
        try {
          const res = await api.get(`/admin/subscriptions/payments/${subscription.paymentId._id}`);
          setPaymentDetails(res.data);
        } catch (err) {
          console.error('Failed to fetch payment details:', err);
        }
      }
      
      setShowEditModal(true);
    } catch (err) {
      console.error('Error opening edit modal:', err);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedSubscription(null);
    setEditFormData({});
    setPaymentDetails(null);
    setTransactionIdSearch('');
    setMessage({ type: '', text: '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchPaymentByTransactionId = async () => {
    if (!transactionIdSearch.trim()) {
      setMessage({ type: 'error', text: 'Please enter a transaction ID' });
      return;
    }

    try {
      setEditLoading(true);
      const res = await api.get(`/admin/subscriptions/payments/${transactionIdSearch}`);
      const payment = res.data;
      
      if (payment) {
        setPaymentDetails(payment);
        setMessage({ type: 'success', text: `Payment found: ${payment.status}` });
        
        if (payment.status === 'completed') {
          setEditFormData(prev => ({
            ...prev,
            status: 'active'
          }));
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Payment not found' });
      setPaymentDetails(null);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedSubscription) return;

    try {
      setEditLoading(true);
      const updateData = {
        status: editFormData.status,
        endDate: editFormData.endDate ? new Date(editFormData.endDate).toISOString() : undefined,
        planDurationMonths: editFormData.planDurationMonths || selectedSubscription.planDurationMonths,
        notes: editFormData.overrideNotes
      };

      const res = await api.put(`/admin/subscriptions/${selectedSubscription._id}`, updateData);
      
      setMessage({ type: 'success', text: 'Subscription updated successfully' });
      
      setTimeout(() => {
        fetchSubscriptions();
        closeEditModal();
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update subscription' });
    } finally {
      setEditLoading(false);
    }
  };

  const linkPaymentToSubscription = async () => {
    if (!selectedSubscription || !paymentDetails) return;

    try {
      setEditLoading(true);
      await api.post('/admin/link-payment', {
        subscriptionId: selectedSubscription._id,
        paymentId: paymentDetails._id
      });

      setMessage({ type: 'success', text: 'Payment linked successfully' });
      
      // Refresh subscription details
      setTimeout(() => {
        fetchSubscriptions();
        closeEditModal();
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to link payment' });
    } finally {
      setEditLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (typeFilter !== 'all') query.append('type', typeFilter);
      if (statusFilter !== 'all') query.append('status', statusFilter);
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`/admin/subscriptions?${query}`);
      setSubscriptions(res.data.subscriptions || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (sub.userId?.username && sub.userId.username.toLowerCase().includes(search)) ||
      (sub.userId?.email && sub.userId.email.toLowerCase().includes(search)) ||
      (sub.planName && sub.planName.toLowerCase().includes(search))
    );
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'expired': return 'status-expired';
      case 'suspended': return 'status-suspended';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const getPaymentStatusBadgeClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'completed': return 'payment-completed';
      case 'pending': return 'payment-pending';
      case 'failed': return 'payment-failed';
      default: return 'payment-default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Subscriptions Management</h2>
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by user, plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="all">All Types</option>
            <option value="chat">Chat</option>
            <option value="podcast">Podcast</option>
            <option value="both">Both</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading subscriptions...</div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="empty-state">No subscriptions found</div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub._id} onClick={() => openEditModal(sub)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {(sub.userId?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="user-name">{sub.userId?.username || 'Unknown'}</div>
                          <small className="user-email">{sub.userId?.email || ''}</small>
                        </div>
                      </div>
                    </td>
                    <td>{sub.planName || 'N/A'}</td>
                    <td>
                      <span className="type-badge">{sub.type?.toUpperCase() || 'N/A'}</span>
                    </td>
                    <td>PKR {sub.planPrice?.toLocaleString() || '0'}</td>
                    <td>{sub.planDurationMonths ? `${sub.planDurationMonths} month(s)` : 'N/A'}</td>
                    <td>{formatDate(sub.startDate)}</td>
                    <td>{formatDate(sub.endDate)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(sub.status)}`}>
                        {sub.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`payment-badge ${getPaymentStatusBadgeClass(sub.paymentStatus)}`}>
                        {sub.paymentStatus || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showEditModal && selectedSubscription && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Subscription</h3>
              <button className="close-btn" onClick={closeEditModal}>&times;</button>
            </div>

            {message.text && (
              <div className={`message-alert ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="modal-body">
              <div className="form-section">
                <h4>Subscription Details</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>User</label>
                    <input 
                      type="text" 
                      value={selectedSubscription.userId?.username || 'N/A'} 
                      disabled 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="text" 
                      value={selectedSubscription.userId?.email || 'N/A'} 
                      disabled 
                    />
                  </div>
                  <div className="form-group">
                    <label>Plan</label>
                    <input 
                      type="text" 
                      value={selectedSubscription.planName || 'N/A'} 
                      disabled 
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <input 
                      type="text" 
                      value={selectedSubscription.type?.toUpperCase() || 'N/A'} 
                      disabled 
                    />
                  </div>
                  <div className="form-group">
                    <label>Price</label>
                    <input 
                      type="text" 
                      value={`PKR ${selectedSubscription.planPrice?.toLocaleString() || '0'}`} 
                      disabled 
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input 
                      type="text" 
                      value={`${selectedSubscription.planDurationMonths || 0} month(s)`} 
                      disabled 
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input 
                      type="text" 
                      value={formatDate(selectedSubscription.startDate)} 
                      disabled 
                    />
                  </div>
                </div>
              </div>

              {!selectedSubscription.paymentId?._id && (
                <div className="form-section">
                  <h4>Search Payment by Transaction ID</h4>
                  <div className="search-payment">
                    <input 
                      type="text" 
                      placeholder="Enter transaction ID"
                      value={transactionIdSearch}
                      onChange={(e) => setTransactionIdSearch(e.target.value)}
                    />
                    <button 
                      onClick={searchPaymentByTransactionId}
                      disabled={editLoading}
                    >
                      {editLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              )}

              {(paymentDetails || selectedSubscription.paymentId?._id) && (
                <div className="form-section payment-section">
                  <h4>Payment Details</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Transaction ID</label>
                      <input 
                        type="text" 
                        value={(paymentDetails?.transactionId || selectedSubscription.paymentId?.transactionId) || 'N/A'} 
                        disabled 
                      />
                    </div>
                    <div className="form-group">
                      <label>Amount</label>
                      <input 
                        type="text" 
                        value={`${(paymentDetails?.currency || selectedSubscription.paymentId?.currency) || 'PKR'} ${(paymentDetails?.amount || selectedSubscription.paymentId?.amount)?.toLocaleString() || '0'}`} 
                        disabled 
                      />
                    </div>
                    <div className="form-group">
                      <label>Payment Status</label>
                      <input 
                        type="text" 
                        value={(paymentDetails?.status || selectedSubscription.paymentId?.status)?.toUpperCase() || 'N/A'} 
                        disabled 
                      />
                    </div>
                    <div className="form-group">
                      <label>Payment Method</label>
                      <input 
                        type="text" 
                        value={(paymentDetails?.paymentMethod || selectedSubscription.paymentId?.paymentMethod)?.toUpperCase() || 'N/A'} 
                        disabled 
                      />
                    </div>
                  </div>
                  {paymentDetails && selectedSubscription.paymentId?._id !== paymentDetails._id && (
                    <button 
                      className="btn-link-payment"
                      onClick={linkPaymentToSubscription}
                      disabled={editLoading}
                    >
                      {editLoading ? 'Linking...' : 'Link This Payment to Subscription'}
                    </button>
                  )}
                </div>
              )}

              <div className="form-section">
                <h4>Update Subscription Status</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      name="status"
                      value={editFormData.status || selectedSubscription.status}
                      onChange={handleEditChange}
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input 
                      type="date"
                      name="endDate"
                      value={editFormData.endDate || (selectedSubscription.endDate ? selectedSubscription.endDate.split('T')[0] : '')}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Override Notes</label>
                  <textarea 
                    name="overrideNotes"
                    value={editFormData.overrideNotes || ''}
                    onChange={handleEditChange}
                    placeholder="Add notes about this status update..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={closeEditModal}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-submit"
                onClick={handleSubmitEdit}
                disabled={editLoading}
              >
                {editLoading ? 'Updating...' : 'Update Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsManagement;