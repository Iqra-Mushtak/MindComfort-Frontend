import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './ChatroomList.css';
import logoImg from '../../assets/logo.png';
import '../client/ClientDashboard.css';

const ChatroomList = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!token || !userData) {
      navigate('/login');
    } else {
      setUser(userData);
      fetchChatrooms();
    }
  }, [navigate]);

  const fetchChatrooms = async () => {
    try {
      const response = await api.get('/chat');
      setChatrooms(response.data);
    } catch (err) {
      setError('Failed to load chatrooms.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const handleJoin = (roomId) => {
    if (user.role === 'mentor') {
      navigate(`/chatroom/${roomId}`);;
    } else if (user.role === 'client') {
      const isSubscribed = user.isSubscribed || user.subscriptionStatus === 'active';
      
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
      {/* Sidebar */}
            {/* Sidebar */}
      <aside className="mc-sidebar">
        <Link to="/client/profile" style={{ textDecoration: 'none' }}>
        <div className="mc-user-info-top">
          <div className="mc-user-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="mc-user-details">
            <h6>{user.username}</h6>
            <small>{user.role === 'mentor' ? 'Mentor' : 'Client'}</small>
          </div>
        </div>
        </Link>
      
        <ul className="mc-nav-menu">
          <li className="mc-nav-item"><Link to="/client/dashboard" className="mc-nav-link"><i className="bi bi-house-fill"></i> Home</Link></li>
          <li className="mc-nav-item"><Link to="/client/plans" className="mc-nav-link"><i className="bi bi-bookmark-star-fill"></i> Subscription Plans</Link></li>
          <li className="mc-nav-item"><Link to="/chatrooms" className="mc-nav-link active"><i className="bi bi-chat-dots-fill"></i> Community Chat</Link></li>
          <li className="mc-nav-item"><Link to="/client/podcasts" className="mc-nav-link"><i className="bi bi-broadcast-pin"></i> Podcasts</Link></li>
          <li className="mc-nav-item"><Link to="/client/profile" className="mc-nav-link"><i className="bi bi-person-fill"></i> Profile</Link></li>
        </ul>

        {/* Logout at BOTTOM */}
        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Log Out</button>
        </div>
      </aside>

      {/* Main Content */}
            {/* Main Content */}
      <main className="chatroom-main">
        
        {/* Top Header Row (Bell & Logo) with the Line Beneath */}
        <div className="mc-main-header">
          <div style={{ flex: 1 }}></div> 
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="mc-notification-btn">
              <i className="bi bi-bell-fill"></i>
              <span className="mc-badge">3</span>
            </button>
            <Link to="/" className="mc-main-logo">
              MindComfort
              <img src={logoImg} alt="MindComfort Logo" />
            </Link>
          </div>
        </div>

        {/* Chatroom Header (Now UNDER the line) */}
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
                  {user.role === 'mentor' ? 'Join' : 
                   (user.isSubscribed || user.subscriptionStatus === 'active') ? 'Join' : 'Subscribe to Chat'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatroomList;