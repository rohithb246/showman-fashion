import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      authAPI.verifyEmail(token)
        .then(() => toast.success('Email verified!'))
        .catch(() => toast.error('Verification failed'));
    }
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/logo.png" alt="The Show Man" className="auth-logo" />
        <h1>Email Verification</h1>
        <p>Your email has been processed. You can now enjoy full access.</p>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}
