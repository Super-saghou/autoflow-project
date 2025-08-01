import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MFAConfig:
    def __init__(self):
        # MFA settings
        self.code_length = 6
        self.code_expiry = 300  # 5 minutes
        self.max_attempts = 3
        self.rate_limit_window = 60  # 1 minute
        
        # In-memory storage for codes (use Redis in production)
        self._temp_codes = {}
        self._attempt_counts = {}
        
    def _get_email_config(self):
        """Get email configuration from environment variables"""
        return {
            'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': int(os.getenv('SMTP_PORT', '587')),
            'sender_email': os.getenv('SENDER_EMAIL', ''),
            'sender_password': os.getenv('SENDER_PASSWORD', '')
        }
        
    def generate_verification_code(self):
        """Generate a secure random 6-digit verification code"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(self.code_length)])
    
    def is_rate_limited(self, user_id):
        """Check if user is rate limited"""
        now = time.time()
        if user_id in self._attempt_counts:
            attempts = self._attempt_counts[user_id]
            # Remove old attempts outside the window
            attempts = [t for t in attempts if now - t < self.rate_limit_window]
            self._attempt_counts[user_id] = attempts
            
            if len(attempts) >= self.max_attempts:
                return True
        return False
    
    def record_attempt(self, user_id):
        """Record an attempt for rate limiting"""
        now = time.time()
        if user_id not in self._attempt_counts:
            self._attempt_counts[user_id] = []
        self._attempt_counts[user_id].append(now)
    
    def store_verification_code(self, user_id, code):
        """Store verification code with expiry"""
        expiry_time = time.time() + self.code_expiry
        self._temp_codes[user_id] = {
            'code': code,
            'expiry': expiry_time,
            'attempts': 0
        }
    
    def verify_code(self, user_id, code):
        """Verify the provided code"""
        if user_id not in self._temp_codes:
            return False, "No verification code found"
        
        stored_data = self._temp_codes[user_id]
        
        # Check expiry
        if time.time() > stored_data['expiry']:
            del self._temp_codes[user_id]
            return False, "Verification code expired"
        
        # Check attempts
        if stored_data['attempts'] >= 3:
            del self._temp_codes[user_id]
            return False, "Too many attempts"
        
        # Increment attempts
        stored_data['attempts'] += 1
        
        # Verify code
        if stored_data['code'] == code:
            del self._temp_codes[user_id]
            return True, "Code verified successfully"
        
        return False, "Invalid verification code"
    
    def send_verification_email(self, user_email, verification_code):
        """Send verification code via email with proper error handling"""
        try:
            # Get email configuration
            email_config = self._get_email_config()
            
            # Debug: Print email configuration (without password)
            print(f"DEBUG: SMTP Server: {email_config['smtp_server']}")
            print(f"DEBUG: SMTP Port: {email_config['smtp_port']}")
            print(f"DEBUG: Sender Email: {email_config['sender_email']}")
            print(f"DEBUG: Sender Password: {'*' * len(email_config['sender_password']) if email_config['sender_password'] else 'NOT SET'}")
            
            # For testing purposes, if email config is not set, just print the code
            if not email_config['sender_email'] or not email_config['sender_password']:
                print(f"TEST MODE: Verification code {verification_code} for {user_email}")
                print("To enable real email sending, configure SMTP settings in .env file")
                return True, "Code generated successfully (test mode)"
            
            # Validate email configuration
            if not email_config['sender_email'] or not email_config['sender_password']:
                logger.error("Email configuration missing")
                return False, "Email configuration not set"
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = user_email
            msg['Subject'] = "AutoFlow - Verification Code"
            
            # Create HTML and plain text versions
            html_body = f"""
            <html>
            <body>
                <h2>AutoFlow Verification Code</h2>
                <p>Your verification code is: <strong style="font-size: 24px; color: #3b82f6;">{verification_code}</strong></p>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr>
                <p style="color: #6b7280; font-size: 12px;">This is an automated message from AutoFlow Network Management Platform.</p>
            </body>
            </html>
            """
            
            plain_body = f"""
            AutoFlow Verification Code
            
            Your verification code is: {verification_code}
            
            This code will expire in 5 minutes.
            
            If you didn't request this code, please ignore this email.
            """
            
            # Attach both versions
            msg.attach(MIMEText(plain_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['sender_email'], email_config['sender_password'])
            text = msg.as_string()
            server.sendmail(email_config['sender_email'], user_email, text)
            server.quit()
            
            logger.info(f"Verification email sent to {user_email}")
            return True, "Email sent successfully"
            
        except smtplib.SMTPAuthenticationError:
            logger.error("SMTP authentication failed")
            return False, "Email authentication failed"
        except smtplib.SMTPRecipientsRefused:
            logger.error(f"Recipient email refused: {user_email}")
            return False, "Invalid email address"
        except smtplib.SMTPServerDisconnected:
            logger.error("SMTP server disconnected")
            return False, "Email server connection failed"
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            return False, f"Email sending failed: {str(e)}"
    
    def cleanup_expired_codes(self):
        """Clean up expired verification codes"""
        now = time.time()
        expired_keys = [
            user_id for user_id, data in self._temp_codes.items()
            if now > data['expiry']
        ]
        for key in expired_keys:
            del self._temp_codes[key]
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired codes")

# Create global instance
mfa_config = MFAConfig()

# Command line interface
if __name__ == "__main__":
    import sys
    import json
    import os
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    # Debug: Check if .env is loaded
    print(f"DEBUG: Current working directory: {os.getcwd()}")
    print(f"DEBUG: SMTP_SERVER from env: {os.getenv('SMTP_SERVER', 'NOT SET')}")
    print(f"DEBUG: SENDER_EMAIL from env: {os.getenv('SENDER_EMAIL', 'NOT SET')}")
    print(f"DEBUG: SENDER_PASSWORD from env: {'*' * len(os.getenv('SENDER_PASSWORD', '')) if os.getenv('SENDER_PASSWORD') else 'NOT SET'}")
    
    # Simple file-based storage for CLI testing
    CODES_FILE = "temp_mfa_codes.json"
    
    def save_code(email, code, expiry):
        codes = {}
        if os.path.exists(CODES_FILE):
            try:
                with open(CODES_FILE, 'r') as f:
                    codes = json.load(f)
            except:
                codes = {}
        
        codes[email] = {
            'code': code,
            'expiry': expiry,
            'attempts': 0
        }
        
        with open(CODES_FILE, 'w') as f:
            json.dump(codes, f)
    
    def verify_code(email, code):
        if not os.path.exists(CODES_FILE):
            return False, "No verification codes found"
        
        try:
            with open(CODES_FILE, 'r') as f:
                codes = json.load(f)
        except:
            return False, "Error reading codes file"
        
        if email not in codes:
            return False, "No verification code found for this email"
        
        stored_data = codes[email]
        
        # Check expiry
        if time.time() > stored_data['expiry']:
            del codes[email]
            with open(CODES_FILE, 'w') as f:
                json.dump(codes, f)
            return False, "Verification code expired"
        
        # Check attempts
        if stored_data['attempts'] >= 3:
            del codes[email]
            with open(CODES_FILE, 'w') as f:
                json.dump(codes, f)
            return False, "Too many attempts"
        
        # Increment attempts
        stored_data['attempts'] += 1
        with open(CODES_FILE, 'w') as f:
            json.dump(codes, f)
        
        # Verify code
        if stored_data['code'] == code:
            del codes[email]
            with open(CODES_FILE, 'w') as f:
                json.dump(codes, f)
            return True, "Code verified successfully"
        
        return False, "Invalid verification code"
    
    if len(sys.argv) < 2:
        print("Usage: python3 mfa_config.py <command> [args...]")
        print("Commands:")
        print("  send <email>     - Send verification code to email")
        print("  verify <email> <code> - Verify code for email")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "send" and len(sys.argv) == 3:
        email = sys.argv[2]
        code = mfa_config.generate_verification_code()
        expiry_time = time.time() + mfa_config.code_expiry
        save_code(email, code, expiry_time)
        success, message = mfa_config.send_verification_email(email, code)
        
        if success:
            print(f"SUCCESS: Code {code} sent to {email}")
            sys.exit(0)
        else:
            print(f"ERROR: {message}")
            sys.exit(1)
    
    elif command == "verify" and len(sys.argv) == 4:
        email = sys.argv[2]
        code = sys.argv[3]
        success, message = verify_code(email, code)
        
        if success:
            print(f"SUCCESS: Code verified for {email}")
            sys.exit(0)
        else:
            print(f"ERROR: {message}")
            sys.exit(1)
    
    else:
        print("Invalid command or arguments")
        sys.exit(1) 