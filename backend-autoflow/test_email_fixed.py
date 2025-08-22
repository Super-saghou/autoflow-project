#!/usr/bin/env python3
"""
Test script for AutoFlow email configuration
"""

from mfa_config import MFAConfig

def test_email_config():
    """Test the email configuration"""
    print("🔧 Testing AutoFlow Email Configuration")
    print("=" * 50)
    
    # Create MFA config instance
    mfa = MFAConfig()
    
    # Test email configuration
    email_config = mfa._get_email_config()
    print(f"✅ SMTP Server: {email_config['smtp_server']}")
    print(f"✅ SMTP Port: {email_config['smtp_port']}")
    print(f"✅ Sender Email: {email_config['sender_email']}")
    print(f"✅ Sender Password: {'*' * len(email_config['sender_password'])}")
    
    # Test code generation
    code = mfa.generate_verification_code()
    print(f"✅ Generated Code: {code}")
    
    # Test email sending (replace with your actual email for testing)
    test_email = "sarra.bngharbia@gmail.com"  # Change this to test with a different email
    
    print(f"\n📧 Testing email sending to: {test_email}")
    print("Sending verification code...")
    
    success, message = mfa.send_verification_email(test_email, code)
    
    if success:
        print(f"✅ SUCCESS: {message}")
        print("📬 Check your email inbox for the verification code!")
    else:
        print(f"❌ FAILED: {message}")
        print("\n🔍 Troubleshooting:")
        print("1. Check if Gmail App Password is correct")
        print("2. Ensure 2FA is enabled on your Gmail account")
        print("3. Check if 'Less secure app access' is enabled")
        print("4. Verify your Gmail account is not blocked")
    
    return success

if __name__ == "__main__":
    test_email_config() 