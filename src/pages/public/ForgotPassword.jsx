import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    document.title = "Forgot Password | MindComfort";
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // STEP 1: Send Email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('A reset code has been sent to your email.');
      setStep(2); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationAttempted(true);

    if (otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-reset-otp', { 
        email: String(email), 
        otp: String(otp) 
      });
      setResetToken(response.data.resetToken);
      setSuccessMsg('Code verified! Please set your new password.');
      setStep(3); 
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setVerificationAttempted(false);
    setLoading(true);
    try {
      await api.post('/auth/resend-reset-otp', { email });
      setSuccessMsg('A new code has been sent.');
      setTimer(60);
    } catch (err) {
      setError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const validatePassword = (password) => {
    if (password.length < 8) return "Min 8 characters.";
    if (!/[A-Z]/.test(password)) return "Needs 1 uppercase.";
    if (!/[a-z]/.test(password)) return "Needs 1 lowercase.";
    if (!/[0-9]/.test(password)) return "Needs 1 number.";
    if (!/[!@#$%^&*]/.test(password)) return "Needs 1 symbol.";
    if (/\s/.test(password)) return "No spaces allowed.";
    return null;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword, confirmPassword });
      alert('Password updated successfully! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
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
          <h1>Account Recovery</h1>
          <p>Don't worry—we'll help you securely reset your password and regain access to your account.</p>
        </div>
        <div className="auth-hero-footer">
          &copy; 2026 MindComfort. All rights reserved.
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <button 
              onClick={() => step === 1 ? navigate('/login') : setStep(step - 1)} 
              className="btn-back-home"
            >
              {step === 1 ? 'Back to Login' : 'Go Back'}
            </button>

            <div className="d-flex gap-1">
              <span className={`badge rounded-pill ${step >= 1 ? 'btn-mc-primary' : 'bg-light text-muted'}`}>1</span>
              <span className={`badge rounded-pill ${step >= 2 ? 'btn-mc-primary' : 'bg-light text-muted'}`}>2</span>
              <span className={`badge rounded-pill ${step >= 3 ? 'btn-mc-primary' : 'bg-light text-muted'}`}>3</span>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '10px' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success py-2 small mb-3" style={{ borderRadius: '10px' }}>
              {successMsg}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendCode}>
              <div className="mb-4">
                <h2 className="auth-header-title mb-1">Forgot Password?</h2>
                <p className="auth-header-sub">Enter your registered email to receive a 6-digit verification code.</p>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Email Address</label>
                <input 
                  type="email" 
                  className="form-control mc-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="name@gmail.com"
                />
              </div>

              <button type="submit" className="btn btn-mc-primary w-100 mb-3" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-4">
                <h2 className="auth-header-title mb-1">Verify Code</h2>
                <p className="auth-header-sub">
                  We sent a 6-digit verification code to <span className="fw-bold text-dark">{email}</span>
                </p>
              </div>

              <div className="mb-4">
                <input 
                  type="text" 
                  className="form-control mc-input text-center" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{ fontSize: '1.5rem', letterSpacing: '0.4rem', fontWeight: 'bold' }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-mc-primary w-100 mb-3" disabled={loading || otp.length !== 6}>
                {loading ? 'Verify Code' : 'Verify Code'}
              </button>

              <div className="text-center mb-3">
                <span className="small text-muted">Didn't receive the code? </span>
                <button 
                  type="button" 
                  className="btn btn-link text-decoration-none small fw-semibold p-0 ms-1" 
                  style={{ color: 'var(--mc-primary)' }}
                  onClick={handleResendOtp}
                  disabled={loading || timer > 0}
                >
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <h2 className="auth-header-title mb-1">Set New Password</h2>
                <p className="auth-header-sub">Create a strong new password for your account.</p>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">New Password</label>
                <input 
                  type="password" 
                  className="form-control mc-input" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Confirm Password</label>
                <input 
                  type="password" 
                  className="form-control mc-input" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="btn btn-mc-primary w-100 mb-3" disabled={loading}>
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="small mb-0 text-center text-muted">
            Remember your password?{' '}
            <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: 'var(--mc-primary)' }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;