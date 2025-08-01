#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Role from './models/Role.js';

dotenv.config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/autoflow');
    console.log('✅ Connected to MongoDB');

    // Initialize roles first
    await Role.initializeRoles();
    console.log('✅ Roles initialized');

    // Create a test user with Network_Engineer role
    const testUser = new User({
      username: 'testuser',
      email: 'testuser@autoflow.local',
      password: 'testpass123',
      role: 'Network_Engineer',
      isActive: true
    });

    // Save the user
    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('📋 User details:');
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   ID: ${testUser._id}`);

    // Verify the user was created
    const savedUser = await User.findOne({ username: 'testuser' });
    if (savedUser) {
      console.log('✅ User verification successful');
      
      // Test password comparison
      const isPasswordValid = await savedUser.comparePassword('testpass123');
      console.log(`✅ Password verification: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);
      
      // Get role permissions
      const role = await Role.findOne({ name: savedUser.role });
      if (role) {
        console.log(`📋 Role permissions for ${savedUser.role}:`);
        role.permissions.forEach(permission => {
          console.log(`   - ${permission}`);
        });
      }
    }

    // List all users
    console.log('\n📋 All users in database:');
    const allUsers = await User.find({}, 'username email role isActive');
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

    // List all roles
    console.log('\n📋 All roles in database:');
    const allRoles = await Role.find({}, 'name description permissions');
    allRoles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`);
      console.log(`     Permissions: ${role.permissions.length}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestUser(); 