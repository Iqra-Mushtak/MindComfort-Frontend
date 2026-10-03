import React, { useEffect, useState } from 'react';
import api from "../../../utils/api";
import './AdminManualTransactions.css';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://mindcomfort.onrender.com/api';
const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

const getReceiptUrl = (receiptUrl) => {
  if (!receiptUrl) return '';
  if (/^https?:\/\//i.test(receiptUrl)) return receiptUrl;
  return `${backendBaseUrl}${receiptUrl.startsWith('/') ? '' : '/'}${receiptUrl}`;
};

const AdminManualTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manual-transactions/pending');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await api.put(`/manual-transactions/${id}/review`, { status });
      setMessage(`Transaction ${status} successfully!`);
      fetchTransactions(); 
    } catch (err) {
      setMessage('Action failed. Try again.');
    }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-manual-container">
      <h2><i className="bi bi-bank me-2"></i>Manual Bank Transfers</h2>
      <p className="text-muted">Review AI-extracted receipt data and activate subscriptions.</p>

      {message && <div className="alert alert-info">{message}</div>}

      {transactions.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: '#22625d' }}></i>
          <h3>No pending transactions</h3>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((t) => (
            <div key={t._id} className="transaction-card">
              
              <div className="receipt-section">
                <h5>Receipt</h5>
                {/\.(pdf)$/i.test(t.receiptImage || t.receiptUrl || '') ? (
                  <a
                    href={getReceiptUrl(t.receiptImage || t.receiptUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open receipt PDF
                  </a>
                ) : (
                  <img
                    src={getReceiptUrl(t.receiptImage || t.receiptUrl)}
                    alt="Bank Receipt"
                    className="receipt-img"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400?text=No+Image'; }}
                  />
                )}
              </div>

              <div className="details-section">
                <div className="user-info">
                  <h4>{t.userId?.username || 'Unknown User'}</h4>
                  <p className="text-muted">{t.userId?.email}</p>
                </div>
                
                <div className="plan-info">
                  <strong>Plan:</strong> {t.planId?.name || 'N/A'} <br/>
                  <strong>Expected:</strong> PKR {t.planId?.price || 0}
                </div>

                <div className="ai-data-box">
                  <h5><i className="bi bi-robot me-2"></i>AI Extracted Data</h5>
                  {t.aiExtractionError && (
                    <p className="text-danger small">
                      Extraction failed: {t.aiExtractionError}
                    </p>
                  )}
                  <ul>
                    <li><strong>Bank:</strong> {t.aiExtractedData?.bankName || 'Not detected'}</li>
                    <li><strong>Amount:</strong> {t.aiExtractedData?.amount || '0'} PKR</li>
                    <li><strong>Date:</strong> {t.aiExtractedData?.date || 'N/A'}</li>
                    <li><strong>Tx ID:</strong> {t.aiExtractedData?.transactionId || 'N/A'}</li>
                  </ul>
                </div>
              </div>

              <div className="actions-section">
                <h5>Actions</h5>
                <button 
                  className="btn btn-success w-100 mb-2"
                  onClick={() => handleAction(t._id, 'approved')}
                >
                  <i className="bi bi-check-lg me-1"></i> Approve
                </button>
                <button 
                  className="btn btn-danger w-100"
                  onClick={() => handleAction(t._id, 'rejected')}
                >
                  <i className="bi bi-x-lg me-1"></i> Reject
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminManualTransactions;