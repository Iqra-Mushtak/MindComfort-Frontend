import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const AdminProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [editEmail, setEditEmail] = useState(false);
  const [emailStep, setEmailStep] = useState('initiate'); 
  const [emailFormData, setEmailFormData] = useState({
    currentEmail: '',
    currentOtp: '',
    newEmail: '',
    newOtp: ''
  });

  const [editPassword, setEditPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile'); 
      const userData = res.data.user;
      
      setProfile({
        username: userData.username,
        email: userData.email
      });
      setEmailFormData(prev => ({ ...prev, currentEmail: userData.email || '' }));
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateEmailChange = async () => {
    setError('');
    try {
      await api.post(`/profile/${user.id}/change-email/initiate`, {
        currentEmail: emailFormData.currentEmail
      });
      setEmailStep('verify_current');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate email change');
    }
  };

  const handleVerifyCurrentEmail = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/profile/${user.id}/change-email/verify-current`, {
        otp: emailFormData.currentOtp
      });
      setEmailStep('enter_new');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleSetNewEmail = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/profile/${user.id}/change-email/set-new`, {
        newEmail: emailFormData.newEmail
      });
      setEmailStep('verify_new');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set new email');
    }
  };

  const handleVerifyNewEmail = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/profile/${user.id}/change-email/verify-new`, {
        otp: emailFormData.newOtp,
        newEmail: emailFormData.newEmail
      });
      setSuccess('Email updated successfully!');
      setEditEmail(false);
      setEmailStep('initiate');
      fetchProfile(); 
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const cancelEmailEdit = () => {
    setEditEmail(false);
    setEmailStep('initiate');
    setEmailFormData({
      currentEmail: profile?.email || '',
      currentOtp: '',
      newEmail: '',
      newOtp: ''
    });
    setError('');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await api.put(`/profile/change-password/${user.id}`, {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmPassword
      });
      
      setSuccess('Password updated successfully');
      setEditPassword(false);
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    }
  };

  if (loading) return <div className="loading-text">Loading...</div>;

  return (
    <div className="simple-profile-container">
      <h2 className="profile-page-heading">Profile</h2>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="profile-row">
        <div className="profile-label">
          <strong>Username</strong>
        </div>
        <div className="profile-value">
          {profile?.username || 'N/A'}
        </div>
      </div>

      <div className="profile-row">
        <div className="profile-label">
          <strong>Email</strong>
        </div>
        <div className="profile-value">
          {!editEmail ? (
            <div className="value-with-edit">
              <span>{profile?.email || 'Not set'}</span>
              <button className="inline-edit-btn" onClick={() => setEditEmail(true)} title="Edit Email">
                <i className="bi bi-pencil-square"></i>
              </button>
            </div>
          ) : (
            <div className="inline-edit-form">
              {emailStep === 'initiate' && (
                <div className="inline-edit-form">
                  <button className="btn-save" onClick={handleInitiateEmailChange}>
                    Send Verification Code to Current Email
                  </button>
                  <div className="inline-form-buttons">
                    <button type="button" className="btn-cancel" onClick={cancelEmailEdit}>Cancel</button>
                  </div>
                </div>
              )}

              {emailStep === 'verify_current' && (
                <form onSubmit={handleVerifyCurrentEmail}>
                  <p style={{fontSize: '0.85rem', color: '#6c757d', marginBottom: '8px'}}>
                    Enter the OTP sent to <strong>{emailFormData.currentEmail}</strong>
                  </p>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={emailFormData.currentOtp}
                    onChange={(e) => setEmailFormData({ ...emailFormData, currentOtp: e.target.value })}
                    required
                    maxLength={6}
                  />
                  <div className="inline-form-buttons">
                    <button type="submit" className="btn-save">Verify</button>
                    <button type="button" className="btn-cancel" onClick={cancelEmailEdit}>Cancel</button>
                  </div>
                </form>
              )}

              {emailStep === 'enter_new' && (
                <form onSubmit={handleSetNewEmail}>
                  <input
                    type="email"
                    placeholder="Enter New Email Address"
                    value={emailFormData.newEmail}
                    onChange={(e) => setEmailFormData({ ...emailFormData, newEmail: e.target.value })}
                    required
                  />
                  <div className="inline-form-buttons">
                    <button type="submit" className="btn-save">Continue</button>
                    <button type="button" className="btn-cancel" onClick={cancelEmailEdit}>Cancel</button>
                  </div>
                </form>
              )}

              {emailStep === 'verify_new' && (
                <form onSubmit={handleVerifyNewEmail}>
                  <p style={{fontSize: '0.85rem', color: '#6c757d', marginBottom: '8px'}}>
                    Enter the OTP sent to <strong>{emailFormData.newEmail}</strong>
                  </p>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={emailFormData.newOtp}
                    onChange={(e) => setEmailFormData({ ...emailFormData, newOtp: e.target.value })}
                    required
                    maxLength={6}
                  />
                  <div className="inline-form-buttons">
                    <button type="submit" className="btn-save">Verify & Save</button>
                    <button type="button" className="btn-cancel" onClick={cancelEmailEdit}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Password - Editable */}
      <div className="profile-row">
        <div className="profile-label">
          <strong>Password</strong>
        </div>
        <div className="profile-value">
          {!editPassword ? (
            <div className="value-with-edit">
              <span>••••••••</span>
              <button className="inline-edit-btn" onClick={() => setEditPassword(true)} title="Change Password">
                <i className="bi bi-pencil-square"></i>
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="inline-edit-form">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordFormData.currentPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordFormData.newPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                required
              />
              <div className="inline-form-buttons">
                <button type="submit" className="btn-save">Save</button>
                <button type="button" className="btn-cancel" onClick={() => {
                  setEditPassword(false);
                  setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;