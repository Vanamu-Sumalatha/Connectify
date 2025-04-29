import User from '../models/User.js';

// Get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    // Sample dashboard data - in a real app, this would come from database queries
    const dashboardData = {
      totalUsers: await User.countDocuments(),
      newUsersToday: 8,
      activeUsers: 4,
      coursesCompleted: 2,
      ongoingCourses: 7,
      recentActivities: [
        { id: 1, user: 'Admin User', activity: 'Created a new course', time: '2 hours ago' },
        { id: 2, user: 'Student One', activity: 'Completed Python Basics', time: '3 hours ago' },
        { id: 3, user: 'Student Two', activity: 'Started Web Development', time: '5 hours ago' }
      ],
      stats: {
        dailyActiveUsers: [65, 72, 78, 75, 82, 91, 88],
        weeklyEnrollments: [28, 32, 36, 29, 33, 38, 35],
        completionRates: [62, 58, 65, 60, 68, 72, 70]
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalUsers = await User.countDocuments();
    
    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasMore: skip + users.length < totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { username, email, role, status, profile } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;
    if (profile) {
      user.profile = {
        ...user.profile,
        ...profile
      };
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      profile: updatedUser.profile
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.deleteOne();
    
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
}; 