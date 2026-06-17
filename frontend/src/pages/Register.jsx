import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({
    email: '', username: '', first_name: '', last_name: '',
    password: '', password_confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please verify your email.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/logo.png" alt="The Show Man" className="auth-logo" />
        <h1>Join The Show</h1>
        <p className="auth-subtitle">Create your account</p>
        <form onSubmit={handleSubmit}>
          {['first_name', 'last_name', 'email', 'username'].map((field) => (
            <div key={field} className="form-group">
              <label>{field.replace('_', ' ')}</label>
              <input
                className="form-input"
                required
                type={field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" className="form-input" required value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
}
