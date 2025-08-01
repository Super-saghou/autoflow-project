import React from 'react';
import { getRolePermissions, canPerformAction } from '../utils/rbacConfig';
import RoleBadge from './RoleBadge';
import './PermissionInfo.css';

const PermissionInfo = ({ userRole, section, showDetails = false }) => {
  const permissions = getRolePermissions(userRole);
  
  if (!permissions) {
    return null;
  }

  const canCreate = canPerformAction(userRole, 'create');
  const canRead = canPerformAction(userRole, 'read');
  const canUpdate = canPerformAction(userRole, 'update');
  const canDelete = canPerformAction(userRole, 'delete');
  const canExecute = canPerformAction(userRole, 'execute');
  const canConfigure = canPerformAction(userRole, 'configure');

  return (
    <div className="permission-info-panel">
      <div className="permission-header">
        <RoleBadge role={userRole} size="small" />
        <span className="permission-title">Permissions for {section}</span>
      </div>
      
      <div className="permission-grid">
        <div className={`permission-item ${canCreate ? 'permission-granted' : 'permission-denied'}`}>
          <span className="permission-icon">{canCreate ? '✅' : '❌'}</span>
          <span className="permission-label">Create</span>
        </div>
        
        <div className={`permission-item ${canRead ? 'permission-granted' : 'permission-denied'}`}>
          <span className="permission-icon">{canRead ? '✅' : '❌'}</span>
          <span className="permission-label">Read</span>
        </div>
        
        <div className={`permission-item ${canUpdate ? 'permission-granted' : 'permission-denied'}`}>
          <span className="permission-icon">{canUpdate ? '✅' : '❌'}</span>
          <span className="permission-label">Update</span>
        </div>
        
        <div className={`permission-item ${canDelete ? 'permission-granted' : 'permission-denied'}`}>
          <span className="permission-icon">{canDelete ? '✅' : '❌'}</span>
          <span className="permission-label">Delete</span>
        </div>
        
        <div className={`permission-item ${canExecute ? 'permission-granted' : 'permission-denied'}`}>
          <span className="permission-icon">{canExecute ? '✅' : '❌'}</span>
          <span className="permission-label">Execute</span>
        </div>
        
        <div className={`permission-item ${canConfigure ? 'permission-granted' : 'permission-denied'}`}>
          <span className="permission-icon">{canConfigure ? '✅' : '❌'}</span>
          <span className="permission-label">Configure</span>
        </div>
      </div>

      {showDetails && (
        <div className="permission-details">
          <h4>Available Actions:</h4>
          <ul className="permission-list">
            {permissions.actions.create && <li>✅ Create new resources</li>}
            {permissions.actions.read && <li>✅ View existing resources</li>}
            {permissions.actions.update && <li>✅ Modify existing resources</li>}
            {permissions.actions.delete && <li>✅ Delete resources</li>}
            {permissions.actions.execute && <li>✅ Execute commands and scripts</li>}
            {permissions.actions.configure && <li>✅ Configure system settings</li>}
          </ul>
          
          {!permissions.actions.delete && (
            <div className="permission-warning">
              <p>⚠️ <strong>Note:</strong> You cannot delete resources. Contact an administrator for deletion requests.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PermissionInfo; 