import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../client/ClientDashboard.css';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [paymentStatus, setPaymentStatus] = useState('loading');
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('token');
    const paymentId = searchParams.get('payment_id');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (!paymentId) {
            setError('Invalid payment session');
            setPaymentStatus('error');
            return;
        }

        fetchPaymentStatus();
    }, [token,  paymentId, navigate]);

    const fetchPaymentStatus = async () => {
        try {
            const params = new URLSearchParams();
            params.append('payment_id', paymentId);

            const response = await fetch(`http://localhost:5000/api/webhooks/payment-status?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch payment status');
            }

            const data = await response.json();

            if (data.payment.status === 'completed' && data.subscription) {
                setPaymentStatus('success');
                setSubscriptionDetails(data);
            } else if (data.payment.status === 'pending') {
                setPaymentStatus('pending');
                setSubscriptionDetails(data);
                setTimeout(fetchPaymentStatus, 3000);
            } else {
                setPaymentStatus('failed');
                setError('Payment could not be verified');
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
