import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/autoflow';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to:", MONGO_URI);
  const allUsers = await User.find().lean();
  console.log("Current users:", allUsers);
  const adminUsername = 'admin';
  const adminPassword = 'admin123';
  const adminEmail = 'admin@example.com';
  const adminRole = 'Admin';
  const monitorUsername = 'monitor';
  const monitorPassword = 'monitor123';
  const monitorEmail = 'monitor@example.com';
  const monitorRole = 'Network_Engineer';
  const permissions = [
    'read_monitoring',
    'write_monitoring',
    'read_devices',
    'read_vlans',
    'read_audit',
    'read_users',
    'read_roles',
    'execute_playbooks',
    'configure_ssh',
    'configure_security',
    'write_devices',
    'write_vlans',
    'write_backups',
    'restore_backups'
  ];

  // Admin user
  let admin = await User.findOne({ username: adminUsername });
  if (!admin) {
    admin = new User({ username: adminUsername, password: adminPassword, email: adminEmail, role: adminRole, permissions });
    await admin.save();
    console.log('Admin user created:', adminUsername, adminPassword);
  } else {
    const hashed = await bcrypt.hash(adminPassword, 10);
    admin.password = hashed;
    admin.permissions = permissions;
    admin.role = adminRole;
    admin.email = adminEmail;
    await admin.save();
    console.log('Admin user updated with new password and permissions.');
  }

  // Monitor user
  let monitor = await User.findOne({ username: monitorUsername });
  if (!monitor) {
    monitor = new User({ username: monitorUsername, password: monitorPassword, email: monitorEmail, role: monitorRole, permissions });
    await monitor.save();
    console.log('Monitor user created:', monitorUsername, monitorPassword);
  } else {
    const hashed = await bcrypt.hash(monitorPassword, 10);
    monitor.password = hashed;
    monitor.permissions = permissions;
    monitor.role = monitorRole;
    monitor.email = monitorEmail;
    await monitor.save();
    console.log('Monitor user updated with new password and permissions.');
  }

  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); }); 