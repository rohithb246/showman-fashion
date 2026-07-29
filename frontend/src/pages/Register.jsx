import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { authAPI } from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', token: '', password: '', password_confirm: '' });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (step === 1) {
        await register({ username: form.username, email: form.email });
        toast.success('OTP sent to your email.');
        setStep(2);
      } else if (step === 2) {
        if (form.token.length !== 6) throw new Error('Enter the six-digit OTP.');
        await authAPI.verifyRegistrationOTP({ email: form.email, token: form.token });
        toast.success('OTP verified. Set your password.');
        setStep(3);
      } else {
        await authAPI.completeRegistration(form);
        toast.success('Registration complete. Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = useCallback(async ({ credential }) => {
    try {
      await loginWithGoogle(credential);
      toast.success('Your Google account is ready.');
      navigate('/');
    } catch (err) { toast.error(err.response?.data?.detail || 'Google registration failed'); }
  }, [loginWithGoogle, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/showman-gold-logo.png" alt="The Show Man" className="auth-logo" />
        <h1>Join The Show</h1>
        <p className="auth-subtitle">Create your account</p>
        <form onSubmit={handleSubmit}>
          {step === 1 && ['username', 'email'].map((field) => (
            <div key={field} className="form-group">
              <label>{field === 'username' ? 'Username' : 'Email address'}</label>
              <input
                className="form-input"
                required
                type={field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}
          {step === 2 && <div className="form-group"><label>Enter OTP</label><input className="form-input" inputMode="numeric" maxLength="6" required value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value.replace(/\D/g, '') })} /></div>}
          {step === 3 && <><div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" className="form-input" required value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} />
          </div></>}
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Please wait...' : step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Create Account'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <GoogleSignInButton onCredential={handleGoogle} onError={() => toast.error('Google sign-in is unavailable')} />
        <p className="auth-footer">Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
}
