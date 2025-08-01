import React from 'react';
import { getRoleBadge, getRoleColor } from '../utils/rbacConfig';
import './RoleBadge.css';

const RoleBadge = ({ role, showIcon = true, size = 'medium' }) => {
  const badge = getRoleBadge(role);
  const color = getRoleColor(role);

  return (
    <span 
      className={`role-badge role-badge-${size}`}
      style={{ 
        backgroundColor: color,
        borderColor: color
      }}
      title={`Role: ${role}`}
    >
      {showIcon && <span className="role-icon">{badge.split(' ')[0]}</span>}
      <span className="role-text">{badge.split(' ').slice(1).join(' ')}</span>
    </span>
  );
};

export default RoleBadge; 