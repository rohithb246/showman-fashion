import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Welcome back!');
      navigate(data.user.role === 'admin' || data.user.role === 'staff' ? '/admin' : '/');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = useCallback(async ({ credential }) => {
    try {
      const data = await loginWithGoogle(credential);
      toast.success('Welcome to The Show Man!');
      navigate(data.user.role === 'admin' || data.user.role === 'staff' ? '/admin' : '/');
    } catch (err) { toast.error(err.response?.data?.detail || 'Google sign-in failed'); }
  }, [loginWithGoogle, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/logo.png" alt="The Show Man" className="auth-logo" />
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <GoogleSignInButton onCredential={handleGoogle} onError={() => toast.error('Google sign-in is unavailable')} />
        <p className="auth-footer">Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}
