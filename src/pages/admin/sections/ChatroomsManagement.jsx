import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';

const ChatroomsManagement = ({ isModerator = false }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const apiPrefix = isModerator || user?.role === 'moderator' ? '/moderator' : '/admin';
  
  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editChatroomId, setEditChatroomId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({ name: '', description: '' });

  const [toggleChatroomId, setToggleChatroomId] = useState(null);
  const [toggleAction, setToggleAction] = useState(''); 

  useEffect(() => {
    document.title =  "Chatrooms Management | MindComfort";
    fetchChatrooms();
  }, [page, status, search]);

  const fetchChatrooms = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (status !== 'all') query.append('status', status);
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`${apiPrefix}/chatrooms?${query}`);
      setChatrooms(res.data.chatrooms);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching chatrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`${apiPrefix}/chatrooms`, createFormData);
      
      if (res.status === 200 || res.status === 201) {
        alert('Chatroom created successfully!');
        setShowCreateModal(false);
        setCreateFormData({ name: '', description: '' });
        fetchChatrooms();
      }
    } catch (err) {
      console.error('Chatroom creation error:', err.response?.data || err);

      if (err.response?.status === 200 || err.response?.status === 201) {
        alert('Chatroom created successfully!');
        setShowCreateModal(false);
        setCreateFormData({ name: '', description: '' });
        fetchChatrooms();
      } else {
        alert(err.response?.data?.message || err.response?.data?.error || 'Failed to create chatroom');
      }
    }
  };

  const handleEditClick = (chatroom) => {
    setEditChatroomId(chatroom._id);
    setEditFormData({
      name: chatroom.name,
      description: chatroom.description || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`${apiPrefix}/chatrooms/${editChatroomId}`, editFormData);
      alert('Chatroom updated successfully!');
      setEditChatroomId(null);
      fetchChatrooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update chatroom');
    }
  };

  const closeEditModal = () => {
    setEditChatroomId(null);
  };

  const handleToggleClick = (chatroomId, isCurrentlyActive) => {
    setToggleChatroomId(chatroomId);
    setToggleAction(isCurrentlyActive ? 'disable' : 'enable');
  };

  const handleToggleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`${apiPrefix}/chatrooms/${toggleChatroomId}/toggle-status`);
      setToggleChatroomId(null);
      fetchChatrooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const closeToggleModal = () => {
    setToggleChatroomId(null);
  };

  return (
    <div className="admin-section">
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Chatroom</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateSubmit}>
                <div className="form-group">
                  <label>Chatroom Name</label>
                  <input
                    type="text"
                    placeholder="Enter chatroom name..."
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    rows="4"
                    placeholder="Enter chatroom purpose or topic description..."
                  />
                </div>
                <div className="card-actions" style={{ justifyContent: 'flex-end', marginTop: '15px' }}>
                  <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-create">Create Room</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editChatroomId && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Chatroom</h3>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Chatroom Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows="4"
                    placeholder="Enter a brief description..."
                  />
                </div>
                <div className="card-actions" style={{ justifyContent: 'flex-end', marginTop: '15px' }}>
                  <button type="button" className="btn-cancel" onClick={closeEditModal}>Cancel</button>
                  <button type="submit" className="btn-view">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toggleChatroomId && (
        <div className="modal-overlay" onClick={closeToggleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{toggleAction === 'disable' ? 'Disable' : 'Enable'} Chatroom</h3>
              <button className="modal-close" onClick={closeToggleModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleToggleSubmit}>
                <p>
                  Are you sure you want to <strong>{toggleAction}</strong> this chatroom?
                  {toggleAction === 'disable' && ' Users will no longer be able to access it.'}
                </p>
                <div className="card-actions" style={{ justifyContent: 'flex-end', marginTop: '15px' }}>
                  <button type="button" className="btn-cancel" onClick={closeToggleModal}>Cancel</button>
                  <button 
                    type="submit" 
                    className={toggleAction === 'disable' ? 'btn-suspend' : 'btn-unsuspend'}
                  >
                    Confirm {toggleAction === 'disable' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="section-header">
        <h2>Chatrooms Management</h2>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          Create Chatroom
        </button>
      </div>

      <div className="search-filter">
        <input
          type="text"
          placeholder="Search chatroom by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">All Chatrooms</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="chatrooms-grid">
        {loading ? (
          <div className="loading">Loading chatrooms...</div>
        ) : chatrooms.length === 0 ? (
          <div className="empty-state">No chatrooms found</div>
        ) : (
          chatrooms.map(room => (
            <div key={room._id} className="chatroom-card">
              <div className="card-header">
                <div className="avatar-circle" style={{ background: '#6c757d' }}>
                  <i className="bi bi-chat-dots-fill" style={{ color: 'white', fontSize: '1.2rem' }}></i>
                </div>
                <div className="room-info">
                  <h4>{room.name}</h4>
                  <p title={room.description}>{room.description || 'No description'}</p>
                </div>
                <span className={`status-badge ${room.isActive ? 'active' : 'suspended'}`}>
                  {room.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="card-actions">
                <button className="btn-view" onClick={() => handleEditClick(room)}>
                  <i className="bi bi-pencil-fill"></i> Edit
                </button>
                {room.isActive ? (
                  <button className="btn-suspend" onClick={() => handleToggleClick(room._id, true)}>
                    <i className="bi bi-lock-fill"></i> Disable
                  </button>
                ) : (
                  <button className="btn-unsuspend" onClick={() => handleToggleClick(room._id, false)}>
                    <i className="bi bi-unlock-fill"></i> Enable
                  </button>
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
    </div>
  );
};

export default ChatroomsManagement;