import React, { useState } from 'react';
import './MFAModal.css';

const MFAModal = ({ isOpen, onClose, onSuccess, userEmail }) => {
  const [email, setEmail] = useState(userEmail || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update email when userEmail prop changes
  React.useEffect(() => {
    console.log('MFAModal: userEmail prop changed to:', userEmail);
    if (userEmail) {
      setEmail(userEmail);
      console.log('MFAModal: email state updated to:', userEmail);
    }
  }, [userEmail]);



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

  const handleResendCode = async () => {
    setCode('');
    setError('');
    setSuccess('');
    setLoading(true);

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
        setSuccess('New verification code sent to your email');
      } else {
        setError(data.message || 'Error sending verification code');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
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
                {loading ? 'Sending...' : 'New Code'}
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
        </div>
      </div>
    </div>
  );
};

export default MFAModal; 