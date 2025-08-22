#!/usr/bin/env python3
"""
Email Configuration for AutoFlow MFA System
This file contains the email settings for sending verification codes
"""

# Email Configuration
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'sender_email': 'sarra.bngharbia@gmail.com',
    'sender_password': 'burf higo ucuw amoy',  # Gmail App Password
    'use_tls': True,
    'timeout': 30
}

# Email Templates
EMAIL_TEMPLATES = {
    'verification_subject': 'AutoFlow - Verification Code',
    'verification_html': '''
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">🔐 AutoFlow Verification Code</h2>
            <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="font-size: 18px; color: #7f8c8d; margin-bottom: 15px;">Your verification code is:</p>
                <div style="background-color: #3498db; color: white; font-size: 32px; font-weight: bold; padding: 15px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
                    {verification_code}
                </div>
                <p style="color: #e74c3c; font-size: 14px;">⏰ This code will expire in 5 minutes</p>
            </div>
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
                If you didn't request this code, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            <p style="color: #95a5a6; font-size: 12px;">
                This is an automated message from AutoFlow Network Management Platform.
            </p>
        </div>
    </body>
    </html>
    ''',
    'verification_plain': '''
AutoFlow Verification Code

Your verification code is: {verification_code}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

---
AutoFlow Network Management Platform
    '''
}

def get_email_config():
    """Get email configuration"""
    return EMAIL_CONFIG

def get_email_templates():
    """Get email templates"""
    return EMAIL_TEMPLATES 