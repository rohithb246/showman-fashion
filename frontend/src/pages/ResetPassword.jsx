import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authAPI.resetPassword({ token, password });
      toast.success('Password reset successful');
      navigate('/login');
    } catch {
      toast.error('Invalid or expired token');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/showman-monogram-black.png" alt="The Show Man" className="auth-logo" />
        <h1>New Password</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" className="form-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Reset Password</button>
        </form>
        <p className="auth-footer"><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}
