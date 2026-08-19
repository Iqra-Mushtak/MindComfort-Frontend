import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import './Profile.css';
import logoImg from '../../assets/logo.png';

const EditProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'mentor';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [mentorData, setMentorData] = useState({ fullName: '', qualification: '', expertise: '', experience: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [emailStep, setEmailStep] = useState(1);
  const [emailData, setEmailData] = useState({ currentEmail: '', newEmail: '', otp: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  const [slots, setSlots] = useState([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotData, setSlotData] = useState({ day: '', endDay: '', date: '', endDate: '', startTime: '09:00', endTime: '12:00' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!token || !userData) { navigate('/login'); return; }
    
    fetchProfile(userData.id || userData._id);
  }, [navigate]);

  const fetchProfile = async (userId) => {
    try {
      const response = await api.get(`/profile/${userId}`);
      setUser(response.data.user);
      if (response.data.mentorProfile) {
        setMentorData({
          fullName: response.data.mentorProfile.fullName || '',
          qualification: response.data.mentorProfile.qualification || '',
          expertise: response.data.mentorProfile.expertise || '',
          experience: response.data.mentorProfile.experience || ''
        });
        setSlots(response.data.mentorProfile.availabilitySchedule || []);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleMentorSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/profile/mentor/${user.id}`, mentorData);
      alert('Mentor profile updated successfully!');
      navigate(`/${user.role}/profile`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert('New passwords do not match!');
    }
    try {
      await api.put(`/profile/change-password/${user.id}`, passwordData);
      alert('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      navigate(`/${user.role}/profile`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleEmailStep1 = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.post(`/profile/${user.id}/change-email/initiate`, { currentEmail: emailData.currentEmail });
      alert('OTP sent to your current email.');
      setEmailStep(2);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailStep2 = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.post(`/profile/${user.id}/change-email/verify-current`, { otp: emailData.otp });
      alert('Current email verified. Please enter your new email.');
      setEmailStep(3);
      setEmailData({ ...emailData, otp: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailStep3 = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.post(`/profile/${user.id}/change-email/set-new`, { newEmail: emailData.newEmail });
      alert('OTP sent to your new email.');
      setEmailStep(4);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set new email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailStep4 = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.post(`/profile/${user.id}/change-email/verify-new`, { otp: emailData.otp, newEmail: emailData.newEmail });
      alert('Email updated successfully! Please login again.');
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify new email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSlotChange = (e) => {
    setSlotData({ ...slotData, [e.target.name]: e.target.value });
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    
    if (!slotData.day && !slotData.date) {
      return alert('Please select at least a Day or a specific Date.');
    }

    try {
      const payload = {
        startTime: slotData.startTime,
        endTime: slotData.endTime,
      };

      if (slotData.day) payload.day = slotData.day;
      if (slotData.endDay) payload.endDay = slotData.endDay;
      if (slotData.date) payload.date = slotData.date;
      if (slotData.endDate) payload.endDate = slotData.endDate;

      if (editingSlotId) {
        await api.put(`/profile/mentor/${user.id}/availability/${editingSlotId}`, payload);
        setSlots(slots.map(s => s._id === editingSlotId ? { ...s, ...payload } : s));
        setEditingSlotId(null);
      } else {
        const res = await api.post(`/profile/mentor/${user.id}/availability`, payload);
        setSlots([...slots, res.data.slot]);
      }
      
      setSlotData({ day: '', endDay: '', date: '', endDate: '', startTime: '09:00', endTime: '12:00' });
      setIsAddingSlot(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save slot');
    }
  };

  const handleEditSlot = (slot) => {
    setSlotData({
      day: slot.day || '',
      endDay: slot.endDay || '',
      date: slot.date ? slot.date.split('T')[0] : '',
      endDate: slot.endDate ? slot.endDate.split('T')[0] : '',
      startTime: slot.startTime,
      endTime: slot.endTime
    });
    setEditingSlotId(slot._id);
    setIsAddingSlot(true);
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) return;
    try {
      await api.delete(`/profile/mentor/${user.id}/availability/${slotId}`);
      setSlots(slots.filter(s => s._id !== slotId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete slot');
    }
  };
  
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  const role = user.role || 'client';

  return (
    <div className="profile-container">
      {sidebarOpen && (
        <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to={`/${role}/profile`} style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
            <div className="mc-user-details">
              <h6>{user.username}</h6>
              <small>{role === 'mentor' ? 'Mentor' : 'Client'}</small>
            </div>
          </div>
        </Link>

        <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to={role === 'mentor' ? '/mentor/dashboard' : '/client/dashboard'} className="mc-nav-link">
              <i className="bi bi-house-fill"></i> Home
            </Link>
          </li>

          {role === 'client' && (
            <li className="mc-nav-item">
              <Link to="/client/plans" className="mc-nav-link">
                <i className="bi bi-bookmark-star-fill"></i> Subscription Plans
              </Link>
            </li>
          )}

          <li className="mc-nav-item">
            <Link to="/chatrooms" className="mc-nav-link">
              <i className="bi bi-chat-dots-fill"></i> Community Chat
            </Link>
          </li>

          <li className="mc-nav-item">
            <Link to={role === 'mentor' ? '/mentor/podcasts' : '/client/podcasts'} className="mc-nav-link">
              <i className="bi bi-broadcast-pin"></i> Podcasts
            </Link>
          </li>

          {role === 'client' && (
            <li className="mc-nav-item">
              <Link to="/client/mentors" className="mc-nav-link">
                <i className="bi bi-person-heart"></i> Mentors
              </Link>
            </li>
          )}
        </ul>

        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogoutClick}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="profile-main">
        <div className="mc-main-header">
          <button 
            className="mc-sidebar-toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="mc-notification-btn">
              <i className="bi bi-bell-fill"></i>
              <span className="mc-badge">3</span>
            </button>
            <Link to="/" className="mc-main-logo">MindComfort <img src={logoImg} alt="Logo" /></Link>
          </div>
        </div>

        <div className="profile-header">
          <h2>Edit Profile</h2>
          <Link to={`/${role}/profile`} className="cancel-edit-btn">Cancel</Link>
        </div>

        <div className="edit-tabs">
          {role === 'mentor' && (
            <button className={`tab-btn ${activeTab === 'mentor' ? 'active' : ''}`} onClick={() => setActiveTab('mentor')}>Mentor Details</button>
          )}
          <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>Password</button>
          <button className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`} onClick={() => { setActiveTab('email'); setEmailStep(1); }}>Email</button>
        </div>

        {activeTab === 'mentor' && role === 'mentor' && (
          <form onSubmit={handleMentorSubmit} className="profile-form">
            <div className="profile-section">
              <h3>Mentor Information</h3>
              <div className="form-group"><label>Full Name</label><input type="text" value={mentorData.fullName} onChange={(e) => setMentorData({...mentorData, fullName: e.target.value})} required /></div>
              <div className="form-group"><label>Qualification</label><input type="text" value={mentorData.qualification} onChange={(e) => setMentorData({...mentorData, qualification: e.target.value})} required /></div>
              <div className="form-group"><label>Expertise</label><textarea value={mentorData.expertise} onChange={(e) => setMentorData({...mentorData, expertise: e.target.value})} rows="3" required /></div>
              <div className="form-group"><label>Experience</label><input type="text" value={mentorData.experience} onChange={(e) => setMentorData({...mentorData, experience: e.target.value})} required /></div>
            </div>

            <div className="profile-section">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{margin: 0, border: 'none'}}>Availability Schedule</h3>
                {!isAddingSlot && (
                  <button type="button" className="save-btn" style={{padding: '0.5rem 1rem', fontSize: '0.9rem'}} onClick={() => setIsAddingSlot(true)}>
                    <i className="bi bi-plus-lg"></i> Add Slot
                  </button>
                )}
              </div>

              {slots.length > 0 ? (
                <div className="slots-list">
                  {slots.map((slot) => (
                    <div key={slot._id} className="slot-item">
                      <div className="slot-info">
                        <span className="slot-day">{slot.date ? new Date(slot.date).toLocaleDateString() : slot.day}</span>
                        <span className="slot-time">{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <div className="slot-actions">
                        <button type="button" className="icon-btn edit" onClick={() => handleEditSlot(slot)}><i className="bi bi-pencil"></i></button>
                        <button type="button" className="icon-btn delete" onClick={() => handleDeleteSlot(slot._id)}><i className="bi bi-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{color: '#888', fontSize: '0.9rem', marginBottom: '1rem'}}>No availability slots added yet.</p>
              )}

              {isAddingSlot && (
                <div className="slot-form">
                  <div className="form-group">
                    <label>Day of Week</label>
                    <small style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666'}}>
                      Set your regular weekly availability. Optional if you are adding a specific date below.
                    </small>
                    <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                      <select name="day" value={slotData.day} onChange={handleSlotChange} style={{flex: 1}}>
                        <option value="">From...</option>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <span style={{color: '#888'}}>to</span>
                      <select name="endDay" value={slotData.endDay} onChange={handleSlotChange} style={{flex: 1}}>
                        <option value="">To... (optional)</option>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Date</label>
                    <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                      <input type="date" name="date" value={slotData.date} onChange={handleSlotChange} style={{flex: 1}} />
                      <span style={{color: '#888'}}>to</span>
                      <input type="date" name="endDate" value={slotData.endDate} onChange={handleSlotChange} style={{flex: 1}} placeholder="Optional" />
                    </div>
                  </div>

                  <div className="time-inputs">
                    <div className="form-group">
                      <label>Start Time</label>
                      <input type="time" name="startTime" value={slotData.startTime} onChange={handleSlotChange} required />
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input type="time" name="endTime" value={slotData.endTime} onChange={handleSlotChange} required />
                    </div>
                  </div>

                  <div className="slot-form-actions">
                    <button type="button" onClick={handleSlotSubmit} className="save-btn">{editingSlotId ? 'Update Slot' : 'Save Slot'}</button>
                    <button type="button" className="cancel-btn" onClick={() => { setIsAddingSlot(false); setEditingSlotId(null); }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions"><button type="submit" className="save-btn">Save Mentor Details</button></div>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="profile-section">
              <h3>Change Password</h3>
              <div className="form-group"><label>Current Password</label><input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} required /></div>
              <div className="form-group"><label>New Password</label><input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} required /></div>
              <div className="form-group"><label>Confirm New Password</label><input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} required /></div>
            </div>
            <div className="form-actions"><button type="submit" className="save-btn">Update Password</button></div>
          </form>
        )}

        {activeTab === 'email' && (
          <div className="profile-form">
            <div className="profile-section">
              <h3>Update Email Address</h3>
              
              {emailStep === 1 && (
                <form onSubmit={handleEmailStep1}>
                  <div className="form-group"><label>Current Email</label><input type="email" value={emailData.currentEmail} onChange={(e) => setEmailData({...emailData, currentEmail: e.target.value})} placeholder={user.email} required /></div>
                  <button type="submit" className="save-btn" disabled={emailLoading}>{emailLoading ? 'Sending...' : 'Send OTP to Current Email'}</button>
                </form>
              )}

              {emailStep === 2 && (
                <form onSubmit={handleEmailStep2}>
                  <div className="form-group"><label>Enter OTP sent to {emailData.currentEmail}</label><input type="text" value={emailData.otp} onChange={(e) => setEmailData({...emailData, otp: e.target.value})} maxLength="6" required /></div>
                  <button type="submit" className="save-btn" disabled={emailLoading}>{emailLoading ? 'Verifying...' : 'Verify Current Email'}</button>
                </form>
              )}

              {emailStep === 3 && (
                <form onSubmit={handleEmailStep3}>
                  <div className="form-group"><label>New Email Address</label><input type="email" value={emailData.newEmail} onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})} required /></div>
                  <button type="submit" className="save-btn" disabled={emailLoading}>{emailLoading ? 'Sending...' : 'Send OTP to New Email'}</button>
                </form>
              )}

              {emailStep === 4 && (
                <form onSubmit={handleEmailStep4}>
                  <div className="form-group"><label>Enter OTP sent to {emailData.newEmail}</label><input type="text" value={emailData.otp} onChange={(e) => setEmailData({...emailData, otp: e.target.value})} maxLength="6" required /></div>
                  <button type="submit" className="save-btn" disabled={emailLoading}>{emailLoading ? 'Verifying...' : 'Verify & Update Email'}</button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {showLogoutModal && (
        <div className="mc-modal-overlay">
          <div className="mc-logout-modal-card">
            <div className="mc-logout-modal-header">
              <h4>Confirm Logout</h4>
            </div>
            <p>Are you sure you want to logout from MindComfort?</p>
            <div className="mc-logout-modal-actions">
              <button className="btn-cancel-logout" onClick={cancelLogout}>Cancel</button>
              <button className="btn-confirm-logout" onClick={confirmLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;