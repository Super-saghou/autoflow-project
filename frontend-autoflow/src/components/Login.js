import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Erreur réseau, veuillez vérifier votre connexion');
    }
  };

  return (
    <div className="login-container">
      <div className="circle-1"></div>
      <div className="circle-2"></div>
      <div className="circle-3"></div>
      <div className="circle-4"></div>
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
      </div>
    </div>
  );
};

export default Login;
