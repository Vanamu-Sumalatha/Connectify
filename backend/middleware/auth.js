import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  console.log('Auth middleware called for path:', req.originalUrl);
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token received:', token ? 'Present' : 'Missing');

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', { userId: decoded.id, role: decoded.role });

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found for decoded token');
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User found:', { id: user._id, email: user.email, role: user.role });
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

const authorize = (roles = []) => {
  console.log('Role authorization middleware called');
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(`User role ${req.user.role} not in allowed roles: ${roles.join(', ')}`);
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    console.log(`User with role ${req.user.role} authorized for action`);
    next();
  };
};

const isAdmin = async (req, res, next) => {
  console.log('Admin check middleware called for path:', req.originalUrl);
  
  // // Special exemption for public tests endpoint
  // if (req.originalUrl.includes('/tests/public')) {
  //   console.log('Tests public endpoint - allowing any authenticated user');
  //   return next();
  // }
  
  // // Special exemption for for-student endpoint
  // if (req.originalUrl.includes('/tests/for-student')) {
  //   console.log('Tests for-student endpoint - allowing any authenticated user');
  //   return next();
  // }
  
  // Special exemption for chat rooms - allow students to access chat room endpoints
  if (req.originalUrl.includes('/chat-rooms')) {
    console.log('Chat rooms exemption - allowing any authenticated user');
    if (req.user && (req.user.role === 'admin' || req.user.role === 'student' || req.user.role === 'instructor')) {
      console.log(`User is ${req.user.role}, proceeding with chat room access`);
      return next();
    }
  }
  
  // Regular admin check for other endpoints
  if (req.user && req.user.role === 'admin') {
    console.log('User is admin, proceeding');
    next();
  } else {
    console.log(`User is ${req.user?.role || 'unknown'}, access denied for admin-only resource`);
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

const isStudent = async (req, res, next) => {
  console.log('Student check middleware called');
  if (req.user && req.user.role === 'student') {
    console.log('User is student, proceeding');
    next();
  } else {
    console.log('User is not student, access denied');
    res.status(403).json({ message: 'Access denied. Student only.' });
  }
};

const isAdminOrStudent = async (req, res, next) => {
  console.log('Admin or Student check middleware called');
  if (req.user && (req.user.role === 'admin' || req.user.role === 'student')) {
    console.log(`User is ${req.user.role}, proceeding`);
    next();
  } else {
    console.log('User is not admin or student, access denied');
    res.status(403).json({ message: 'Access denied. Admin or Student only.' });
  }
};

// For backward compatibility
const auth = protect;

export { protect, authorize, isAdmin, isStudent, isAdminOrStudent, auth };
export default protect; 