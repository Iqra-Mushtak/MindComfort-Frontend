import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './ChatroomList.css';
import logoImg from '../../assets/logo.png';
import '../client/ClientDashboard.css';
import NotificationBell from '../../components/NotificationBell';

const ChatroomList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    document.title = "Chatroom List | MindComfort";
    let userData = null;

    try {
      userData = JSON.parse(localStorage.getItem('user'));
    } catch (err) {
      userData = null;
    }

    const token = localStorage.getItem('token');

    if (!token || !userData) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    setUser(userData);
    fetchChatrooms();
    syncSubscriptionState(userData);
  }, [navigate]);

  const syncSubscriptionState = async (currentUser) => {
    try {
      const response = await api.get('/subscriptions/status');
      const hasActiveChat = Boolean(response?.data?.hasActiveChat);
      const updatedUser = {
        ...currentUser,
        isSubscribed: hasActiveChat,
        subscriptionStatus: hasActiveChat ? 'active' : 'inactive'
      };

      setUser(updatedUser);
      setSubscriptionStatus({
        hasActiveChat,
        isSubscribed: hasActiveChat,
        status: hasActiveChat ? 'active' : 'inactive'
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to sync subscription state:', err);
      setSubscriptionStatus({ hasActiveChat: false, isSubscribed: false, status: 'inactive' });
    }
  };

  const fetchChatrooms = async () => {
    try {
      const response = await api.get('/chat');
      setChatrooms(response.data);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setError('Failed to load chatrooms.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleJoin = (roomId) => {
    if (user.role === 'mentor') {
      navigate(`/chatroom/${roomId}`);
    } else if (user.role === 'client') {
      const isSubscribed = Boolean(
        user?.isSubscribed ||
        user?.subscriptionStatus === 'active' ||
        subscriptionStatus?.isSubscribed ||
        subscriptionStatus?.hasActiveChat
      );

      if (isSubscribed) {
        navigate(`/chatroom/${roomId}`);
      } else {
        navigate('/client/plans', {
          state: { message: 'Subscribe to access community chatrooms' }
        });
      }
    }
  };

  if (!user) return null;

  return (
    <div className="chatroom-container">
      {sidebarOpen && (
        <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/client/profile" style={{ textDecoration: 'none' }}>
        <div className="mc-user-info-top">
          <div className="mc-user-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
          <div className="mc-user-details">
            <h6>{user.username}</h6>
            <small>{user.role === 'mentor' ? 'Mentor' : 'Client'}</small>
          </div>
        </div>
        </Link>
      
                <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to={user.role === 'mentor' ? '/mentor/dashboard' : '/client/dashboard'} className="mc-nav-link">
              <i className="bi bi-house-fill"></i> Home
            </Link>
          </li>

          {user.role !== 'mentor' && (
            <li className="mc-nav-item">
              <Link to="/client/plans" className="mc-nav-link">
                <i className="bi bi-bookmark-star-fill"></i> Subscription Plans
              </Link>
            </li>
          )}

          <li className="mc-nav-item">
            <Link to="/chatrooms" className="mc-nav-link active">
              <i className="bi bi-chat-dots-fill"></i> Community Chat
            </Link>
          </li>

          <li className="mc-nav-item">
            <Link to={user.role === 'mentor' ? '/mentor/podcasts' : '/client/podcasts'} className="mc-nav-link">
              <i className="bi bi-broadcast-pin"></i> Podcasts
            </Link>
          </li>
          {user.role === 'client' && (
            <li className="mc-nav-item">
              <Link to="/client/mentors" className="mc-nav-link">
                <i className="bi bi-person-heart"></i> Mentors
              </Link>
            </li>
          )}
        </ul>
  
        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogoutClick}><i className="bi bi-box-arrow-right"></i> Log Out</button>
        </div>
      </aside>

      <main className="chatroom-main">
        
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
            <NotificationBell />
            <Link to="/" className="mc-main-logo">
              MindComfort
              <img src={logoImg} alt="MindComfort Logo" />
            </Link>
          </div>
        </div>

        <div className="chatroom-header">
          <h2>Community Chatrooms</h2>
          <p>Find a safe space to connect with others.</p>
        </div>
        
        {loading ? (
          <p className="loading-text">Loading chatrooms...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <div className="chatroom-list">
            {chatrooms.map(room => (
              <div key={room._id} className="chatroom-item">
                <div className="chatroom-info">
                  <h4>{room.name}</h4>
                  <p>{room.description || 'No description available.'}</p>
                </div>
                <button onClick={() => handleJoin(room._id)} className="join-btn">
                  Join
                </button>
              </div>
            ))}
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

export default ChatroomList;