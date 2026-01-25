import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import User from '../models/User.js';

// JWT Authentication middleware
export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findById(decoded.id).select('-password -otpHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error.message);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Optional JWT Authentication (doesn't fail if no token)
export const optionalJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password -otpHash');
      
      if (user && user.isVerified) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Admin role middleware (requires JWT authentication first)
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  next();
};

// User role middleware (requires JWT authentication first)
export const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  next();
};