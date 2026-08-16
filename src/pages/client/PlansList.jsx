import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './ClientDashboard.css';
import './PlansList.css';
import logoImg from '../../assets/logo.png';
import PurchaseModal from './PurchaseModal';

const PlansList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [purchasing, setPurchasing] = useState(false);
    const [user, setUser] = useState(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [purchaseError, setPurchaseError] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);

    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!token || !userData) {
            navigate('/login');
            return;
        }
        setUser(userData);
        fetchPlans();
    }, [navigate, token]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setLoadError(false);
            const response = await fetch('http://localhost:5000/api/plans/available', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch plans');
            }

            const data = await response.json();
            setPlans(data.plans || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching plans:', err);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = (plan) => {
        setSelectedPlan(plan);
        setPurchaseError('');
        setIsPurchaseModalOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!selectedPlan) return;
        setIsPurchasing(true);
        setPurchaseError('');
        try {
            const response = await fetch('http://localhost:5000/api/subscriptions/purchase', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ planId: selectedPlan._id })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create subscription');
            }
            const data = await response.json();
            
            if (data.checkoutUrl) {
                localStorage.setItem('paymentId', data.paymentId);
                if (data.sessionId) {
                    localStorage.setItem('stripeSessionId', data.sessionId);
                }
                console.log('Redirecting to Stripe Checkout:', data.checkoutUrl);
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (err) {
            console.error('Purchase error:', err);
            setPurchaseError(err.message || 'Failed to process purchase. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleCancelPurchase = () => {
        setIsPurchaseModalOpen(false);
        setSelectedPlan(null);
        setPurchaseError('');
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <aside className="mc-sidebar">
                <Link to="/client/profile" style={{ textDecoration: 'none' }}>
                    <div className="mc-user-info-top">
                        <div className="mc-user-avatar">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
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
                        <Link to="/client/plans" className="mc-nav-link active">
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
                {/* Header */}
                <div className="mc-main-header">
                    <div className="plans-header-spacer"></div>
                    <div className="plans-header-controls">
                        <button className="mc-notification-btn">
                            <i className="bi bi-bell-fill"></i>
                            <span className="mc-badge">3</span>
                        </button>
                        <Link to="/client/dashboard" className="mc-main-logo">
                            MindComfort
                            <img src={logoImg} alt="MindComfort Logo" />
                        </Link>
                    </div>
                </div>

                {/* Welcome Header */}
                <div className="plans-page-header">
                    <h2>Subscription Plans</h2>
                    <p>Choose the perfect plan to unlock premium features and content.</p>
                </div>

                {loading && (
                    <div className="plans-loading">
                        <p>Loading plans...</p>
                    </div>
                )}

                {!loading && loadError && (
                    <p className="error-text">Failed to load plans. Please try again.</p>
                )}

                {!loading && !loadError && plans.length === 0 && (
                    <p className="empty-state-text">No subscription plans available at the moment.</p>
                )}

                {!loading && !error && plans.length > 0 && (
                    <div className="plans-grid">
                        {plans.map((plan) => (
                            <div key={plan._id} className="plan-card">
                                <h4>{plan.name}</h4>
                                <p className="plan-card-description">
                                    {plan.description}
                                </p>

                                <div className="plan-card-pricing">
                                    <p className="plan-price">
                                        {plan.currency} {plan.price.toFixed(2)}
                                    </p>
                                    <p className="plan-duration">
                                        for {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
                                    </p>
                                </div>

                                {plan.features && plan.features.length > 0 && (
                                    <div className="plan-features">
                                        <p className="plan-features-title">
                                            Features:
                                        </p>
                                        <ul className="plan-features-list">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx}>
                                                    <i className="bi bi-check-circle-fill"></i>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={purchasing && selectedPlanId === plan._id}
                                    className="plan-subscribe-btn"
                                >
                                    {purchasing && selectedPlanId === plan._id ? 'Processing...' : 'Subscribe Now'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <PurchaseModal
                isOpen={isPurchaseModalOpen}
                item={selectedPlan}
                itemType="plan"
                onConfirm={handleConfirmPurchase}
                onCancel={handleCancelPurchase}
                isLoading={isPurchasing}
                error={purchaseError}
            />
        </div>
    );
};

export default PlansList;
