import React, { useState, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchChatrooms();
  }, []);

  useEffect(() => {
    if (selectedChatroom && !socketRef.current) {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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

    return () => {
    };
  }, [selectedChatroom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatrooms = async () => {
    try {
      const res = await api.get('/admin/chatrooms');
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
      const res = await api.get(`/admin/chatrooms/${chatroomId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Error fetching previous messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = (messageId, userId) => {
    if (window.confirm('Delete this message?')) {
      if (socketRef.current) {
        socketRef.current.emit('adminDeleteMessage', {
          messageId,
          chatroomId: selectedChatroom,
          userId
        });
      }
    }
  };

  const handleWarnUser = (userId, messageId) => {
    const reason = window.prompt('Enter reason for warning:');
    if (reason) {
      if (socketRef.current) {
        socketRef.current.emit('adminWarnUser', {
          userId,
          messageId,
          chatroomId: selectedChatroom,
          reason
        });
      }
    }
  };

  const handleSuspendUser = (userId, messageId) => {
    const reason = window.prompt('Enter reason for suspension:');
    if (reason) {
      if (socketRef.current) {
        socketRef.current.emit('adminSuspendUser', {
          userId,
          messageId,
          chatroomId: selectedChatroom,
          reason
        });
      }
    }
  };

  return (
    <div className="admin-section">
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
                <span className={`online-indicator ${room.isActive ? 'online' : 'offline'}`}></span>
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
                {!socket ? <small>Connecting...</small> : <small className="online-status">●  Live</small>}
              </div>

              {loading ? (
                <div className="empty-state">Loading previous messages...</div>
              ) : (
                <div className="messages-feed">
                  {messages.length === 0 ? (
                    <div className="empty-state">Waiting for messages...</div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg._id} className="message-item">
                        <div className="message-header">
                          <strong>{msg.anonymousId || 'Anonymous'}</strong>
                          <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="message-content">
                          {msg.content}
                        </div>
                        <div className="message-actions">
                          <div className="action-menu-container">
                            <button
                              className="btn-dots"
                              onClick={() => setOpenMenuId(openMenuId === msg._id ? null : msg._id)}
                              title="Message actions"
                            >
                              ⋮
                            </button>
                            {openMenuId === msg._id && (
                              <div className="action-menu">
                                <button
                                  className="menu-item delete"
                                  onClick={() => handleDeleteMessage(msg._id, msg.senderId?._id)}
                                >
                                  🗑️ Delete Message
                                </button>
                                <button
                                  className="menu-item warn"
                                  onClick={() => handleWarnUser(msg.senderId?._id, msg._id)}
                                >
                                  ⚠️ Warn User
                                </button>
                                <button
                                  className="menu-item suspend"
                                  onClick={() => handleSuspendUser(msg.senderId?._id, msg._id)}
                                >
                                  🚫 Suspend User
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
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
