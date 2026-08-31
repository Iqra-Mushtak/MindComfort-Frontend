import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login | MindComfort";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const userRole = response.data.user.role;
      if (userRole === 'mentor') {
        navigate('/mentor/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'moderator') {
        navigate('/moderator/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-hero-panel">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <img src="/src/assets/logo.png" alt="MindComfort Logo" />
          <span>MindComfort</span>
        </div>
        <div className="auth-hero-content">
          <h1>Empowering Mindful Connections & Support.</h1>
          <p>A unified platform for individuals seeking guidance and dedicated professionals offering support, built on privacy, empathy, and seamless interaction.</p>
        </div>
        <div className="auth-hero-footer">
          &copy; 2026 MindComfort. All rights reserved.
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="mb-4">
            <button 
              onClick={() => navigate('/')} 
              className="btn-back-home"
            >
              Back to Home
            </button>
          </div>

          <div className="mb-4">
            <h2 className="auth-header-title mb-1">Welcome Back</h2>
            <p className="auth-header-sub">Enter your credentials to access your account.</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '10px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email Address</label>
              <input 
                type="email" 
                className="form-control mc-input" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                placeholder="name@gmail.com"
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Password</label>
              <input 
                type="password" 
                className="form-control mc-input" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                placeholder="••••••••"
              />
            </div>

            <div className="d-flex justify-content-end mb-4">
              <Link to="/forgot-password" className="small text-decoration-none fw-semibold" style={{ color: 'var(--mc-primary)' }}>
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="btn btn-mc-primary w-100 mb-3" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>

            <p className="small mb-0 text-center text-muted">
              Don't have an account?{' '}
              <Link to="/signup" className="fw-semibold text-decoration-none" style={{ color: 'var(--mc-primary)' }}>
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;