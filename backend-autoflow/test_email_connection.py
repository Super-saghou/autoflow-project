#!/usr/bin/env python3

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_email_connection():
    """Test SMTP connection and send a test email"""
    
    # Get email configuration
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    sender_email = os.getenv('SENDER_EMAIL', '')
    sender_password = os.getenv('SENDER_PASSWORD', '')
    
    print(f"Testing email configuration:")
    print(f"SMTP Server: {smtp_server}")
    print(f"SMTP Port: {smtp_port}")
    print(f"Sender Email: {sender_email}")
    print(f"Sender Password: {'*' * len(sender_password) if sender_password else 'NOT SET'}")
    
    if not sender_email or not sender_password:
        print("❌ ERROR: SENDER_EMAIL or SENDER_PASSWORD not set in .env file")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = sender_email  # Send to yourself for testing
        msg['Subject'] = 'Test Email - AutoFlow MFA'
        
        body = "This is a test email to verify SMTP configuration for AutoFlow MFA system."
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to SMTP server
        print(f"\nConnecting to {smtp_server}:{smtp_port}...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        
        # Login
        print("Logging in...")
        server.login(sender_email, sender_password)
        
        # Send email
        print("Sending test email...")
        text = msg.as_string()
        server.sendmail(sender_email, sender_email, text)
        
        # Close connection
        server.quit()
        
        print("✅ SUCCESS: Test email sent successfully!")
        print(f"Check your inbox at {sender_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ AUTHENTICATION ERROR: {e}")
        print("This usually means the App Password is incorrect.")
        print("Please check your Gmail App Password settings.")
        return False
        
    except smtplib.SMTPException as e:
        print(f"❌ SMTP ERROR: {e}")
        return False
        
    except Exception as e:
        print(f"❌ GENERAL ERROR: {e}")
        return False

if __name__ == "__main__":
    test_email_connection() 