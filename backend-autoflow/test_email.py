#!/usr/bin/env python3
"""
Test email sending functionality
"""

from dotenv import load_dotenv
from mfa_config import mfa_config

# Load environment variables
load_dotenv()

def test_email_sending():
    """Test sending a verification email"""
    print("📧 Testing Email Sending...")
    print("=" * 40)
    
    # Test email address (change this to your email)
    test_email = input("Enter your email address to test: ").strip()
    
    if not test_email:
        print("❌ No email address provided")
        return
    
    print(f"Sending test email to: {test_email}")
    
    # Generate a test code
    test_code = mfa_config.generate_verification_code()
    print(f"Test verification code: {test_code}")
    
    # Send the email
    success, message = mfa_config.send_verification_email(test_email, test_code)
    
    if success:
        print("✅ Email sent successfully!")
        print("📬 Check your email inbox for the verification code")
        print(f"🔢 The code should be: {test_code}")
    else:
        print(f"❌ Email sending failed: {message}")
        print("\nTroubleshooting tips:")
        print("1. Check your Gmail App Password is correct")
        print("2. Make sure 2-Factor Authentication is enabled")
        print("3. Check your internet connection")
        print("4. Verify the email address is correct")

if __name__ == "__main__":
    test_email_sending() 