import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'chat',
    price: '',
    durationMonths: 1,
    features: '',
    displayOrder: 0
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || plan.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleOpenModal = (plan = null) => {
    setError('');
    setSuccess('');
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        type: plan.type,
        price: plan.price,
        durationMonths: plan.durationMonths,
        features: plan.features ? plan.features.join('\n') : '',
        displayOrder: plan.displayOrder || 0
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        type: 'chat',
        price: '',
        durationMonths: 1,
        features: '',
        displayOrder: 0
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...formData,
      price: Number(formData.price),
      durationMonths: Number(formData.durationMonths),
      displayOrder: Number(formData.displayOrder),
      features: formData.features.split('\n').filter(f => f.trim() !== '')
    };

    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan._id}`, payload);
        setSuccess('Plan updated successfully');
      } else {
        await api.post('/plans', payload);
        setSuccess('Plan created successfully');
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const toggleStatus = async (plan) => {
    try {
      const endpoint = plan.isActive ? `/plans/${plan._id}/deactivate` : `/plans/${plan._id}/reactivate`;
      await api.put(endpoint);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update plan status');
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Plans Management</h2>
        <button className="btn-create" onClick={() => handleOpenModal()}>
          + Create New Plan
        </button>
      </div>

      <div className="search-filter">
        <input 
          type="text" 
          placeholder="Search plans by name or description..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Module Types</option>
          <option value="chat">Chat Only</option>
          <option value="podcast">Podcast Only</option>
          <option value="both">Both (All Access)</option>
        </select>
      </div>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      {loading ? (
        <div className="empty-state">Loading plans...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="empty-state">No plans match your search or filter.</div>
      ) : (
        <div className="clients-grid">
          {filteredPlans.map((plan) => (
            <div key={plan._id} className="client-card">
              <div className="card-header">
                <div>
                  <h4>{plan.name}</h4>
                  <span className={`status-badge ${plan.isActive ? 'status-active' : 'status-suspended'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="type-badge">{plan.type}</span>
              </div>

              <div className="card-body">
                <p><strong>Price:</strong> PKR {plan.price.toLocaleString()}</p>
                <p><strong>Duration:</strong> {plan.durationMonths} Month(s)</p>
                {plan.description && <p className="description">{plan.description}</p>}
                
                {plan.features?.length > 0 && (
                  <ul style={{ paddingLeft: '18px', marginTop: '8px', fontSize: '0.85rem' }}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card-actions">
                <button className="btn-edit btn-view" onClick={() => handleOpenModal(plan)}>
                  Edit
                </button>
                <button 
                  className={plan.isActive ? 'btn-delete' : 'btn-approve'} 
                  onClick={() => toggleStatus(plan)}
                >
                  {plan.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Plan Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Module Type</label>
                    <select 
                      value={formData.type} 
                      disabled={!!editingPlan}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="chat">Chat Only</option>
                      <option value="podcast">Podcast Only</option>
                      <option value="both">Both (All Access)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price (PKR)</label>
                    <input 
                      type="number" 
                      min="0"
                      required 
                      value={formData.price} 
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Duration (Months)</label>
                    <input 
                      type="number" 
                      min="1"
                      required 
                      value={formData.durationMonths} 
                      onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Display Order</label>
                    <input 
                      type="number" 
                      value={formData.displayOrder} 
                      onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>Features</label>
                  <textarea 
                    rows="3"
                    placeholder="Unlimited chat rooms&#10;24/7 Access"
                    value={formData.features} 
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">{editingPlan ? 'Save Changes' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManagement;