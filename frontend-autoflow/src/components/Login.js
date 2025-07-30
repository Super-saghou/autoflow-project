import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import MFAModal from './MFAModal';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loginData, setLoginData] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la connexion');
      }

      const data = await response.json();
      if (data.message === 'Login successful') {
        // Store login data for MFA verification
        setLoginData(data);
        
        // Get user email from login response or use a default
        const email = data.user?.email || `${username}@autoflow.local`;
        setUserEmail(email);
        
        // Show MFA modal for verification
        setShowMFAModal(true);
      }
    } catch (error) {
      setError(error.message || 'Erreur réseau, veuillez vérifier votre connexion');
    }
  };

  const handleMFASuccess = (email) => {
    // MFA verification successful, complete login
    if (loginData && loginData.token) {
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      navigate('/dashboard');
    }
  };

  const handleMFAClose = () => {
    setShowMFAModal(false);
    setLoginData(null);
    setUserEmail('');
  };

  return (
    <div className="login-container">
      <div className="circle-1"></div>
      <div className="circle-2"></div>
      <div className="circle-3"></div>
      <div className="circle-4"></div>
      <div className="circle-5"></div>
      <div className="circle-6"></div>
      <div className="circle-7"></div>
      <div className="circle-8"></div>
      <div className="shape-1"></div>
      <div className="shape-2"></div>
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">NetOrion</div>
          <p className="login-subtitle">Sign in to your network management platform</p>
        </div>
        <div className="login-divider" />
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
 value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="login-error-message">{error}</div>}
          <button type="submit" className="login-btn">Sign In</button>
        </form>
        
        <div className="login-mfa-info">
          <p>🔐 Two-Factor Authentication Required</p>
          <p>After login, you will receive a verification code via email</p>
        </div>
      </div>
      
      <MFAModal
        isOpen={showMFAModal}
        onClose={handleMFAClose}
        onSuccess={handleMFASuccess}
        userEmail={userEmail}
      />
    </div>
  );
};

export default Login;
