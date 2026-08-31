import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import api from '../../utils/api';
import './PaymentSuccess.css';

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

                const response = await api.get(`/webhooks/payment-status?paymentId=${encodeURIComponent(paymentId)}`);
                const data = response.data;

                if (data.payment && (data.payment.status === 'completed' || data.payment.status === 'pending')) {
                    localStorage.removeItem('stripePaymentIntentId');
                    localStorage.removeItem('stripeClientSecret');
                    localStorage.removeItem('paymentId');
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
                setError(err.response?.data?.message || err.message || 'Failed to process payment. Please try again.');
                setLoading(false);
            }
        };

        initPayment();
    }, [navigate, location]);

    if (loading && !error) {
        return (
            <div className="payment-container">
                <div className="payment-loading">
                    <p>Processing your payment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        navigate('/client/plans', { state: { purchaseError: error } });
        return null;
    }

    return null;
};

export default PaymentProcess;