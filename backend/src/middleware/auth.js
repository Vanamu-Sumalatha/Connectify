import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

// General authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// Admin authentication middleware - Modified to allow students access to chat-rooms
export const isAdmin = async (req, res, next) => {
  try {
    // Special case for chat rooms GET requests - allow students access
    if (req.method === 'GET' && req.path.startsWith('/chat-rooms')) {
      console.log('Student accessing admin chat-rooms endpoint', req.path);
      if (req.user && (req.user.role === 'admin' || req.user.role === 'student')) {
        return next();
      }
    }
    
    // For all other admin routes, enforce admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Student authentication middleware
export const isStudent = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Student privileges required.' });
    }
    next();
  } catch (error) {
    console.error('Student auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to allow both admin and student access
export const isAdminOrStudent = async (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'student')) {
      return res.status(403).json({ message: 'Access denied. Admin or Student privileges required.' });
    }
    
    // Set a flag to indicate if user is admin (useful for controllers to distinguish)
    req.isAdmin = req.user.role === 'admin';
    
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 