"""
AutoFlow Security Middleware
Provides security enhancements for the AutoFlow backend application
"""

import jwt
import hashlib
import os
import re
import logging
from functools import wraps
from flask import request, jsonify, current_app, g
from datetime import datetime, timedelta
import secrets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecurityMiddleware:
    """Main security middleware class for AutoFlow"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize security middleware with Flask app"""
        self.app = app
        
        # Register security headers middleware
        app.after_request(self.add_security_headers)
        
        # Register request logging middleware
        app.before_request(self.log_request)
        
        # Register rate limiting
        app.before_request(self.rate_limit_check)
        
        logger.info("Security middleware initialized successfully")
    
    def add_security_headers(self, response):
        """Add security headers to all responses"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        return response
    
    def log_request(self):
        """Log all incoming requests for security monitoring"""
        g.start_time = datetime.now()
        g.request_id = secrets.token_hex(8)
        
        logger.info(f"Request {g.request_id}: {request.method} {request.path} from {request.remote_addr}")
        
        # Log potentially suspicious requests
        if self._is_suspicious_request(request):
            logger.warning(f"Suspicious request {g.request_id}: {request.method} {request.path} from {request.remote_addr}")
    
    def rate_limit_check(self):
        """Basic rate limiting for security"""
        client_ip = request.remote_addr
        current_time = datetime.now()
        
        # Simple in-memory rate limiting (use Redis in production)
        if not hasattr(self, '_rate_limit_store'):
            self._rate_limit_store = {}
        
        if client_ip in self._rate_limit_store:
            last_request, count = self._rate_limit_store[client_ip]
            if (current_time - last_request).seconds < 60:  # 1 minute window
                if count > 100:  # Max 100 requests per minute
                    logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                    return jsonify({'error': 'Rate limit exceeded'}), 429
                self._rate_limit_store[client_ip] = (current_time, count + 1)
            else:
                self._rate_limit_store[client_ip] = (current_time, 1)
        else:
            self._rate_limit_store[client_ip] = (current_time, 1)
    
    def _is_suspicious_request(self, request):
        """Check if request appears suspicious"""
        suspicious_patterns = [
            r'\.\./',  # Path traversal
            r'<script',  # XSS attempts
            r'javascript:',  # JavaScript injection
            r'data:text/html',  # HTML injection
            r'UNION\s+SELECT',  # SQL injection
            r'exec\s*\(',  # Command injection
        ]
        
        request_string = f"{request.method} {request.path} {str(request.data)}"
        for pattern in suspicious_patterns:
            if re.search(pattern, request_string, re.IGNORECASE):
                return True
        return False

def security_headers(f):
    """Decorator to add security headers to specific endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = current_app.make_response(f(*args, **kwargs))
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response
    return decorated_function

def validate_input(f):
    """Decorator to validate input parameters"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Validate request data
        if request.is_json:
            data = request.get_json()
            if data and not _validate_json_data(data):
                return jsonify({'error': 'Invalid input data'}), 400
        
        # Validate URL parameters
        for key, value in kwargs.items():
            if not _validate_parameter(key, value):
                return jsonify({'error': f'Invalid parameter: {key}'}), 400
        
        return f(*args, **kwargs)
    return decorated_function

def _validate_json_data(data):
    """Validate JSON data for security"""
    if not isinstance(data, dict):
        return False
    
    # Check for potentially dangerous keys
    dangerous_keys = ['__class__', '__dict__', '__module__', 'eval', 'exec']
    for key in data.keys():
        if any(dk in str(key).lower() for dk in dangerous_keys):
            return False
    
    # Check for potentially dangerous values
    dangerous_values = ['<script', 'javascript:', 'data:text/html']
    for value in data.values():
        if isinstance(value, str):
            if any(dv in value.lower() for dv in dangerous_values):
                return False
    
    return True

def _validate_parameter(key, value):
    """Validate individual parameters"""
    if not isinstance(value, str):
        return True
    
    # Check for path traversal
    if '..' in value or '//' in value:
        return False
    
    # Check for script injection
    if '<script' in value.lower() or 'javascript:' in value.lower():
        return False
    
    return True

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Verify JWT token
            payload = jwt.decode(token, current_app.config.get('SECRET_KEY', 'default-secret'), algorithms=['HS256'])
            g.user_id = payload.get('user_id')
            g.user_role = payload.get('role')
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def require_role(required_role):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'user_role'):
                return jsonify({'error': 'Authentication required'}), 401
            
            if g.user_role != required_role and g.user_role != 'admin':
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def sanitize_input(input_string):
    """Sanitize input string to prevent injection attacks"""
    if not isinstance(input_string, str):
        return input_string
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', 'javascript:', 'data:']
    sanitized = input_string
    
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    # Remove multiple spaces
    sanitized = ' '.join(sanitized.split())
    
    return sanitized

def hash_password(password):
    """Hash password using secure method"""
    salt = os.urandom(32)
    hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt + hash_obj

def verify_password(password, hashed_password):
    """Verify password against hash"""
    salt = hashed_password[:32]
    hash_obj = hashed_password[32:]
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000) == hash_obj

def generate_secure_token(user_id, role, expires_in=3600):
    """Generate secure JWT token"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(seconds=expires_in),
        'iat': datetime.utcnow(),
        'jti': secrets.token_hex(16)
    }
    
    secret_key = current_app.config.get('SECRET_KEY', 'default-secret')
    return jwt.encode(payload, secret_key, algorithm='HS256')

# Security monitoring functions
def log_security_event(event_type, details, severity='INFO'):
    """Log security events for monitoring"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'event_type': event_type,
        'details': details,
        'severity': severity,
        'ip_address': request.remote_addr if request else 'unknown',
        'user_agent': request.headers.get('User-Agent') if request else 'unknown'
    }
    
    if severity == 'HIGH':
        logger.error(f"SECURITY ALERT: {event_type} - {details}")
    elif severity == 'MEDIUM':
        logger.warning(f"SECURITY WARNING: {event_type} - {details}")
    else:
        logger.info(f"SECURITY EVENT: {event_type} - {details}")
    
    # In production, send to security monitoring system
    return log_entry

def check_file_upload_security(filename, content_type, file_size):
    """Check uploaded files for security risks"""
    # Check file extension
    allowed_extensions = {'.txt', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'}
    file_ext = os.path.splitext(filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        log_security_event('FILE_UPLOAD_BLOCKED', f'Blocked file: {filename}', 'HIGH')
        return False, 'File type not allowed'
    
    # Check file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if file_size > max_size:
        log_security_event('FILE_UPLOAD_BLOCKED', f'File too large: {filename}', 'MEDIUM')
        return False, 'File too large'
    
    # Check content type
    allowed_types = {'text/', 'image/', 'application/pdf', 'application/msword'}
    if not any(allowed_type in content_type for allowed_type in allowed_types):
        log_security_event('FILE_UPLOAD_BLOCKED', f'Invalid content type: {content_type}', 'HIGH')
        return False, 'Invalid content type'
    
    return True, 'File upload allowed'

# Initialize security middleware
security = SecurityMiddleware()

# Export main functions
__all__ = [
    'security',
    'security_headers',
    'validate_input',
    'require_auth',
    'require_role',
    'sanitize_input',
    'hash_password',
    'verify_password',
    'generate_secure_token',
    'log_security_event',
    'check_file_upload_security'
] 