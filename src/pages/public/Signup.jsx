import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('client');
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: ''
  });
  const [error, setError] = useState('');
  const [mentorPendingError, setMentorPendingError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'mentor') {
      setRole('mentor');
    } else {
      setRole('client');
    }
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
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const signupData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: role
      };

      const response = await api.post('/auth/register', signupData);
      
      const encodedEmail = encodeURIComponent(formData.email);
      navigate(`/verify-otp?email=${encodedEmail}&role=${role}`, { 
        state: { 
          email: formData.email, 
          role: role,
          message: response.data.message 
        } 
      });

    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.status === 'mentor_pending_application') {
        setMentorPendingError({
          message: errorData.message,
          email: errorData.email
        });
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
    <div className="auth-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="mc-card p-4 p-md-5 text-center auth-card">

                <div className="text-start mb-3">
              <button 
                onClick={() => navigate('/')} 
                className="btn btn-link text-decoration-none p-0"
                style={{ color: 'var(--mc-primary)' }}
              >
                Back to Home
              </button>
            </div>
            
              <h2 className="fw-bold mb-2" style={{ color: 'var(--mc-primary)' }}>
                Create Your Account
              </h2>
              <p className="text-muted mb-4 small">
                Signing up as: <strong className="text-capitalize">{role}</strong>
              </p>
              
              {error && (
                <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '12px' }}>
                  {error}
                </div>
              )}

              {mentorPendingError && (
                <div className="alert alert-warning py-3 small mb-3" style={{ borderRadius: '12px' }}>
                  <p className="mb-3">{mentorPendingError.message}</p>
                  <div className="d-flex gap-2">
                    <Link 
                      to="/login" 
                      className="btn btn-sm btn-mc-primary"
                      onClick={() => localStorage.setItem('redirectTo', '/mentor-application')}
                    >
                      Log In
                    </Link>
                    <Link 
                      to="/mentor-application"
                      state={{ email: mentorPendingError.email }}
                      className="btn btn-sm btn-outline-warning"
                    >
                      Go to Application
                    </Link>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="text-start">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Username</label>
                  <input 
                    type="text" 
                    className="form-control mc-input" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    required 
                    placeholder="Choose a username (3-30 characters)"
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
                    placeholder="Enter your email"
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
                    placeholder="Create a strong password"
                  />
                  <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                    Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol, no spaces
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-mc-primary w-100 mb-3" 
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : `Sign Up as ${role === 'client' ? 'Client' : 'Mentor'}`}
                </button>

                <p className="small mb-0 text-center">
                  Already have an account?{' '}
                  <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: 'var(--mc-primary)' }}>
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;