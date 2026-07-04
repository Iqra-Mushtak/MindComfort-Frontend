import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const email = location.state?.email || queryParams.get('email');
  const role = location.state?.role || queryParams.get('role');

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  
  const [timer, setTimer] = useState(0);

  useEffect(() => {
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
    console.log('OTP state updated to:', value, 'Length:', value.length);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setVerificationAttempted(true);

    if (!email) {
      setError('Missing email address. Please restart signup.');
      return;
    }

    const normalizedOtp = otp.trim();
    console.log('Submitting OTP verification', { email, otp: normalizedOtp });

    if (normalizedOtp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verifyRegister-otp', { email, otp: normalizedOtp });
      console.log('Verification response:', response.data);
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
      console.error('OTP verification error:', err);
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
    <div className="auth-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="mc-card p-4 p-md-5 text-center auth-card">
              
              <div className="text-start mb-3">
                <button 
                  onClick={() => navigate('/signup')} 
                  className="btn btn-link text-decoration-none p-0"
                  style={{ color: 'var(--mc-primary)' }}
                >
                  <i className="bi bi-arrow-left me-2"></i>Back to Signup
                </button>
              </div>

              <h2 className="fw-bold mb-2" style={{ color: 'var(--mc-primary)' }}>Verify Your Email</h2>
              <p className="text-muted mb-4 small">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              
              {error && (
                <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '12px' }}>
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success py-2 small mb-3" style={{ borderRadius: '12px' }}>
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
                    style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-mc-primary w-100 mb-3" 
                  disabled={loading || otp.length !== 6}
                  onClick={() => console.log('Button clicked! OTP:', otp, 'Length:', otp.length)}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>

                <div className="text-center">
                  <p className="small text-muted mb-2">Didn't receive the code?</p>
                  <button 
                    type="button" 
                    className="btn btn-link text-decoration-none small fw-semibold" 
                    style={{ color: 'var(--mc-primary)' }}
                    onClick={handleResend}
                    disabled={resendLoading || timer > 0}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : resendLoading ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;