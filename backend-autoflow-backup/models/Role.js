import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['Admin', 'Network_Engineer', 'Developer', 'Viewer']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  permissions: [{
    type: String,
    enum: [
      'read_devices',
      'write_devices',
      'delete_devices',
      'read_topology',
      'write_topology',
      'read_vlans',
      'write_vlans',
      'delete_vlans',
      'read_backups',
      'write_backups',
      'delete_backups',
      'restore_backups',
      'read_monitoring',
      'write_monitoring',
      'read_audit',
      'write_audit',
      'read_users',
      'write_users',
      'delete_users',
      'read_roles',
      'write_roles',
      'delete_roles',
      'execute_playbooks',
      'configure_ssh',
      'configure_security'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Predefined roles with their permissions
roleSchema.statics.initializeRoles = async function() {
  const roles = [
    {
      name: 'Admin',
      description: 'Full system administrator with all permissions',
      permissions: [
        'read_devices', 'write_devices', 'delete_devices',
        'read_topology', 'write_topology',
        'read_vlans', 'write_vlans', 'delete_vlans',
        'read_backups', 'write_backups', 'delete_backups', 'restore_backups',
        'read_monitoring', 'write_monitoring',
        'read_audit', 'write_audit',
        'read_users', 'write_users', 'delete_users',
        'read_roles', 'write_roles', 'delete_roles',
        'execute_playbooks', 'configure_ssh', 'configure_security'
      ]
    },
    {
      name: 'Network_Engineer',
      description: 'Network engineer with device and network management permissions',
      permissions: [
        'read_devices', 'write_devices',
        'read_topology', 'write_topology',
        'read_vlans', 'write_vlans',
        'read_backups', 'write_backups',
        'read_monitoring',
        'read_audit',
        'execute_playbooks', 'configure_ssh', 'configure_security'
      ]
    },
    {
      name: 'Developer',
      description: 'Developer with limited system access for development purposes',
      permissions: [
        'read_devices',
        'read_topology',
        'read_vlans',
        'read_backups',
        'read_monitoring',
        'read_audit'
      ]
    },
    {
      name: 'Viewer',
      description: 'Read-only access to view system information',
      permissions: [
        'read_devices',
        'read_topology',
        'read_vlans',
        'read_backups',
        'read_monitoring'
      ]
    }
  ];

  for (const roleData of roles) {
    await this.findOneAndUpdate(
      { name: roleData.name },
      roleData,
      { upsert: true, new: true }
    );
  }
};

export default mongoose.model('Role', roleSchema); 