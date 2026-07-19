import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import './ChatInterface.css';
import logoImg from '../../assets/logo.png';

const ChatInterface = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chatroom, setChatroom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anonymousId, setAnonymousId] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  
  const [messageCount, setMessageCount] = useState(0);
  const [rateLimitMsg, setRateLimitMsg] = useState('');

  const [showTopDate, setShowTopDate] = useState(true);
  const chatContainerRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessageId, setReportMessageId] = useState(null);
  const [selectedReason, setSelectedReason] = useState(''); 
  const [reportReason, setReportReason] = useState('');

  const getDateLabel = (createdAt) => {
    if (!createdAt) return '';
    const messageDate = new Date(createdAt);
    if (isNaN(messageDate.getTime())) return ''; 
    
    const now = new Date();
    const msgDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((nowDateOnly - msgDateOnly) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    
    return `${messageDate.getDate()}/${messageDate.getMonth() + 1}/${messageDate.getFullYear()}`;
  };

  const getTimeString = (createdAt) => {
    if (!createdAt) return '';
    const messageDate = new Date(createdAt);
    if (isNaN(messageDate.getTime())) return '';
    
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const getDateKey = (createdAt) => {
    if (!createdAt) return 'invalid';
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return 'invalid';
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  const isLastMessageOfDay = (msg, currentIndex) => {
    for (let i = currentIndex + 1; i < messages.length; i++) {
      if (getDateKey(messages[i].createdAt) !== getDateKey(msg.createdAt)) {
        return true; 
      }
    }
    return currentIndex === messages.length - 1; 
  };

  useEffect(() => {
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

    const syncUserState = async () => {
      try {
        const response = await api.get('/profile'); 
        const freshUser = response.data.user || response.data; 
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch (err) {
        console.error('Failed to sync user data:', err);
      }
    };
    
    syncUserState();

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api$/, '');

    const socketInstance = io(socketUrl, {
      auth: { token: token },
      transports: ['websocket', 'polling']
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setError(''); 
      setLoading(true); 
      socketInstance.emit('joinRoom', { chatroomId: id });
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to chat server.');
      setLoading(false);
    });

    socketInstance.on('joinedRoom', (data) => {
      if (data.status === 'success') {
        setError(''); 
        setAnonymousId(data.anonymousId || '');
        setMessages(data.messages || []);
        setLoading(false);
        scrollToBottom();
      }
    });

    socketInstance.on('joinAck', (data) => {
      if (data.status === 'success') {
        setError('');
        setAnonymousId(data.anonymousId || '');
        setMessages(data.messages || []);
        setLoading(false);
        scrollToBottom();
      } else {
        setError(data.message || 'Failed to join chatroom.');
        setLoading(false);
      }
    });

    socketInstance.on('joinError', (errorMessage) => {
      if (errorMessage.includes('subscription')) {
        navigate('/client/plans', { state: { message: 'Subscribe to access chat messages' } });
      } else {
        setError(errorMessage);
      }
      setLoading(false);
    });

    socketInstance.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      
        if (message.isOwn) {
        setMessageCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 15) {
            setRateLimitMsg('Rate limit reached. Please wait before sending more messages.');
          }
          return newCount;
        });
      }
      scrollToBottom();
    });

    socketInstance.on('messageError', (errorMessage) => {
      alert(errorMessage);
      if (errorMessage.includes('limit')) {
        setMessageCount(15);
        setRateLimitMsg('Rate limit reached. Please wait before sending more messages.');
      }
    });

    fetchChatroomDetails();

    const interval = setInterval(() => {
      setMessageCount(0);
      setRateLimitMsg('');
    }, 60000);

    return () => {
      socketInstance.emit('leaveRoom');
      socketInstance.disconnect();
      clearInterval(interval);
    };
  }, [id, navigate]);

  useEffect(() => {
    if (loading || messages.length === 0) return;

    const checkIfAtBottom = () => {
      if (!chatContainerRef.current) return false;
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      return scrollHeight - scrollTop - clientHeight < 100;
    };

    const handleScroll = () => {
      if (checkIfAtBottom()) {
        setShowTopDate(true);
        const timer = setTimeout(() => {
          setShowTopDate(false);
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setShowTopDate(true);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loading, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setShowTopDate(true);
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
          if (scrollHeight - scrollTop - clientHeight < 100) {
            setShowTopDate(false);
          }
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const fetchChatroomDetails = async () => {
    try {
      const response = await api.get(`/chat/${id}`);
      setChatroom(response.data);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || messageCount >= 15) return;
    
    socket.emit('sendMessage', {
      chatroomId: id,
      content: newMessage.trim(),
      replyTo: replyingTo?._id || null
    });
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleReplyClick = (message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleDoubleClick = (message) => {
    setReplyingTo(message);
  };

  const jumpToMessage = (replyToId) => {
    if (!replyToId) return;
    
    const messageElement = document.getElementById(`msg-${replyToId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
  };

    const handleReportClick = (messageId) => {
    setReportMessageId(messageId);
    setShowReportModal(true);
    setReportReason('');
    setSelectedReason('');
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportMessageId(null);
    setReportReason('');
    setSelectedReason('');
  };

  const submitReport = async () => {
    let finalReason = selectedReason;
    
    if (selectedReason === 'other') {
      if (!reportReason.trim()) {
        alert('Please provide a reason for reporting this message.');
        return;
      }
      finalReason = `Other: ${reportReason.trim()}`;
    }
    
    try {
      await api.post('/chat/report', { 
        messageId: reportMessageId, 
        reason: finalReason 
      });
      alert('Message reported successfully.');
      closeReportModal();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to report message.');
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      if (socket) {
        socket.emit('leaveRoom');
        socket.disconnect();
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

    const reportOptions = [
    { id: 'harassment', label: 'Harassment or bullying' },
    { id: 'spam', label: 'Spam or selling things' },
    { id: 'misleading', label: 'Misleading' },
    { id: 'hate', label: 'Hate speech' },
    { id: 'joke', label: 'Joking or Trolling' },
    { id: 'inappropriate', label: 'Inappropriate content' },
    { id: 'other', label: 'Other' }
  ];

  if (!user) return null;

  return (
    <div className="chat-interface-container">
      {/* Sidebar */}
      <aside className="mc-sidebar">
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
          <li className="mc-nav-item"><Link to="/client/dashboard" className="mc-nav-link"><i className="bi bi-house-fill"></i> Home</Link></li>
          {/* <li className="mc-nav-item"><Link to="/client/plans" className="mc-nav-link"><i className="bi bi-bookmark-star-fill"></i> Subscription Plans</Link></li> */}
          <li className="mc-nav-item"><Link to="/chatrooms" className="mc-nav-link active"><i className="bi bi-chat-dots-fill"></i> Community Chat</Link></li>
          <li className="mc-nav-item"><Link to="/client/podcasts" className="mc-nav-link"><i className="bi bi-broadcast-pin"></i> Podcasts</Link></li>
        </ul>

        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Log Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="chat-interface-main">
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

        <div className="chat-header">
          <div className="chat-header-title-row">
            <button className="back-button" onClick={() => navigate('/chatrooms')}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <h2>{chatroom?.name || 'Loading...'}</h2>
          </div>
          {chatroom?.description && (
            <p className="chatroom-description">{chatroom.description}</p>
          )}
        </div>

        {loading ? (
          <p className="loading-text">Connecting to chat...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <>
              <div className="chat-messages" ref={chatContainerRef}>
              {messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--mc-text-light)' }}>No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg, index) => {
                  if (!msg) return null; 
                  
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const isOwn = msg.isOwn === true;
                  const isSameSender = prevMsg && prevMsg.anonymousId === msg.anonymousId;
                  const showSenderId = !isSameSender;
                  
                  const showDateSeparator = !prevMsg || getDateKey(prevMsg.createdAt) !== getDateKey(msg.createdAt);

                  return (
                    <React.Fragment key={msg._id || index}>
                      
                      {showDateSeparator && (
                        <div 
                          className={`date-separator ${!showTopDate && isLastMessageOfDay(msg, index) ? 'date-separator-hidden' : ''}`}
                          data-date-separator
                        >
                          {getDateLabel(msg.createdAt)}
                        </div>
                      )}

                                            <div 
                        className={`message-item ${isOwn ? 'own-message' : ''} ${isSameSender ? 'same-sender' : ''}`}
                        id={`msg-${msg._id}`}
                      >
                        {showSenderId && (
                          <div className="message-sender-name">
                            {msg.anonymousId}
                          </div>
                        )}
                        <div 
                          className="message-bubble"
                          onDoubleClick={() => !msg.isOwn && handleDoubleClick(msg)}
                        >
                          {msg.replyTo && (
                            <div 
                              className="message-reply-preview"
                              onClick={() => jumpToMessage(msg.replyTo._id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <span>{msg.replyTo.content}</span>
                            </div>
                          )}
                          <div className="message-content">{msg.content}</div>
                          <div className="message-timestamp">
                            {getTimeString(msg.createdAt)}
                          </div>
                          {!msg.isOwn && (
                            <div className="message-actions">
                              <button 
                                className="message-action-btn reply-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReplyClick(msg);
                                }}
                              >
                                <i className="bi bi-reply"></i>
                                <span className="action-text">Reply</span>
                              </button>
                              <button 
                                className="message-action-btn report-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReportClick(msg._id);
                                }}
                              >
                                <i className="bi bi-flag"></i>
                                <span className="action-text">Report</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {rateLimitMsg && (
              <div className={`rate-limit-warning ${messageCount >= 15 ? 'limit-reached' : 'limit-warning'}`}>
                {rateLimitMsg}
              </div>
            )}
            
            {/* Report Modal */}
            {showReportModal && (
              <div className="report-modal-overlay" onClick={closeReportModal}>
                <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="report-modal-header">
                    <h3>Report Message</h3>
                    <button className="report-modal-close" onClick={closeReportModal}>
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                  
                  <div className="report-modal-body">
                    <p className="report-modal-subtitle">Why are you reporting this message?</p>
                    
                    <div className="report-options-list">
                      {reportOptions.map((option) => (
                        <label 
                          key={option.id} 
                          className={`report-option ${selectedReason === option.id ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="reportReason"
                            value={option.id}
                            checked={selectedReason === option.id}
                            onChange={(e) => setSelectedReason(e.target.value)}
                          />
                          <span className="report-option-label">{option.label}</span>
                        </label>
                      ))}
                    </div>

                    {selectedReason === 'other' && (
                      <textarea
                        className="report-reason-input"
                        placeholder="Please describe the issue..."
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        rows="3"
                      />
                    )}
                  </div>

                  <div className="report-modal-footer">
                    <button className="report-cancel-btn" onClick={closeReportModal}>
                      Cancel
                    </button>
                    <button 
                      className="report-submit-btn" 
                      onClick={submitReport}
                      disabled={!selectedReason}
                    >
                      Submit Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              {replyingTo && (
              <div className="reply-preview">
                <div className="reply-preview-content">
                  <span className="reply-preview-sender">Replying to {replyingTo.anonymousId}</span>
                  <span className="reply-preview-text">{replyingTo.content}</span>
                </div>
                <button type="button" className="reply-cancel-btn" onClick={cancelReply}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            )}
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={2000}
                disabled={messageCount >= 15}
              />
              <button 
                type="submit" 
                className="chat-send-btn" 
                disabled={!newMessage.trim() || messageCount >= 15}
              >
                Send
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default ChatInterface;