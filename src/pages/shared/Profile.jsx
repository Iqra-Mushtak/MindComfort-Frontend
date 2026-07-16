import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Profile.css';
import logoImg from '../../assets/logo.png';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || !userData) {
      navigate('/login');
      return;
    }
    fetchProfile(userData.id || userData._id); 
  }, [navigate]);

  const fetchProfile = async (userId) => {
    try {
      console.log("Fetching profile for ID:", userId);
      const response = await api.get(`/profile/${userId}`); 
      console.log("Backend Response:", response.data); 
      
      setUser(response.data.user);
      if (response.data.mentorProfile) {
        setMentorProfile(response.data.mentorProfile);
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || 'Failed to load profile.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="loading" style={{color: 'red', textAlign: 'center', marginTop: '50px'}}>{error}</div>;
  
  // Prevent completely blank screen if user data is missing
  if (!user) return <div className="loading" style={{textAlign: 'center', marginTop: '50px'}}>No user data found. Please check browser console (F12) for errors.</div>;

  // Fallback in case role is somehow missing
  const role = user.role || 'client'; 

  return (
    <div className="profile-container">
      <aside className="mc-sidebar">
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
          {role !== 'mentor' && (
            <li className="mc-nav-item">
              <Link to="/client/plans" className="mc-nav-link"><i className="bi bi-bookmark-star-fill"></i> Subscription Plans</Link>
            </li>
          )}
          <li className="mc-nav-item">
            <Link to="/chatrooms" className="mc-nav-link"><i className="bi bi-chat-dots-fill"></i> Community Chat</Link>
          </li>
          <li className="mc-nav-item">
            <Link to={role === 'mentor' ? '/mentor/podcasts' : '/client/podcasts'} className="mc-nav-link"><i className="bi bi-broadcast-pin"></i> Podcasts</Link>
          </li>
          {role !== 'mentor' && (
            <li className="mc-nav-item">
              <Link to="/client/mentors" className="mc-nav-link"><i className="bi bi-person-heart"></i> Mentors</Link>
            </li>
          )}
        </ul>
        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Log Out</button>
        </div>
      </aside>

      <main className="profile-main">
        <div className="mc-main-header">
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="mc-notification-btn"><i className="bi bi-bell-fill"></i><span className="mc-badge">3</span></button>
            <Link to="/" className="mc-main-logo">MindComfort <img src={logoImg} alt="MindComfort Logo" /></Link>
          </div>
        </div>

        <div className="profile-header">
          <h2>Profile</h2>
          {role === 'mentor' && (
            <Link to={`/${role}/profile/edit`} className="edit-btn">
              <i className="bi bi-pencil-fill"></i> Edit Profile
            </Link>
          )}
        </div>

        <div className="profile-view-section">
          <h3>Account Details</h3>
          
          {role === 'client' && (
            <>
              <div className="info-row"><span className="info-label">Username:</span> <span className="info-value">{user.username}</span></div>
              <div className="info-row"><span className="info-label">Email:</span> <span className="info-value">{user.email}</span></div>
              <div className="info-row subscription-row">
                <span className="info-label">Subscription:</span>
                {user.isSubscribed ? (
                  <span className="info-value active-status">Active Subscription</span>
                ) : (
                  <div className="info-value inactive-status">
                    <span>Limited access</span>
                    <Link to="/client/plans" className="premium-btn">Get Premium Access</Link>
                  </div>
                )}
              </div>
            </>
          )}

            {role === 'mentor' && (
            <>
              <div className="info-row">
                <span className="info-label">Account Status:</span> 
                <span className={`info-value ${
                  user.isSuspended ? 'status-badge-suspended' : 
                  user.status === 'approved' ? 'status-badge-approved' : 
                  user.status === 'rejected' ? 'status-badge-rejected' : 'status-badge-pending'
                }`}>
                  {user.isSuspended ? 'Suspended' : 
                   user.status === 'approved' ? 'Active' : 
                   user.status === 'rejected' ? 'Rejected' : 'Pending Admin Review'}
                </span>
              </div>
              <div className="info-row"><span className="info-label">Full Name:</span> <span className="info-value">{mentorProfile?.fullName || 'Not provided'}</span></div>
              {/* <div className="info-row"><span className="info-label">Email:</span> <span className="info-value">{user.email}</span></div> */}
              <div className="info-row"><span className="info-label">Qualification:</span> <span className="info-value">{mentorProfile?.qualification || 'Not provided'}</span></div>
              <div className="info-row"><span className="info-label">Expertise:</span> <span className="info-value">{mentorProfile?.expertise || 'Not provided'}</span></div>
              <div className="info-row"><span className="info-label">Experience:</span> <span className="info-value">{mentorProfile?.experience || 'Not provided'}</span></div>
            </>
          )}
        </div>

        <div className="profile-view-section">
          <h3>Security</h3>
          <div className="security-options">
            <Link to={`/${role}/profile/edit?tab=email`} className="security-link">
              <i className="bi bi-envelope"></i> Update Email (Requires OTP Verification)
            </Link>
            <Link to={`/${role}/profile/edit?tab=password`} className="security-link">
              <i className="bi bi-lock"></i> Update Password
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;