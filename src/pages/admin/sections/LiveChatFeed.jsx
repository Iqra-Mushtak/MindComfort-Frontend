import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';
import io from 'socket.io-client';

const LiveChatFeed = () => {
  const [messages, setMessages] = useState([]);
  const [chatrooms, setChatrooms] = useState([]);
  const [selectedChatroom, setSelectedChatroom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isFeedScrolled, setIsFeedScrolled] = useState(false);
  const [activeForm, setActiveForm] = useState(null); 
  const [formData, setFormData] = useState({ messageId: null, userId: null });
  const [formInput, setFormInput] = useState('');
  
  const messagesFeedRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    document.title = "Live Chat Feed | MindComfort";
    fetchChatrooms();
  }, []);

  useEffect(() => {
    if (selectedChatroom && !socketRef.current) {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || ''http://13.60.72.235:5000'';
      const newSocket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected for live chat');
        newSocket.emit('joinRoom', { chatroomId: selectedChatroom });
      });

      newSocket.on('newMessage', (message) => {
        setMessages(prev => [...prev, {
          _id: message._id,
          content: message.content,
          senderId: message.senderId,
          anonymousId: message.anonymousId,
          createdAt: message.createdAt,
          isOwn: message.isOwn
        }]);
      });

      newSocket.on('messageDeleted', (data) => {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      });

      newSocket.on('userWarned', (data) => {
        console.log('User warned:', data);
      });

      newSocket.on('accountSuspended', (data) => {
        console.log('User suspended:', data);
      });

      newSocket.on('moderationSuccess', (message) => {
        console.log('Moderation action successful:', message);
      });

      newSocket.on('moderationError', (error) => {
        console.error('Moderation error:', error);
        alert('Error: ' + error);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }
  }, [selectedChatroom]);

  useLayoutEffect(() => {
    if (loading || !selectedChatroom || messages.length === 0) return undefined;

    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      scrollToBottom();
      secondFrame = requestAnimationFrame(scrollToBottom);
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [loading, selectedChatroom, messages]);

  const scrollToBottom = () => {
    const feed = messagesFeedRef.current;
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  };

  const handleMessagesFeedScroll = (event) => {
    setIsFeedScrolled(event.currentTarget.scrollTop > 2);
  };

  const handleReturnToChatrooms = () => {
    const feed = messagesFeedRef.current;
    if (!feed) return;

    feed.scrollTop = 0;
    setIsFeedScrolled(false);
  };

  const fetchChatrooms = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const apiPrefix = user?.role === 'moderator' ? '/moderator' : '/admin';
      const res = await api.get(`${apiPrefix}/chatrooms`);
      setChatrooms(res.data.chatrooms || []);
    } catch (err) {
      console.error('Error fetching chatrooms:', err);
    }
  };

  const handleSelectChatroom = async (chatroomId) => {
    setSelectedChatroom(chatroomId);
    setMessages([]);
    setLoading(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const apiPrefix = user?.role === 'moderator' ? '/moderator' : '/admin';
      const res = await api.get(`${apiPrefix}/chatrooms/${chatroomId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Error fetching previous messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = (messageId, userId) => {
    setFormData({ messageId, userId });
    setActiveForm('delete');
    setFormInput('');
  };

  const handleWarnUser = (userId, messageId) => {
    setFormData({ messageId, userId });
    setActiveForm('warn');
    setFormInput('');
  };

  const handleSuspendUser = (userId, messageId) => {
    setFormData({ messageId, userId });
    setActiveForm('suspend');
    setFormInput('');
  };

  const closeForm = () => {
    setActiveForm(null);
    setFormData({ messageId: null, userId: null });
    setFormInput('');
  };

  const submitForm = () => {
    if (activeForm === 'delete' && socketRef.current) {
      socketRef.current.emit('adminDeleteMessage', {
        messageId: formData.messageId,
        chatroomId: selectedChatroom,
        userId: formData.userId
      });
      closeForm();
      setOpenMenuId(null);
    } else if (activeForm === 'warn') {
      if (!formInput.trim()) return alert('Please enter a reason for warning');
      if (socketRef.current) {
        socketRef.current.emit('adminWarnUser', {
          userId: formData.userId,
          messageId: formData.messageId,
          chatroomId: selectedChatroom,
          reason: formInput
        });
      }
      closeForm();
      setOpenMenuId(null);
    } else if (activeForm === 'suspend') {
      if (!formInput.trim()) return alert('Please enter a reason for suspension');
      if (socketRef.current) {
        socketRef.current.emit('adminSuspendUser', {
          userId: formData.userId,
          messageId: formData.messageId,
          chatroomId: selectedChatroom,
          reason: formInput
        });
      }
      closeForm();
      setOpenMenuId(null);
    }
  };

  return (
    <div
      className={`admin-section live-chat-section ${isFeedScrolled ? 'feed-scrolled' : ''}`}
      onClick={() => openMenuId && setOpenMenuId(null)}
    >
      {activeForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{activeForm === 'delete' ? 'Delete Message' : activeForm === 'warn' ? 'Warn User' : 'Suspend User'}</h3>
              <button className="admin-modal-close" onClick={closeForm}>×</button>
            </div>
            <div className="admin-modal-body">
              <label>
                {activeForm === 'delete' ? 'Are you sure you want to delete this message?' : activeForm === 'warn' ? 'Enter reason for warning:' : 'Enter reason for suspension:'}
              </label>
              {activeForm !== 'delete' && (
                <textarea
                  className="admin-form-textarea"
                  value={formInput}
                  onChange={(e) => setFormInput(e.target.value)}
                  placeholder={activeForm === 'warn' ? 'Enter warning reason...' : 'Enter suspension reason...'}
                  rows="4"
                />
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn-cancel" onClick={closeForm}>Cancel</button>
              <button className="admin-btn-confirm" onClick={submitForm}>
                {activeForm === 'delete' ? 'Delete' : activeForm === 'warn' ? 'Warn' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="section-header">
        <h2>Live Chat Feed</h2>
        <small>Real-time chat monitoring</small>
      </div>

      <div className="live-chat-container">
        <div className="chatrooms-sidebar">
          <h3>Chatrooms</h3>
          <div className="chatrooms-list">
            {chatrooms.map(room => (
              <button
                key={room._id}
                className={`chatroom-btn ${selectedChatroom === room._id ? 'active' : ''}`}
                onClick={() => handleSelectChatroom(room._id)}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>

        <div className="messages-container">
          {selectedChatroom ? (
            <>
              <div className="messages-header">
                <h3>Messages</h3>
                {!socket && <small>Connecting...</small>}
              </div>

              {isFeedScrolled && (
                <button
                  className="live-chat-return-btn"
                  onClick={handleReturnToChatrooms}
                  aria-label="Return to chatrooms"
                  title="Return to chatrooms"
                >
                  &#8593;
                </button>
              )}

              {loading ? (
                <div className="empty-state">Loading previous messages...</div>
              ) : (
                <div
                  className="messages-feed"
                  ref={messagesFeedRef}
                  onScroll={handleMessagesFeedScroll}
                >
                  {messages.length === 0 ? (
                    <div className="empty-state">Waiting for messages...</div>
                  ) : (
                    messages.map((msg, index) => {
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const isSameSender = prevMsg && prevMsg.anonymousId === msg.anonymousId;
                      const showSenderId = !isSameSender;

                      return (
                        <div key={msg._id} className={`admin-message-item ${isSameSender ? 'same-sender' : ''}`}>
                          {showSenderId && (
                            <div className="admin-message-sender-name">
                              {msg.anonymousId || 'Anonymous'}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                            <div className="admin-message-bubble">
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div className="admin-message-content">
                                  {msg.content}
                                </div>
                                <span className="admin-message-timestamp">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <div className="admin-action-menu-container">
                              <button
                                className="admin-btn-dots"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === msg._id ? null : msg._id);
                                }}
                              >
                                ⋮
                              </button>
                              {openMenuId === msg._id && (
                                <div className="admin-action-menu" onClick={(e) => e.stopPropagation()}>
                                  <button className="admin-menu-item delete" onClick={() => handleDeleteMessage(msg._id, msg.senderId?._id)}>Delete Message</button>
                                  <button className="admin-menu-item warn" onClick={() => handleWarnUser(msg.senderId?._id, msg._id)}>Warn User</button>
                                  <button className="admin-menu-item suspend" onClick={() => handleSuspendUser(msg.senderId?._id, msg._id)}>Suspend User</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">Select a chatroom to view live messages</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatFeed;