import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../utils/api';
import './CreatePodcast.css';
import logoImg from '../../../assets/logo.png';

const CreatePodcast = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    price: ''
  });

  const [schedule, setSchedule] = useState([]);

  const normalizeTimeInput = (value) => {
    if (!value) return null;
    const input = value.trim();

    const twentyFourHour = input.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (twentyFourHour) {
      const hours = twentyFourHour[1].padStart(2, '0');
      return `${hours}:${twentyFourHour[2]}`;
    }

    const twelveHour = input.match(/^(1[0-2]|[1-9])(?::([0-5]\d))?\s*([aApP][mM])$/);
    if (twelveHour) {
      let hours = parseInt(twelveHour[1], 10);
      const minutes = twelveHour[2] || '00';
      const meridiem = twelveHour[3].toUpperCase();

      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;

      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    return null;
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'mentor') {
      navigate('/login');
    } else {
      setUser(userData);
    }
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, startDate: today }));
    setSchedule([{ date: today, startTime: '', endTime: '' }]);
  }, [navigate]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    if (name === 'startDate' || name === 'endDate') {
      if (updatedData.startDate && updatedData.endDate && updatedData.endDate >= updatedData.startDate) {
        const dates = [];
        let current = new Date(updatedData.startDate);
        const end = new Date(updatedData.endDate);
        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          const existing = schedule.find(s => s.date === dateStr);
          dates.push({
            date: dateStr,
            startTime: existing ? existing.startTime : '',
            endTime: existing ? existing.endTime : ''
          });
          current.setDate(current.getDate() + 1);
        }
        setSchedule(dates);
      } else if (updatedData.startDate && !updatedData.endDate) {
        setSchedule((prev) => {
          const existing = prev.find(s => s.date === updatedData.startDate);
          return [{
            date: updatedData.startDate,
            startTime: existing ? existing.startTime : '',
            endTime: existing ? existing.endTime : ''
          }];
        });
      }
    }
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...schedule];
    if (!updatedSchedule[index]) {
      updatedSchedule[index] = {
        date: formData.startDate,
        startTime: '',
        endTime: ''
      };
    }
    updatedSchedule[index][field] = value;
    setSchedule(updatedSchedule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const parsedPrice = formData.price === '' ? 0 : parseFloat(formData.price);
      
      let payload = {
        title: formData.title,
        description: formData.description,
        price: parsedPrice, 
      };

      if (formData.endDate) {
        const hasEmptyTime = schedule.some(s => !s.startTime || !s.endTime);
        if (hasEmptyTime) {
          throw new Error('Please provide start and end times for all days in the series.');
        }
        const hasInvalidTime = schedule.some(
          s => !normalizeTimeInput(s.startTime) || !normalizeTimeInput(s.endTime)
        );
        if (hasInvalidTime) {
          throw new Error('Use a valid time format like 3:00 PM or 15:00.');
        }
        
        const sessions = schedule.map(s => ({
          date: s.date,
          startTime: new Date(`${s.date}T${normalizeTimeInput(s.startTime)}`).toISOString(),
          endTime: new Date(`${s.date}T${normalizeTimeInput(s.endTime)}`).toISOString()
        }));

        payload.sessions = sessions;
        payload.startTime = sessions[0].startTime;
        payload.endTime = sessions[sessions.length - 1].endTime;

      } else {
        if (!schedule[0]?.startTime || !schedule[0]?.endTime) {
           throw new Error('Please provide start and end times.');
        }
        const startTime = normalizeTimeInput(schedule[0].startTime);
        const endTime = normalizeTimeInput(schedule[0].endTime);
        if (!startTime || !endTime) {
          throw new Error('Use a valid time format like 3:00 PM or 15:00.');
        }
        payload.startTime = new Date(`${formData.startDate}T${startTime}`).toISOString();
        payload.endTime = new Date(`${formData.startDate}T${endTime}`).toISOString();
      }

      await api.post('/podcasts', payload);
      alert('Podcast session created successfully and is pending admin approval!');
      navigate('/mentor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create podcast session.');
    } finally {
      setLoading(false);
    }
  };

  const isSeries = formData.startDate && formData.endDate && formData.endDate >= formData.startDate;

  if (!user) return null;

  return (
    <div className="create-podcast-container">
      {sidebarOpen && (
        <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/mentor/profile" style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
            <div className="mc-user-details">
              <h6>{user.username}</h6>
              <small>Mentor</small>
            </div>
          </div>
        </Link>
        <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to="/mentor/dashboard" className="mc-nav-link"><i className="bi bi-house-fill"></i> Home</Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/chatrooms" className="mc-nav-link"><i className="bi bi-chat-dots-fill"></i> Community Chat</Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/mentor/podcasts" className="mc-nav-link active"><i className="bi bi-broadcast-pin"></i> Podcasts</Link>
          </li>
        </ul>
        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogoutClick}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="create-podcast-main">
        <div className="mc-main-header">
          <button 
            className="mc-sidebar-toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>

          <div style={{ flex: 1 }}></div>
          <Link to="/" className="mc-main-logo">MindComfort <img src={logoImg} alt="Logo" /></Link>
        </div>

        <div className="create-podcast-header">
          <button className="back-btn" onClick={() => navigate('/mentor/dashboard')}>
            <i className="bi bi-arrow-left"></i> Back to Home
          </button>
          <h2>Create New Podcast Session</h2>
          <p>Schedule an upcoming live audio session for your clients.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-podcast-form">
          <div className="form-section">
            <h3>Session Details</h3>
            
            <div className="form-group">
              <label>Podcast Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Managing Anxiety in Daily Life"
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Briefly describe what this session will cover..."
                maxLength={1000}
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label>Ticket Price (PKR) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 500 (Enter 0 for Free)"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Schedule</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="form-group">
                <label>End Date <span className="optional-tag">(Optional for series)</span></label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} min={formData.startDate} />
              </div>
            </div>

            {!isSeries && (
              <>
                <div className="single-time-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="text"
                      value={schedule[0]?.startTime || ''}
                      onChange={(e) => handleScheduleChange(0, 'startTime', e.target.value)}
                      placeholder="e.g., 3:00 PM"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="text"
                      value={schedule[0]?.endTime || ''}
                      onChange={(e) => handleScheduleChange(0, 'endTime', e.target.value)}
                      placeholder="e.g., 4:30 PM"
                      required
                    />
                  </div>
                </div>
                <p className="section-subtitle">Time format: 3:00 PM or 15:00</p>
              </>
            )}
          </div>

          {isSeries && (
            <div className="form-section">
              <h3>Daily Timetable</h3>
              <p className="section-subtitle">Set the specific timings for each day of your series.</p>
              
              <p className="section-subtitle" style={{ marginTop: '-10px', marginBottom: '20px', fontSize: '0.85rem', color: '#6c757d' }}>
                Time format: 3:00 PM or 15:00
              </p>
              
              <div className="timetable-list">
                {schedule.map((slot, index) => (
                  <div key={slot.date} className="timetable-row">
                    <div className="timetable-date">
                      {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="timetable-times">
                      <div className="form-group">
                        <label>Start</label>
                        <input
                          type="text"
                          value={slot.startTime}
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          placeholder="e.g., 3:00 PM"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>End</label>
                        <input
                          type="text"
                          value={slot.endTime}
                          onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                          placeholder="e.g., 4:30 PM"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => navigate('/mentor/dashboard')}>Cancel</button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </main>

      {showLogoutModal && (
        <div className="mc-modal-overlay">
          <div className="mc-logout-modal-card">
            <div className="mc-logout-modal-header">
              <h4>Confirm Logout</h4>
            </div>
            <p>Are you sure you want to logout from MindComfort?</p>
            <div className="mc-logout-modal-actions">
              <button className="btn-cancel-logout" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="btn-confirm-logout" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePodcast;