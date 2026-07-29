import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authAPI.verifyEmail(email, code);
      toast.success('Email verified. You can sign in now.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'The code is invalid or expired.');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (!email) return toast.error('Enter your email address first.');
    try { await authAPI.resendVerificationCode(email); toast.success('A new code was sent.'); }
    catch { toast.error('Could not send a new code.'); }
  };

  return <div className="auth-page"><div className="auth-card glass-card">
    <img src="/showman-gold-logo.png" alt="The Show Man" className="auth-logo" />
    <h1>Verify your email</h1>
    <p className="auth-subtitle">Enter the six-digit code sent to your inbox.</p>
    <form onSubmit={verify}>
      <div className="form-group"><label>Email</label><input className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="form-group"><label>Verification code</label><input className="form-input" inputMode="numeric" maxLength="6" pattern="[0-9]{6}" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></div>
      <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>{loading ? 'Verifying...' : 'Verify email'}</button>
    </form>
    <button className="btn btn-ghost" onClick={resend} type="button">Resend code</button>
    <p className="auth-footer"><Link to="/login">Back to Sign In</Link></p>
  </div></div>;
}
