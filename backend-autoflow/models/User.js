import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Admin', 'Network_Engineer', 'Developer', 'Viewer'],
    default: 'Viewer'
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
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  // TEMPORARY: Use plain text comparison for debugging
  return candidatePassword === this.password;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Check permission method
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Check role method
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

export default mongoose.model('User', userSchema); 