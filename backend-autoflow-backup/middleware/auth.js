import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader); // Debug log
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log('Parsed token:', token); // Debug log

  if (!token) {
    console.log('No token provided'); // Debug log
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded JWT:', decoded); // Debug log
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      console.log('Invalid or inactive user'); // Debug log
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('JWT error:', error); // Debug log
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

// Permission-based access control middleware
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userPermissions = req.user.permissions;
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({ 
        message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}` 
      });
    }

    next();
  };
};

// Optional authentication middleware (for endpoints that work with or without auth)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we continue without authentication
    }
  }

  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export {
  authenticateToken,
  requireRole,
  requirePermission,
  optionalAuth,
  generateToken,
  verifyToken,
  JWT_SECRET
}; 