import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import './PaymentSuccess.css';
import NotificationBell from '../../components/NotificationBell';

const PaymentProcess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = "Payment Process | MindComfort";
        const initPayment = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const clientSecret = location.state?.clientSecret || localStorage.getItem('stripeClientSecret');
            const paymentIntentId = location.state?.paymentIntentId || localStorage.getItem('stripePaymentIntentId');
            const paymentId = localStorage.getItem('paymentId');

            if (!clientSecret || !paymentIntentId || !paymentId) {
                setError('Invalid payment session. Please try again.');
                setLoading(false);
                return;
            }

            try {
                const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51234567890123456789');
                
                if (!stripe) {
                    throw new Error('Failed to load Stripe');
                }

                const response = await fetch(`http://localhost:5000/api/webhooks/payment-status?paymentId=${encodeURIComponent(paymentId)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to verify payment');
                }

                const data = await response.json();

                if (data.payment.status === 'completed') {
                    localStorage.removeItem('stripePaymentIntentId');
                    localStorage.removeItem('stripeClientSecret');
                    localStorage.removeItem('paymentId');
                    navigate('/payment-success', { 
                        state: { 
                            paymentIntentId: paymentIntentId,
                            paymentId: paymentId
                        }
                    });
                } else if (data.payment.status === 'pending') {
                    navigate('/payment-success', { 
                        state: { 
                            paymentIntentId: paymentIntentId,
                            paymentId: paymentId
                        }
                    });
                } else {
                    throw new Error('Payment failed. Please try again.');
                }
            } catch (err) {
                console.error('Payment error:', err);
                setError(err.message || 'Failed to process payment. Please try again.');
                setLoading(false);
            }
        };

        initPayment();
    }, [navigate, location]);

    if (loading && !error) {
        return (
            <div className="payment-container">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px' }}>
                    <NotificationBell />
                </div>
                <div className="payment-loading">
                    <p>Processing your payment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="payment-container">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px' }}>
                    <NotificationBell />
                </div>
                <div className="payment-error-box">
                    <i className="bi bi-exclamation-circle"></i>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button 
                            onClick={() => navigate('/client/plans')}
                            className="btn-back"
                        >
                            Back to Plans
                        </button>
                        <button 
                            onClick={() => {
                                setLoading(true);
                                setError(null);
                                window.location.reload();
                            }}
                            className="btn-retry"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default PaymentProcess;
