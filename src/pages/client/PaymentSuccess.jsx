import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../client/ClientDashboard.css';
import './PaymentSuccess.css';
import NotificationBell from '../../components/NotificationBell';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [paymentStatus, setPaymentStatus] = useState('loading');
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('token');
    const sessionId = searchParams.get('session_id');
    const paymentId = localStorage.getItem('paymentId'); 

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
            console.log('fetchPaymentStatus CALLED');
            console.log('paymentId from localStorage:', paymentId);
            console.log('sessionId from URL:', sessionId);

            if (paymentId) {
                console.log('paymentId found, calling complete-payment...');
                const completeResponse = await fetch('http://localhost:5000/api/webhooks/complete-payment', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ paymentId })
                });

                console.log('complete-payment response status:', completeResponse.status);
                console.log('complete-payment response ok:', completeResponse.ok);

                if (completeResponse.ok) {
                    const completeData = await completeResponse.json();
                    console.log('complete-payment SUCCESS:', completeData);
                    setPaymentStatus('success');
                    setSubscriptionDetails(completeData);
                    localStorage.removeItem('paymentId');
                    localStorage.removeItem('stripePaymentIntentId');
                    localStorage.removeItem('stripeClientSecret');
                    return;
                } else {
                    console.log('complete-payment NOT ok, trying fallback...');
                }
            } else {
                console.log('NO paymentId in localStorage!');
            }

            if (sessionId) {
                console.log('sessionId found, calling session-status...');
                const response = await fetch(`http://localhost:5000/api/subscriptions/session-status?sessionId=${encodeURIComponent(sessionId)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('session-status response status:', response.status);

                if (!response.ok) {
                    throw new Error('Failed to fetch payment status');
                }

                const data = await response.json();
                console.log('session-status data:', data);

                if (data.payment && data.payment.status === 'completed') {
                    
                    console.log('Payment completed from session-status');
                    setPaymentStatus('success');
                    setSubscriptionDetails(data);
                } else if (data.status === 'pending' || (data.payment && data.payment.status === 'pending')) {
                   
                    console.log('Payment pending, retrying in 2 seconds...');
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
            setError(err.message || 'Failed to verify payment');
        }
    };

    const handleReturnHome = () => {
        navigate('/client/dashboard');
    };

    const handleViewSubscription = () => {
        navigate('/client/dashboard', { state: { activeTab: 'subscriptions' } });
    };

    if (paymentStatus === 'loading' || paymentStatus === 'pending') {
        return (
            <div className="dashboard-container">
                <main className="mc-main-content payment-container">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px' }}>
                        <NotificationBell />
                    </div>
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
        return (
            <div className="dashboard-container">
                <main className="mc-main-content payment-container">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px' }}>
                        <NotificationBell />
                    </div>
                    <div className="payment-error">
                        <div className="payment-error-icon">
                            <i className="bi bi-x-circle-fill"></i>
                        </div>
                        <h2>Payment Failed</h2>
                        <p className="payment-error-message">
                            {error || 'Your payment could not be processed. Please try again.'}
                        </p>
                        <div className="payment-error-buttons">
                            <button
                                onClick={() => navigate('/client/plans')}
                                className="payment-btn-error"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={handleReturnHome}
                                className="payment-btn-secondary-error"
                            >
                                Return Home
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (paymentStatus === 'success' && subscriptionDetails) {
        const { payment, subscription } = subscriptionDetails;
        const isPermanentAccess = subscription && subscription.endDate === null;
        return (
            <div className="dashboard-container">
                <main className="mc-main-content payment-container">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px' }}>
                        <NotificationBell />
                    </div>
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
                                            {payment.currency} {payment.amount.toFixed(2)}
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
                                onClick={handleViewSubscription}
                                className="payment-btn-primary"
                            >
                                View Subscription
                            </button>
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
