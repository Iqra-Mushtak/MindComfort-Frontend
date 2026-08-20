import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './AdminDashboard.css';
import logoImg from '../../assets/logo.png';
import NotificationBell from '../../components/NotificationBell';

import ClientsManagement from './sections/ClientsManagement';
import MentorsManagement from './sections/MentorsManagement';
import ModeratorsManagement from './sections/ModeratorsManagement';
import ChatroomsManagement from './sections/ChatroomsManagement';
import PodcastsManagement from './sections/PodcastsManagement';
import ReportsManagement from './sections/ReportsManagement';
import SubscriptionsManagement from './sections/SubscriptionsManagement';
import AdminProfile from './sections/AdminProfile';
import LiveChatFeed from './sections/LiveChatFeed';
import LivePodcast from './sections/LivePodcast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [stats, setStats] = useState({
    totalClients: 0,
    activeMentors: 0,
    pendingReports: 0,
    totalRevenue: 0,
    pendingApplications: 0,
    pendingPodcasts: 0,
    quickView: { applications: [], podcasts: [], reports: [] }
  });

  const fetchAdminStats = async () => {
    try {
      const res = await api.get('/admin/insights');
      const data = res.data.insights;

      setStats({
        totalClients: data.chat?.subscribedClients || 0,
        activeMentors: data.users?.activeMentors || 0,
        pendingReports: data.moderation?.pendingReports || 0,
        totalRevenue: data.subscriptions?.totalRevenue || 0,
        pendingApplications: data.moderation?.pendingMentorApplications || 0,
        pendingPodcasts: data.podcasts?.pendingPodcastLists || 0,
        quickView: data.quickView || { applications: [], podcasts: [], reports: [] } 
      });
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchAdminStats();
  }, [navigate]);

  useEffect(() => {
    window.onNavigateToMentors = () => setActiveSection('mentors');
    window.onNavigateToPodcasts = () => setActiveSection('podcasts');
    window.onNavigateToReports = () => setActiveSection('reports');
    
    return () => {
      delete window.onNavigateToMentors;
      delete window.onNavigateToPodcasts;
      delete window.onNavigateToReports;
    };
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true); 
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview stats={stats} onRefresh={fetchAdminStats} />;
      case 'clients':
        return <ClientsManagement />;
      case 'mentors':
        return <MentorsManagement />;
      case 'moderators':
        return <ModeratorsManagement />;
      case 'chatrooms':
        return <ChatroomsManagement />;
      case 'podcasts':
        return <PodcastsManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'subscriptions':
        return <SubscriptionsManagement />;
      case 'profile':
        return <AdminProfile user={user} />;
      case 'live-chat':
        return <LiveChatFeed />;
      case 'live-podcast':
        return <LivePodcast />;
      default:
        return <DashboardOverview stats={stats} onRefresh={fetchAdminStats} />;
    }
  };

  if (!user) return null;
  if (loading) return <div className="admin-loading">Loading dashboard data...</div>;

  return (
    <div className="admin-dashboard-container">
      {sidebarOpen && (
        <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div 
          className="mc-user-info-top clickable-profile"
          onClick={() => setActiveSection('profile')}
          title="View My Profile"
        >
          <div className="mc-user-avatar">{(user.username || 'A').charAt(0).toUpperCase()}</div>
          <div className="mc-user-details">
            <h6>{user.username || 'Admin'}</h6>
            <small>{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin'}</small>
          </div>
        </div>

        <ul className="mc-nav-menu">
          <li className={`mc-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('dashboard'); setSidebarOpen(false); }}>
              <i className="bi bi-grid-fill"></i> Home
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'clients' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('clients'); setSidebarOpen(false); }}>
              <i className="bi bi-people-fill"></i> Clients
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'mentors' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('mentors'); setSidebarOpen(false); }}>
              <i className="bi bi-person-badge-fill"></i> Mentors
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'moderators' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('moderators'); setSidebarOpen(false); }}>
              <i className="bi bi-shield-lock-fill"></i> Moderators
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'chatrooms' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('chatrooms'); setSidebarOpen(false); }}>
              <i className="bi bi-chat-dots-fill"></i> Chatrooms
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'podcasts' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('podcasts'); setSidebarOpen(false); }}>
              <i className="bi bi-broadcast-pin"></i> Podcasts
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'live-chat' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('live-chat'); setSidebarOpen(false); }}>
              <i className="bi bi-chat-left-dots"></i> Live Chat
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'live-podcast' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('live-podcast'); setSidebarOpen(false); }}>
              <i className="bi bi-broadcast"></i> Live Podcast
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'reports' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('reports'); setSidebarOpen(false); }}>
              <i className="bi bi-flag-fill"></i> Reports
            </button>
          </li>
          <li className={`mc-nav-item ${activeSection === 'subscriptions' ? 'active' : ''}`}>
            <button className="mc-nav-link" onClick={() => { setActiveSection('subscriptions'); setSidebarOpen(false); }}>
              <i className="bi bi-credit-card-fill"></i> Subscriptions
            </button>
          </li>
        </ul>

        <div className="mc-sidebar-footer">
          <button className="mc-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Log Out
          </button>
        </div>
      </aside>

      <main className={`admin-main-content ${activeSection === 'live-chat' ? 'live-chat-active' : ''}`}>
        <div className="mc-main-header">
          <button 
            className="mc-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Sidebar"
          >
            <i className="bi bi-list"></i>
          </button>

          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <NotificationBell />

            <Link to="/admin/dashboard" className="mc-main-logo">
              MindComfort <img src={logoImg} alt="Logo" />
            </Link>
          </div>
        </div>

        <div className="admin-content-wrapper">
          {renderContent()}
        </div>
      </main>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of your admin account?</p>
            <div className="logout-card-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm-logout" onClick={confirmLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardOverview = ({ stats, onRefresh }) => {
  const quickView = stats.quickView || { applications: [], podcasts: [], reports: [] };

  const handleViewApplications = () => {
    if (window.onNavigateToMentors) {
      window.onNavigateToMentors();
      setTimeout(() => { window.setMentorsTab && window.setMentorsTab('applications'); }, 100);
    }
  };

  const handleViewPodcasts = () => {
    if (window.onNavigateToPodcasts) {
      window.onNavigateToPodcasts();
      setTimeout(() => { window.setPodcastFilter && window.setPodcastFilter('pending'); }, 100);
    }
  };

  const handleViewReports = () => {
    if (window.onNavigateToReports) {
      window.onNavigateToReports();
      setTimeout(() => { window.setReportFilter && window.setReportFilter('pending'); }, 100);
    }
  };

  const handleItemClick = (type, item) => {
    switch(type) {
      case 'applications': handleViewApplications(); break;
      case 'podcasts': handleViewPodcasts(); break;
      case 'reports': handleViewReports(); break;
      default: break;
    }
  };

  return (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <StatCard title="Total Chat Subscribed Clients" value={stats.totalClients} icon="bi-people" color="blue" />
        <StatCard title="Active Mentors" value={stats.activeMentors} icon="bi-person-badge" color="green" />
        <StatCard title="Pending Reports" value={stats.pendingReports} icon="bi-flag" color="red" isNew={stats.pendingReports > 0} />
        <StatCard title="Total Revenue" value={`PKR ${stats.totalRevenue.toLocaleString()}`} icon="bi-currency-dollar" color="purple" />
        <StatCard title="Pending Applications" value={stats.pendingApplications} icon="bi-file-earmark-person" color="orange" isNew={stats.pendingApplications > 0} />
        <StatCard title="Pending Podcasts" value={stats.pendingPodcasts} icon="bi-broadcast" color="teal" isNew={stats.pendingPodcasts > 0} />
      </div>

      <div className="quick-view-grid">
        <QuickViewCard 
          title="Pending Applications" 
          linkText="View all" 
          items={quickView.applications}
          onViewAll={handleViewApplications}
          onItemClick={(item) => handleItemClick('applications', item)}
        />
        <QuickViewCard 
          title="Pending Podcast Lists" 
          linkText="View all" 
          items={quickView.podcasts}
          onViewAll={handleViewPodcasts}
          onItemClick={(item) => handleItemClick('podcasts', item)}
        />
        <QuickViewCard 
          title="Pending Reports" 
          linkText="View all" 
          items={quickView.reports}
          onViewAll={handleViewReports}
          onItemClick={(item) => handleItemClick('reports', item)}
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, isNew = false }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-header">
      <i className={`bi ${icon}`}></i>
      {isNew && <span className="new-dot"></span>}
    </div>
    <div className="stat-body">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </div>
);

const QuickViewCard = ({ title, linkText, items, onViewAll, onItemClick }) => (
  <div className="quick-view-card">
    <div className="qv-header">
      <h4>{title}</h4>
      <button className="qv-view-all" onClick={onViewAll}>{linkText}</button>
    </div>
    <div className="qv-body">
      {items.length === 0 ? (
        <p className="empty-state">No pending items.</p>
      ) : (
        items.map((item, idx) => (
          <div 
            key={idx} 
            className="qv-item clickable"
            onClick={() => onItemClick && onItemClick(item)}
          >
            <p className="qv-item-title">{item.title || item.name}</p>
            {item.speaker && <small className="qv-item-sub">{item.speaker}</small>}
            <small className="qv-item-time">{item.time || 'Just now'}</small>
          </div>
        ))
      )}
    </div>
  </div>
);

export default AdminDashboard;