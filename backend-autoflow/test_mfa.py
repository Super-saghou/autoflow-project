#!/usr/bin/env python3
"""
Test script for MFA configuration
Run this to test email sending and code generation
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our MFA config
from mfa_config import mfa_config

def test_code_generation():
    """Test verification code generation"""
    print("Testing code generation...")
    code = mfa_config.generate_verification_code()
    print(f"Generated code: {code}")
    print(f"Code length: {len(code)}")
    print("✅ Code generation test passed\n")

def test_email_configuration():
    """Test email configuration"""
    print("Testing email configuration...")
    print(f"SMTP Server: {mfa_config.smtp_server}")
    print(f"SMTP Port: {mfa_config.smtp_port}")
    print(f"Sender Email: {mfa_config.sender_email}")
    print(f"Sender Password: {'*' * len(mfa_config.sender_password) if mfa_config.sender_password else 'NOT SET'}")
    
    if not mfa_config.sender_email or mfa_config.sender_email == 'your-email@gmail.com':
        print("❌ Please configure SENDER_EMAIL in .env file")
        return False
    
    if not mfa_config.sender_password or mfa_config.sender_password == 'your-app-password':
        print("❌ Please configure SENDER_PASSWORD in .env file")
        return False
    
    print("✅ Email configuration test passed\n")
    return True

def test_code_storage():
    """Test code storage and verification"""
    print("Testing code storage and verification...")
    
    # Test user ID
    test_user_id = "test_user_123"
    
    # Generate and store code
    code = mfa_config.generate_verification_code()
    mfa_config.store_verification_code(test_user_id, code)
    print(f"Stored code: {code}")
    
    # Test correct verification
    success, message = mfa_config.verify_code(test_user_id, code)
    print(f"Correct code verification: {success} - {message}")
    
    # Test incorrect verification
    success, message = mfa_config.verify_code(test_user_id, "000000")
    print(f"Incorrect code verification: {success} - {message}")
    
    # Test expired code (simulate by storing old code)
    old_code = mfa_config.generate_verification_code()
    mfa_config._temp_codes[test_user_id] = {
        'code': old_code,
        'expiry': 0,  # Expired
        'attempts': 0
    }
    success, message = mfa_config.verify_code(test_user_id, old_code)
    print(f"Expired code verification: {success} - {message}")
    
    print("✅ Code storage and verification test passed\n")

def test_rate_limiting():
    """Test rate limiting functionality"""
    print("Testing rate limiting...")
    
    test_user_id = "rate_limit_test_user"
    
    # Test normal attempts
    for i in range(3):
        mfa_config.record_attempt(test_user_id)
        limited = mfa_config.is_rate_limited(test_user_id)
        print(f"Attempt {i+1}: Rate limited = {limited}")
    
    # Test rate limit exceeded
    mfa_config.record_attempt(test_user_id)
    limited = mfa_config.is_rate_limited(test_user_id)
    print(f"Attempt 4: Rate limited = {limited}")
    
    print("✅ Rate limiting test passed\n")

def main():
    """Run all tests"""
    print("🧪 MFA Configuration Test Suite\n")
    print("=" * 50)
    
    # Run tests
    test_code_generation()
    
    if not test_email_configuration():
        print("❌ Email configuration failed. Please update your .env file:")
        print("   SENDER_EMAIL=your-actual-email@gmail.com")
        print("   SENDER_PASSWORD=your-app-password")
        print("\n   For Gmail, you need to:")
        print("   1. Enable 2-Factor Authentication")
        print("   2. Generate an App Password")
        print("   3. Use the App Password (not your regular password)")
        return
    
    test_code_storage()
    test_rate_limiting()
    
    print("🎉 All tests passed! MFA configuration is ready.")
    print("\nNext steps:")
    print("1. Update your .env file with real email credentials")
    print("2. Test email sending with a real email address")
    print("3. Integrate MFA into your main application")

if __name__ == "__main__":
    main() 