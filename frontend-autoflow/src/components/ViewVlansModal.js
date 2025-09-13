import React, { useState, useEffect, useCallback } from 'react';
import './ViewVlansModal.css';

const ViewVlansModal = ({ open, onClose, switchType }) => {
  const [vlans, setVlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/list-vlans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ switchType }),
      });

      if (response.ok) {
        const data = await response.json();
        setVlans(data.vlans || []);
      } else {
        setError('Failed to fetch VLANs');
      }
    } catch (err) {
      setError('Network error while fetching VLANs');
    } finally {
      setLoading(false);
    }
  }, [switchType]);

  useEffect(() => {
    if (open) {
      fetchVlans();
    }
  }, [open, fetchVlans]);

  const handleClose = () => {
    setVlans([]);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="view-vlans-modal-backdrop">
      <div className="view-vlans-modal-container">
        <div className="view-vlans-modal-header">
          <h2>📋 Existing VLANs - {switchType}</h2>
          <button className="view-vlans-modal-close" onClick={handleClose}>&times;</button>
        </div>
        
        <div className="view-vlans-modal-content">
          <div className="view-vlans-info">
            <p>🔒 <strong>Read-Only Access:</strong> You can view existing VLANs but cannot create, modify, or delete them.</p>
            <p>👑 <strong>Admin Required:</strong> Contact an administrator for VLAN modifications.</p>
          </div>

          {loading && (
            <div className="view-vlans-loading">
              <div className="loading-spinner"></div>
              <p>Loading VLANs...</p>
            </div>
          )}

          {error && (
            <div className="view-vlans-error">
              <p>❌ {error}</p>
              <button onClick={fetchVlans} className="retry-button">🔄 Retry</button>
            </div>
          )}

          {!loading && !error && (
            <div className="view-vlans-list">
              {vlans.length === 0 ? (
                <div className="no-vlans">
                  <p>📭 No VLANs found for {switchType}</p>
                  <p>VLANs will appear here once created by an administrator.</p>
                </div>
              ) : (
                <div className="vlans-grid">
                  {vlans.map((vlan, index) => (
                    <div key={index} className="vlan-card">
                      <div className="vlan-header">
                        <span className="vlan-id">VLAN {vlan.vlanId}</span>
                        <span className="vlan-status active">Active</span>
                      </div>
                      <div className="vlan-details">
                        <p><strong>Name:</strong> {vlan.vlanName || 'N/A'}</p>
                        <p><strong>Description:</strong> {vlan.description || 'No description'}</p>
                        <p><strong>Interfaces:</strong> {vlan.interfaces?.length || 0} ports</p>
                        <p><strong>Created:</strong> {vlan.createdAt || 'Unknown'}</p>
                      </div>
                      <div className="vlan-actions-disabled">
                        <span className="action-disabled">🔒 View Only</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="view-vlans-modal-footer">
          <button onClick={handleClose} className="close-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewVlansModal;
