import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('client');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [mentorPendingError, setMentorPendingError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Signup | MindComfort";
    const urlRole = searchParams.get('role');
    setRole(urlRole === 'mentor' ? 'mentor' : 'client');
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validatePassword = (password) => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password.length > 100) return "Password cannot exceed 100 characters.";
    if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter.";
    if (!/[0-9]/.test(password)) return "Must contain at least one digit.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return "Must contain at least one symbol.";
    if (/\s/.test(password)) return "Password cannot contain spaces.";
    return null;
  };

  const validateUsername = (username) => {
    if (username.length < 3) return "Username must be at least 3 characters.";
    if (username.length > 30) return "Username cannot exceed 30 characters.";
    return null;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const usernameError = validateUsername(formData.username);
    if (usernameError) return setError(usernameError);

    const emailError = validateEmail(formData.email);
    if (emailError) return setError(emailError);

    const passwordError = validatePassword(formData.password);
    if (passwordError) return setError(passwordError);

    setLoading(true);
    try {
      const response = await api.post('/auth/register', { ...formData, role });
      const encodedEmail = encodeURIComponent(formData.email);
      navigate(`/verify-otp?email=${encodedEmail}&role=${role}`, { 
        state: { email: formData.email, role, message: response.data.message } 
      });
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.status === 'mentor_pending_application') {
        setMentorPendingError({ message: errorData.message, email: errorData.email });
        setError('');
      } else {
        setError(err.response?.data?.message || 'An error occurred during signup.');
        setMentorPendingError(null);
      }
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
          {role === 'client' ? (
            <>
              <h1>Start your journey toward mental clarity today.</h1>
              <p>
                Create an anonymous account to connect with empathetic mentors, access private catharsis spaces, and heal at your own pace.
              </p>
            </>
          ) : (
            <>
              <h1>Guide others with empathy and experience.</h1>
              <p>
                Apply to become a verified MindComfort mentor. Support individuals seeking catharsis in a safe, structured, and professional environment.
              </p>
            </>
          )}
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
            <h2 className="auth-header-title mb-1">Create Your Account</h2>
            <p className="auth-header-sub">
              Signing up as: <strong className="text-capitalize text-dark">{role}</strong>
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '10px' }}>
              {error}
            </div>
          )}

          {mentorPendingError && (
            <div className="alert alert-warning py-3 small mb-3" style={{ borderRadius: '10px' }}>
              <p className="mb-2">{mentorPendingError.message}</p>
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-sm btn-mc-primary" onClick={() => localStorage.setItem('redirectTo', '/mentor-application')}>
                  Log In
                </Link>
                <Link to="/mentor-application" state={{ email: mentorPendingError.email }} className="btn btn-sm btn-outline-warning">
                  Go to Application
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Username</label>
              <input 
                type="text" 
                className="form-control mc-input" 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                required 
                placeholder="Choose a username"
                minLength={3}
                maxLength={30}
              />
            </div>

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
              <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
              </div>
            </div>

            <button type="submit" className="btn btn-mc-primary w-100 mb-3" disabled={loading}>
              {loading ? 'Creating Account...' : `Sign Up as ${role === 'client' ? 'Client' : 'Mentor'}`}
            </button>

            <p className="small mb-0 text-center text-muted">
              Already have an account?{' '}
              <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: 'var(--mc-primary)' }}>
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;