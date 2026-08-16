import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import logoImg from '../../assets/logo.png';
import './ClientMentors.css';

const ClientMentors = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchMentors();
  }, [navigate]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/mentors/public');
      const mentorData = res.data?.mentors || res.data?.data || res.data || [];
      const mentorsList = Array.isArray(mentorData) ? mentorData : [];
      setMentors(mentorsList);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setMentors([]);
    } finally {
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

  const filteredMentors = mentors.filter(m => {
    const fullName = m.fullName || m.username || '';
    const expertise = Array.isArray(m.expertise) ? m.expertise.join(' ') : m.expertise || '';
    return fullName.toLowerCase().includes(search.toLowerCase()) ||
           expertise.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="dashboard-container">
      <aside className="mc-sidebar">
        <Link to="/client/profile" style={{ textDecoration: 'none' }}>
          <div className="mc-user-info-top">
            <div className="mc-user-avatar">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="mc-user-details">
              <h6>{user?.username || 'User'}</h6>
              <small>{user?.role === 'mentor' ? 'Mentor' : 'Client'}</small>
            </div>
          </div>
        </Link>

        <ul className="mc-nav-menu">
          <li className="mc-nav-item">
            <Link to="/client/dashboard" className="mc-nav-link">
              <i className="bi bi-house-fill"></i> Home
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/client/plans" className="mc-nav-link">
              <i className="bi bi-bookmark-star-fill"></i> Subscription Plans
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/chatrooms" className="mc-nav-link">
              <i className="bi bi-chat-dots-fill"></i> Community Chat
            </Link>
          </li>
          <li className="mc-nav-item">
            <Link to="/client/podcasts" className="mc-nav-link">
              <i className="bi bi-broadcast-pin"></i> Podcasts
            </Link>
          </li>
          <li className="mc-nav-item active">
            <Link to="/client/mentors" className="mc-nav-link active">
              <i className="bi bi-person-heart"></i> Mentors
            </Link>
          </li>
        </ul>

        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className="mc-main-content">
        <div className="mc-main-header">
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="mc-notification-btn">
              <i className="bi bi-bell-fill"></i>
              <span className="mc-badge">3</span>
            </button>
            <Link to="/client/dashboard" className="mc-main-logo">
              MindComfort <img src={logoImg} alt="MindComfort Logo" />
            </Link>
          </div>
        </div>

        <div className="client-mentors-content-wrapper">
          {selectedMentor ? (
            <div className="mentor-detail-view">
              <button className="btn-back-mentors" onClick={() => setSelectedMentor(null)}>
                Back to Mentors List
              </button>

              <div className="mentor-full-card">
                <div className="mentor-header-banner">
                  <div className="mentor-avatar-large">
                    {(selectedMentor.fullName || selectedMentor.username || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div className="mentor-header-info">
                    <h2>{selectedMentor.fullName || selectedMentor.username}</h2>
                    <p className="mentor-qualification">{selectedMentor.qualification || 'Certified Mentor'}</p>
                    <span className="mentor-experience-badge">
                      {selectedMentor.experience || '1+'} Years Experience
                    </span>
                  </div>
                </div>

                <div className="mentor-body-content">
                  {/* <div className="mentor-section-block">
                    <h4>About</h4>
                    <p>{selectedMentor.bio || selectedMentor.description || 'No biography provided.'}</p>
                  </div> */}

                  <div className="mentor-section-block">
                    <h4>Areas of Expertise</h4>
                    <div className="expertise-tags">
                      {Array.isArray(selectedMentor.expertise) ? (
                        selectedMentor.expertise.map((item, idx) => (
                          <span key={idx} className="expertise-tag">{item}</span>
                        ))
                      ) : (
                        <span className="expertise-tag">{selectedMentor.expertise || 'General Guidance'}</span>
                      )}
                    </div>
                  </div>

                  <div className="mentor-section-block">
                    <h4>Availability Schedule</h4>
                    {selectedMentor.availabilitySchedule && selectedMentor.availabilitySchedule.length > 0 ? (
                      <div className="schedule-list">
                        {selectedMentor.availabilitySchedule.map((slot, idx) => (
                          <div key={idx} className="schedule-item">
                            <span className="schedule-day"><i className="bi bi-calendar-event"></i> {slot.day}</span>
                            <span className="schedule-time"><i className="bi bi-clock"></i> {slot.timeSlot || `${slot.startTime} - ${slot.endTime}`}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No specific schedule set for this mentor.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mentors-list-view">
              <div className="mentors-header">
                <h2>Our Community Mentors</h2>
                <p>Connect with experienced specialists dedicated to supporting your mental well-being.</p>
              </div>

              <div className="mentors-search-bar">
                <input
                  type="text"
                  placeholder="Search by mentor name or expertise..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="loading-mentors">Loading mentors...</div>
              ) : filteredMentors.length === 0 ? (
                <div className="empty-mentors-state">No mentors found.</div>
              ) : (
                <div className="mentors-grid">
                  {filteredMentors.map(mentor => (
                    <div 
                      key={mentor._id} 
                      className="mentor-card-item"
                      onClick={() => setSelectedMentor(mentor)}
                    >
                      <div className="mentor-card-top">
                        <div className="mentor-avatar">
                          {(mentor.fullName || mentor.username || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div className="mentor-card-info">
                          <h3>{mentor.fullName || mentor.username}</h3>
                          <small>{mentor.qualification || 'Mental Health Specialist'}</small>
                        </div>
                      </div>

                      <div className="mentor-card-body">
                        <div className="mentor-expertise-summary">
                          <strong>Expertise:</strong>
                          <p>
                            {Array.isArray(mentor.expertise) 
                              ? mentor.expertise.slice(0, 3).join(', ') 
                              : mentor.expertise || 'General Guidance'}
                          </p>
                        </div>

                        {/* <div className="mentor-schedule-summary">
                          <strong>Schedule:</strong>
                          <p>
                            {mentor.availabilitySchedule && mentor.availabilitySchedule.length > 0 
                              ? mentor.availabilitySchedule.map(s => s.day).join(', ') 
                              : 'Flexible / On Request'}
                          </p>
                        </div> */}
                      </div>

                      <div className="mentor-card-footer">
                        <button className="btn-view-profile">View Availability Schedule</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientMentors;