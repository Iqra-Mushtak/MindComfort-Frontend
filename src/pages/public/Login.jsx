import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // React.useEffect(() => {
  //   const user = JSON.parse(localStorage.getItem('user'));
  //   const token = localStorage.getItem('token');

  //   if (token && user) {
  //     if (user.role === 'mentor') {
  //       navigate('/mentor/dashboard');
  //     } else if (user.role === 'admin' || user.role === 'moderator') {
  //       navigate('/admin/dashboard');
  //     } else {
  //       navigate('/client/dashboard');
  //     }
  //   }
  // }, [navigate]);

  const navigate = useNavigate();

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

  useEffect(() => {
    document.title = "Login | MindComfort";
  }, []);

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

              <h2 className="fw-bold mb-4" style={{ color: 'var(--mc-primary)' }}>Welcome Back</h2>
              
              {error && (
                <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '12px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="text-start">
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
                    placeholder="Enter your password"
                  />
                </div>

                <div className="d-flex justify-content-end mb-4">
                  <Link to="/forgot-password" className="small text-decoration-none" style={{ color: 'var(--mc-primary)' }}>
                    Forgot Password?
                  </Link>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-mc-primary w-100 mb-3" 
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>

                <p className="small mb-0 text-center">
                  Don't have an account?{' '}
                  <Link to="/signup" className="fw-semibold text-decoration-none" style={{ color: 'var(--mc-primary)' }}>
                    Sign Up
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

export default Login;