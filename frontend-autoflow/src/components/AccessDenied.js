import React from 'react';
import { getAccessDeniedMessage } from '../utils/rbacConfig';
import './AccessDenied.css';

const AccessDenied = ({ action, resource, role, showIcon = true }) => {
  const message = getAccessDeniedMessage(action, resource);

  return (
    <div className="access-denied">
      {showIcon && <div className="access-denied-icon">🔒</div>}
      <div className="access-denied-content">
        <h3 className="access-denied-title">Access Denied</h3>
        <p className="access-denied-message">{message}</p>
        <div className="access-denied-details">
          <p><strong>Action:</strong> {action}</p>
          <p><strong>Resource:</strong> {resource}</p>
          <p><strong>Your Role:</strong> {role}</p>
          <p><strong>Required:</strong> Admin privileges</p>
        </div>
        <div className="access-denied-help">
          <p>💡 Contact your system administrator to request access to this feature.</p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied; 