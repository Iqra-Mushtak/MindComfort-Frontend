import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const email = location.state?.email || queryParams.get('email');
  const role = location.state?.role || queryParams.get('role') || 'client';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    document.title = "Verify OTP | MindComfort";
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Missing email address. Please restart signup.');
      return;
    }

    const normalizedOtp = otp.trim();
    if (normalizedOtp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verifyRegister-otp', { email, otp: normalizedOtp });
      setSuccessMsg(response.data.message || 'Verified successfully. Redirecting...');
      setTimeout(() => {
        if (response.data.role === 'mentor') {
          navigate('/mentor-application', {
            state: {
              email: email,
              token: response.data.token,
              userId: response.data.id
            }
          });
        } else {
          navigate('/login');
        }
      }, 2000);
    } catch (err) {
      const apiMessage = err.response?.data?.message || err.response?.data?.error;
      setError(apiMessage || err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccessMsg('');
    setResendLoading(true);

    if (!email) {
      setError('Missing email address. Please restart signup.');
      setResendLoading(false);
      return;
    }

    try {
      await api.post('/auth/resend-otp', { email });
      setSuccessMsg('A new verification code has been sent to your email.');
      setTimer(60); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again later.');
    } finally {
      setResendLoading(false);
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
              onClick={() => navigate('/signup')} 
              className="btn-back-home"
            >
              Back to Signup
            </button>
          </div>

          <div className="mb-4">
            <h2 className="auth-header-title mb-1">Verify Your Email</h2>
            <p className="auth-header-sub">
              We sent a 6-digit confirmation code to <span className="fw-bold text-dark">{email}</span>
            </p>
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

          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <input 
                type="tel" 
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="form-control mc-input text-center" 
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                style={{ fontSize: '1.5rem', letterSpacing: '0.4rem', fontWeight: 'bold' }}
                autoComplete="one-time-code"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-mc-primary w-100 mb-2" 
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="text-center mt-2">
              <span className="small text-muted me-1">Didn't receive the code?</span>
              <button 
                type="button" 
                className="btn btn-link text-decoration-none small fw-semibold p-0" 
                style={{ color: 'var(--mc-primary)' }}
                onClick={handleResend}
                disabled={resendLoading || timer > 0}
              >
                {timer > 0 ? `Resend code in ${timer}s` : resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;