import React from 'react';
import { canPerformAction } from '../utils/rbacConfig';
import './PermissionButton.css';

const PermissionButton = ({ 
  userRole, 
  action, 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  showTooltip = true,
  tooltipText = null,
  ...props 
}) => {
  const hasPermission = canPerformAction(userRole, action);
  const isDisabled = disabled || !hasPermission;
  
  const handleClick = (e) => {
    if (!hasPermission) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  const defaultTooltip = !hasPermission 
    ? `🔒 ${action} requires Admin privileges` 
    : tooltipText;

  return (
    <button
      className={`permission-button ${className} ${!hasPermission ? 'button-disabled' : ''} ${showTooltip ? 'permission-tooltip' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
      data-tooltip={showTooltip ? defaultTooltip : undefined}
      {...props}
    >
      {children}
      {!hasPermission && <span className="permission-lock">🔒</span>}
    </button>
  );
};

export default PermissionButton; 