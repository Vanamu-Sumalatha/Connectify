import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Split name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Create user with required fields
    const user = await User.create({
      username: email.split('@')[0] + Math.floor(Math.random() * 1000), // Generate a username
      email,
      password,
      role: role || 'student',
      profile: {
        firstName,
        lastName: lastName || firstName // Use firstName as lastName if no lastName provided
      }
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Handle migration of older user records that might be missing required fields
    let updatedUser = user;
    let needsUpdate = false;

    // Check if username is missing
    if (!user.username) {
      user.username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      needsUpdate = true;
    }

    // Check if profile fields are missing
    if (!user.profile || !user.profile.firstName || !user.profile.lastName) {
      // Create profile data from email or existing name
      const defaultName = user.name || email.split('@')[0];
      const nameParts = defaultName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

      user.profile = {
        ...user.profile,
        firstName: user.profile?.firstName || firstName,
        lastName: user.profile?.lastName || lastName
      };
      needsUpdate = true;
    }

    // Save user if any fields were updated
    if (needsUpdate) {
      try {
        updatedUser = await user.save();
      } catch (updateError) {
        console.error('Error updating user with required fields:', updateError);
        // Continue with login even if update fails
      }
    }

    // Update last login
    updatedUser.lastLogin = new Date();
    await updatedUser.save();

    res.json({
      _id: updatedUser._id,
      name: `${updatedUser.profile.firstName} ${updatedUser.profile.lastName}`,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify token and get user data
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 