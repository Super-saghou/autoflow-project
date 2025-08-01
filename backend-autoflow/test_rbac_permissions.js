#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Role from './models/Role.js';

dotenv.config();

async function testRBACPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/autoflow');
    console.log('✅ Connected to MongoDB\n');

    // Test Admin role
    console.log('👑 === ADMIN ROLE TEST ===');
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (adminRole) {
      console.log('📋 Admin permissions:');
      adminRole.permissions.forEach(permission => {
        console.log(`   ✅ ${permission}`);
      });
    }

    console.log('\n🔧 === NETWORK_ENGINEER ROLE TEST ===');
    const networkEngineerRole = await Role.findOne({ name: 'Network_Engineer' });
    if (networkEngineerRole) {
      console.log('📋 Network_Engineer permissions:');
      networkEngineerRole.permissions.forEach(permission => {
        console.log(`   ✅ ${permission}`);
      });
    }

    console.log('\n📊 === PERMISSION COMPARISON ===');
    const adminPerms = new Set(adminRole.permissions);
    const networkPerms = new Set(networkEngineerRole.permissions);
    
    console.log('🔒 Admin-only permissions (Network_Engineer cannot do):');
    adminPerms.forEach(perm => {
      if (!networkPerms.has(perm)) {
        console.log(`   ❌ ${perm}`);
      }
    });

    console.log('\n🔓 Shared permissions (both can do):');
    networkPerms.forEach(perm => {
      if (adminPerms.has(perm)) {
        console.log(`   ✅ ${perm}`);
      }
    });

    console.log('\n🎯 === PRACTICAL DIFFERENCES ===');
    console.log('👑 Admin can:');
    console.log('   • Create/delete user accounts');
    console.log('   • Modify system roles and permissions');
    console.log('   • Delete devices, VLANs, backups');
    console.log('   • Access complete audit logs');
    console.log('   • Configure system-wide settings');
    console.log('   • Restore system backups');
    
    console.log('\n🔧 Network_Engineer can:');
    console.log('   • Create/modify network devices');
    console.log('   • Create/modify VLANs');
    console.log('   • Create backups (but not delete)');
    console.log('   • Monitor network status');
    console.log('   • Execute Ansible playbooks');
    console.log('   • SSH to network devices');
    
    console.log('\n❌ Network_Engineer cannot:');
    console.log('   • Create/delete user accounts');
    console.log('   • Modify roles or permissions');
    console.log('   • Delete system resources');
    console.log('   • Access complete audit logs');
    console.log('   • Configure system-wide settings');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testRBACPermissions(); 