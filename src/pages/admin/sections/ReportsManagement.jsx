import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../AdminDashboard.css';
import { useLocation } from 'react-router-dom';

const ReportsManagement = ({ isModerator = false }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const apiPrefix = isModerator || user?.role === 'moderator' ? '/moderator' : '/admin';
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState(() => {
     return location.state?.defaultStatus || 'all';
   });
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    document.title = "Reports Management | MindComfort";
    fetchReports();
  }, [page, search, statusFilter, dateFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter !== 'all') query.append('status', statusFilter);
      if (dateFilter !== 'all') query.append('dateFilter', dateFilter);
      query.append('page', page);
      query.append('limit', 20);

      const res = await api.get(`${apiPrefix}/reports/pending?${query}`);
      setReports(res.data.reports);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (reportId) => {
    if (window.confirm('Delete this message?')) {
      try {
        await api.patch(`${apiPrefix}/reports/${reportId}/delete-message`);
        alert('Message deleted');
        fetchReports();
      } catch (err) {
        alert('Failed to delete message');
      }
    }
  };

  const handleWarnUser = async (reportId) => {
    if (window.confirm('Warn this user?')) {
      try {
        await api.patch(`${apiPrefix}/reports/${reportId}/warn-user`);
        alert('User warned');
        fetchReports();
      } catch (err) {
        alert('Failed to warn user');
      }
    }
  };

  const handleSuspendUser = async (reportId) => {
    if (window.confirm('Suspend this user?')) {
      try {
        await api.patch(`${apiPrefix}/reports/${reportId}/suspend-user`);
        alert('User suspended');
        fetchReports();
      } catch (err) {
        alert('Failed to suspend user');
      }
    }
  };

  const handleRejectReport = async (reportId) => {
    if (window.confirm('Reject this report?')) {
      try {
        await api.patch(`${apiPrefix}/reports/${reportId}/reject`);
        alert('Report rejected');
        fetchReports();
      } catch (err) {
        alert('Failed to reject report');
      }
    }
  };

  const getReportedContent = (report) => {
    return report.message || report.content || 'No content provided';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'resolved': return 'status-resolved';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      default: return status || 'Unknown';
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Reports & Moderation</h2>
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={dateFilter} 
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="reports-grid">
        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">No reports found</div>
        ) : (
          reports.map(report => (
            <div key={report._id} className="report-card">
              <div className="card-header">
                <h4>
                  {report.reason === 'Other' && report.otherReason 
                    ? `Other: ${report.otherReason}` 
                    : report.reason || 'Not specified'}
                </h4>
                <span className={`report-status-badge ${getStatusBadgeClass(report.status)}`}>
                  {getStatusLabel(report.status)}
                </span>
              </div>
              
              <div className="card-body">
                <p>
                  <strong>Content:</strong> "
                  {getReportedContent(report).substring(0, 100)}
                  {getReportedContent(report).length > 100 ? '...' : ''}"
                </p>
                <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="card-actions">
                <button className="btn-view" onClick={() => setSelectedReport(report)}>
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {total > 20 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</button>
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-flex">
              <div className="modal-title-flex">
                <h3>Report Details</h3>
                <span className={`report-status-badge ${getStatusBadgeClass(selectedReport.status)}`}>
                  {getStatusLabel(selectedReport.status)}
                </span>
              </div>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="report-detail-section">
                <div className="detail-row">
                  <label>Reported By</label>
                  <span>{selectedReport.reportedBy?.username || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <label>Reported User</label>
                  <span>{selectedReport.reportedUser?.username || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <label>Reason</label>
                  <span>
                    {selectedReport.reason === 'Other' && selectedReport.otherReason 
                      ? `Other: ${selectedReport.otherReason}` 
                      : selectedReport.reason || 'Not specified'}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Reported Content</label>
                  <span className="reported-message">{getReportedContent(selectedReport)}</span>
                </div>
                <div className="detail-row">
                  <label>Reported On</label>
                  <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-close-action" onClick={() => setSelectedReport(null)}>Close</button>
                {selectedReport.status === 'pending' && (
                  <>
                    <button className="btn-delete-action" onClick={() => handleDeleteMessage(selectedReport._id)}>
                      Delete Message
                    </button>
                    <button className="btn-warn-action" onClick={() => handleWarnUser(selectedReport._id)}>
                      Warn User
                    </button>
                    <button className="btn-suspend-action" onClick={() => handleSuspendUser(selectedReport._id)}>
                      Suspend User
                    </button>
                    <button className="btn-reject-action" onClick={() => handleRejectReport(selectedReport._id)}>
                      Reject Report
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;