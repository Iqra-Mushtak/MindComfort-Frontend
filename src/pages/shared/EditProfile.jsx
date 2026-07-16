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

  const [mentorData, setMentorData] = useState({ fullName: '', qualification: '', expertise: '', experience: '' });
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [emailStep, setEmailStep] = useState(1);
  const [emailData, setEmailData] = useState({ currentEmail: '', newEmail: '', otp: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!token || !userData) { navigate('/login'); return; }
    
    fetchProfile(userData.id);
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
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
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

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="profile-container">
      <aside className="mc-sidebar">
        <Link to={`/${user.role}/profile`} style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
            <div className="mc-user-details">
              <h6>{user.username}</h6>
              <small>{user.role === 'mentor' ? 'Mentor' : 'Client'}</small>
            </div>
          </div>
        </Link>
        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="profile-main">
        <div className="mc-main-header">
          <div style={{ flex: 1 }}></div>
          <Link to="/" className="mc-main-logo">MindComfort <img src={logoImg} alt="Logo" /></Link>
        </div>

        <div className="profile-header">
          <h2>Edit Profile</h2>
          <Link to={`/${user.role}/profile`} className="cancel-edit-btn">Cancel</Link>
        </div>

        <div className="edit-tabs">
          {user.role === 'mentor' && (
            <button className={`tab-btn ${activeTab === 'mentor' ? 'active' : ''}`} onClick={() => setActiveTab('mentor')}>Mentor Details</button>
          )}
          <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>Password</button>
          <button className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`} onClick={() => { setActiveTab('email'); setEmailStep(1); }}>Email</button>
        </div>

        {activeTab === 'mentor' && user.role === 'mentor' && (
          <form onSubmit={handleMentorSubmit} className="profile-form">
            <div className="profile-section">
              <h3>Mentor Information</h3>
              <div className="form-group"><label>Full Name</label><input type="text" value={mentorData.fullName} onChange={(e) => setMentorData({...mentorData, fullName: e.target.value})} required /></div>
              <div className="form-group"><label>Qualification</label><input type="text" value={mentorData.qualification} onChange={(e) => setMentorData({...mentorData, qualification: e.target.value})} required /></div>
              <div className="form-group"><label>Expertise</label><textarea value={mentorData.expertise} onChange={(e) => setMentorData({...mentorData, expertise: e.target.value})} rows="3" required /></div>
              <div className="form-group"><label>Experience</label><input type="text" value={mentorData.experience} onChange={(e) => setMentorData({...mentorData, experience: e.target.value})} required /></div>
            </div>
            <div className="form-actions"><button type="submit" className="save-btn">Save Changes</button></div>
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
    </div>
  );
};

export default EditProfile;