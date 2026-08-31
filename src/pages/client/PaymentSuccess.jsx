import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import '../client/ClientDashboard.css';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [paymentStatus, setPaymentStatus] = useState('loading');
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('token');
    const sessionId = searchParams.get('session_id');
    const paymentId = location.state?.paymentId || localStorage.getItem('paymentId'); 

    useEffect(() => {
        document.title = "Payment Success | MindComfort";
        if (!token) {
            navigate('/login');
            return;
        }

        if (!sessionId && !paymentId) {
            setError('Invalid payment session');
            setPaymentStatus('error');
            return;
        }

        fetchPaymentStatus();
    }, [token, sessionId, paymentId, navigate]);

    const fetchPaymentStatus = async () => {
        try {
            if (paymentId) {
                const completeRes = await api.post('/subscriptions/complete-payment', { paymentId });
                setPaymentStatus('success');
                setSubscriptionDetails(completeRes.data);
                localStorage.removeItem('paymentId');
                localStorage.removeItem('stripePaymentIntentId');
                localStorage.removeItem('stripeClientSecret');
                return;
            }

            if (sessionId) {
                const response = await api.get(`/subscriptions/session-status?sessionId=${encodeURIComponent(sessionId)}`);
                const data = response.data;

                if (data.payment && data.payment.status === 'completed') {
                    setPaymentStatus('success');
                    setSubscriptionDetails(data);
                } else if (data.status === 'pending' || (data.payment && data.payment.status === 'pending')) {
                    setPaymentStatus('pending');
                    setSubscriptionDetails(data);
                    setTimeout(fetchPaymentStatus, 2000);
                } else {
                    setPaymentStatus('failed');
                    setError('Payment could not be verified');
                }
            }
        } catch (err) {
            console.error('Error fetching payment status:', err);
            setPaymentStatus('error');
            setError(err.response?.data?.message || err.message || 'Failed to verify payment');
        }
    };

    const handleReturnHome = () => {
        navigate('/client/dashboard');
    };

    if (paymentStatus === 'loading' || paymentStatus === 'pending') {
        return (
            <div className="dashboard-container">
                <main className="mc-main-content payment-container">
                    <div className="payment-loading">
                        <div className="payment-loading-icon">
                            <i className="bi bi-hourglass-split"></i>
                        </div>
                        <h2>Processing Payment</h2>
                        <p>
                            {paymentStatus === 'pending' 
                                ? 'Your payment is being processed. Please wait...' 
                                : 'Verifying your payment...'}
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (paymentStatus === 'error' || paymentStatus === 'failed') {
        navigate('/client/plans', { state: { purchaseError: error || 'Payment failed. Please try again.' } });
        return null;
    }

    if (paymentStatus === 'success' && subscriptionDetails) {
        const { payment, subscription } = subscriptionDetails;
        const isPermanentAccess = subscription && subscription.endDate === null;
        return (
            <div className="dashboard-container">
                <main className="mc-main-content payment-container">
                    <div className="payment-content">
                        <div className="payment-success-icon">
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h2 className="payment-success h2">Payment Successful!</h2>
                        <p className="payment-success-message">
                            Your subscription has been activated successfully.
                        </p>

                        {subscription && (
                            <div className="payment-details">
                                <h4>Subscription Details</h4>
                                <div className="payment-details-grid">
                                    <div className="payment-detail-item">
                                        <p className="payment-detail-label">Plan Name</p>
                                        <p className="payment-detail-value">{subscription.planName}</p>
                                    </div>
                                    <div className="payment-detail-item">
                                        <p className="payment-detail-label">Type</p>
                                        <p className="payment-detail-value">
                                            {subscription.type}
                                        </p>
                                    </div>
                                    <div className="payment-detail-item">
                                        <p className="payment-detail-label">Amount Paid</p>
                                        <p className="payment-detail-value">
                                            {payment.currency} {payment.amount ? payment.amount.toFixed(2) : '0.00'}
                                        </p>
                                    </div>
                                    <div className="payment-detail-item">
                                        <p className="payment-detail-label">Duration</p>
                                        <p className="payment-detail-value">
                                            {isPermanentAccess ? 'Permanent access' : `${subscription.planDurationMonths} months`}
                                        </p>
                                    </div>
                                    <div className="payment-detail-item">
                                        <p className="payment-detail-label">Valid From</p>
                                        <p className="payment-detail-value">
                                            {new Date(subscription.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="payment-detail-item">
                                        <p className="payment-detail-label">Valid Until</p>
                                        <p className="payment-detail-value">
                                            {isPermanentAccess ? 'No expiry' : new Date(subscription.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="payment-info-box">
                            <i className="bi bi-info-circle"></i>
                            You can now access all features included in your subscription.
                        </div>

                        <div className="payment-action-buttons">
                            <button
                                onClick={handleReturnHome}
                                className="payment-btn-secondary"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return null;
};

export default PaymentSuccess;