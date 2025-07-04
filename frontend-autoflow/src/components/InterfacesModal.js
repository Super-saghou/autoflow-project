import React from 'react';
import './InterfacesModal.css';

const InterfacesModal = ({ open, onClose, switchType, interfaces, onEdit, isLoading }) => {
  if (!open) return null;
  return (
    <div className="interfaces-modal-backdrop">
      <div className="interfaces-container">
        <h2>{switchType} - Ports and Link Aggregation</h2>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#1e3a8a' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>Loading interfaces...</p>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Fetching real-time status from switch</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Interface</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.map(({ name, status }) => (
                <tr key={name}>
                  <td>
                    <span
                      className={status.toLowerCase()}
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => onEdit(name)}
                    >
                      {name}
                    </span>
                  </td>
                  <td className={status.toLowerCase()}>{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="interfaces-modal-close" onClick={onClose}>&times;</button>
      </div>
    </div>
  );
};

export default InterfacesModal; 