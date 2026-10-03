import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './ClientDashboard.css';
import './PlansList.css';
import logoImg from '../../assets/logo.png';
import PurchaseModal from './PurchaseModal';
import NotificationBell from '../../components/NotificationBell';
import api from '../../utils/api';

const PlansList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [selectedPlanName, setSelectedPlanName] = useState(null);
    const [purchasing, setPurchasing] = useState(false);
    const [user, setUser] = useState(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [purchaseError, setPurchaseError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [transactionStatuses, setTransactionStatuses] = useState({});
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        document.title = "Subscription Plans | MindComfort";
        if (!token || !userData) {
            navigate('/login');
            return;
        }
        setUser(userData);
        fetchPlans();
    }, [navigate, token]);

    useEffect(() => {
        if (plans.length > 0) {
            fetchTransactionStatuses();
        }
    }, [plans]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setLoadError(false);
            const response = await api.get('/plans/available');
            setPlans(response.data.plans || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching plans:', err);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionStatuses = async () => {
        try {
            const [transactionsResponse, subscriptionsResponse] = await Promise.all([
                api.get('/manual-transactions/mine'),
                api.get('/subscriptions/status')
            ]);
            const activeTypes = subscriptionsResponse.data.subscriptions
                .filter((subscription) => subscription.status === 'active')
                .map((subscription) => subscription.type);
            const pendingTypes = transactionsResponse.data
                .filter((transaction) => transaction.status === 'pending' && transaction.planId?.type)
                .map((transaction) => transaction.planId.type);
            const overlaps = (firstType, secondType) => {
                const firstFeatures = firstType === 'both' ? ['chat', 'podcast'] : [firstType];
                const secondFeatures = secondType === 'both' ? ['chat', 'podcast'] : [secondType];
                return firstFeatures.some((feature) => secondFeatures.includes(feature));
            };
            const statuses = {};
            plans.forEach((plan) => {
                if (activeTypes.some((type) => overlaps(type, plan.type))) {
                    statuses[plan._id] = 'active';
                } else if (pendingTypes.some((type) => overlaps(type, plan.type))) {
                    statuses[plan._id] = 'pending';
                }
            });
            setTransactionStatuses(statuses);
        } catch (err) {
            console.error('Error fetching purchase statuses:', err);
        }
    };

    const handleSubscribe = (plan) => {
        setSelectedPlan(plan);
        setPurchaseError('');
        setUploadSuccess('');
        setIsPurchaseModalOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!selectedPlan) return;
        setIsPurchasing(true);
        setPurchaseError('');
        try {
            const response = await api.post('/subscriptions/purchase', { 
                planId: selectedPlan._id 
            });
            const data = response.data;
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
            setPurchaseError(err.response?.data?.message || err.message || 'Failed to process purchase. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleManualUpload = async (file, planId) => {
        if (!file) {
            setPurchaseError('Please select a receipt file.');
            return;
        }
        if (!planId) {
            setPurchaseError('The selected plan could not be identified. Please close and reopen the purchase window.');
            return;
        }

        setIsPurchasing(true);
        setPurchaseError('');
        try {
            const formData = new FormData();
            formData.append('receipt', file);
            formData.append('planId', planId);

            await api.post('/manual-transactions/submit', formData);
            setTransactionStatuses((current) => ({ ...current, [planId]: 'pending' }));
            setUploadSuccess('Receipt uploaded successfully. It is being reviewed by an administrator.');
            handleCancelPurchase();
        } catch (err) {
            console.error('Manual upload error:', err);
            setPurchaseError(err.response?.data?.message || 'Failed to upload receipt');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleCancelPurchase = () => {
        setIsPurchaseModalOpen(false);
        setSelectedPlan(null);
        setPurchaseError('');
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    if (!user) return null;

    return (
        <div className="dashboard-container">
            {sidebarOpen && (
                <div className="mc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
            )}
            
            <aside className={`mc-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                    <li className="mc-nav-item">
                        <Link to="/client/mentors" className="mc-nav-link">
                            <i className="bi bi-person-heart"></i> Mentors
                        </Link>
                    </li>
                </ul>
                <div className="mc-sidebar-footer">
                    <button className="mc-logout-btn" onClick={handleLogoutClick}>
                        <i className="bi bi-box-arrow-right"></i> Log Out
                    </button>
                </div>
            </aside>
            <main className="mc-main-content">
                <div className="mc-main-header">
                    <button 
                        className="mc-sidebar-toggle-btn" 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle Sidebar"
                    >
                        <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
                    </button>
                    <div className="plans-header-spacer"></div>
                    <div className="plans-header-controls">
                        <NotificationBell />
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
                {uploadSuccess && (
                    <div className="alert alert-success d-flex align-items-center" role="status">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {uploadSuccess}
                    </div>
                )}
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
                                    disabled={Boolean(transactionStatuses[plan._id]) || (purchasing && selectedPlanId === plan._id)}
                                    className="plan-subscribe-btn"
                                >
                                    {transactionStatuses[plan._id] === 'active'
                                        ? 'Active'
                                        : transactionStatuses[plan._id] === 'pending' || transactionStatuses[plan._id] === 'approved'
                                            ? 'Submitted - Awaiting Approval'
                                            : purchasing && selectedPlanId === plan._id
                                                ? 'Processing...'
                                                : 'Subscribe Now'}
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
                onClearError={() => setPurchaseError('')}
                onManualUpload={handleManualUpload}
            />
            {showLogoutModal && (
                <div className="mc-modal-overlay">
                    <div className="mc-logout-modal-card">
                        <div className="mc-logout-modal-header">
                            <h4>Confirm Logout</h4>
                        </div>
                        <p>Are you sure you want to logout from MindComfort?</p>
                        <div className="mc-logout-modal-actions">
                            <button className="btn-cancel-logout" onClick={cancelLogout}>
                                Cancel
                            </button>
                            <button className="btn-confirm-logout" onClick={confirmLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlansList;