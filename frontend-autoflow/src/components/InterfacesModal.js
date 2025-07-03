import React from 'react';
import './InterfacesModal.css';

const InterfacesModal = ({ open, onClose, switchType, interfaces, onEdit }) => {
  if (!open) return null;
  return (
    <div className="interfaces-modal-backdrop">
      <div className="interfaces-container">
        <h2>{switchType} - Ports and Link Aggregation</h2>
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
        <button className="interfaces-modal-close" onClick={onClose}>&times;</button>
      </div>
    </div>
  );
};

export default InterfacesModal; 