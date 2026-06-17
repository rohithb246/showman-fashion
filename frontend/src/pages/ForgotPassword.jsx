import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await authAPI.forgotPassword(email);
    setSent(true);
    toast.success('Reset link sent if email exists');
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/logo.png" alt="The Show Man" className="auth-logo" />
        <h1>Reset Password</h1>
        {sent ? (
          <p>Check your email for reset instructions.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Send Reset Link</button>
          </form>
        )}
        <p className="auth-footer"><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}
