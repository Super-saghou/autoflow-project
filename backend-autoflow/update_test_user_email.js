#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function updateTestUserEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/autoflow');
    console.log('✅ Connected to MongoDB');

    // Update testuser email to your real email
    const updatedUser = await User.findOneAndUpdate(
      { username: 'testuser' },
      { email: 'sarra.bngharbia@gmail.com' },
      { new: true }
    );

    if (updatedUser) {
      console.log('✅ Test user email updated successfully');
      console.log('📋 Updated user details:');
      console.log(`   Username: ${updatedUser.username}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   ID: ${updatedUser._id}`);
    } else {
      console.log('❌ User testuser not found');
    }

    // List all users to verify
    console.log('\n📋 All users in database:');
    const allUsers = await User.find({}, 'username email role isActive');
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateTestUserEmail(); 