import React, { useState } from 'react';
import './MFAModal.css';

const MFAModal = ({ isOpen, onClose, onSuccess, userEmail }) => {
  const [step, setStep] = useState('email'); // 'email' or 'code'
  const [email, setEmail] = useState(userEmail || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/mfa/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Verification code sent to your email');
        setStep('code');
      } else {
        setError(data.message || 'Error sending verification code');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/mfa/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Code verified successfully!');
        setTimeout(() => {
          onSuccess(email);
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Invalid or expired code');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setStep('email');
    setCode('');
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className="mfa-modal-overlay">
      <div className="mfa-modal">
        <div className="mfa-modal-header">
          <h2>Two-Factor Authentication</h2>
          <button className="mfa-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="mfa-modal-body">
          {step === 'email' ? (
            <div className="mfa-step">
              <p>Enter your email address to receive a verification code:</p>
              
              <div className="mfa-input-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>

              {error && <div className="mfa-error">{error}</div>}
              {success && <div className="mfa-success">{success}</div>}

              <div className="mfa-actions">
                <button
                  className="mfa-btn mfa-btn-primary"
                  onClick={handleSendCode}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
                <button
                  className="mfa-btn mfa-btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mfa-step">
              <p>A verification code has been sent to <strong>{email}</strong></p>
              <p>Enter the received code:</p>
              
              <div className="mfa-input-group">
                <label htmlFor="code">Verification Code:</label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && <div className="mfa-error">{error}</div>}
              {success && <div className="mfa-success">{success}</div>}

              <div className="mfa-actions">
                <button
                  className="mfa-btn mfa-btn-primary"
                  onClick={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  className="mfa-btn mfa-btn-secondary"
                  onClick={handleResendCode}
                  disabled={loading}
                >
                  New Code
                </button>
                <button
                  className="mfa-btn mfa-btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MFAModal; 