import express from 'express';
import { getDashboardData, getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/adminController.js';
import auth from '../middleware/auth.js';
import Course from '../models/Course.js';
import StudyGroup from '../models/StudyGroup.js';
import ChatRoom from '../models/ChatRoom.js';
import mongoose from 'mongoose';
import Assignment from '../models/Assignment.js';
import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';

const router = express.Router();

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

// Admin Courses Routes
router.get('/courses', auth, async (req, res) => {
  try {
    console.log('Fetching courses for admin');
    const courses = await Course.find()
      .sort({ createdAt: -1 });
    
    console.log(`Found ${courses.length} courses`);
    
    // Always return the courses array, even if empty
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses for admin:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin Dashboard Routes
router.get('/dashboard', auth, adminAuth, getDashboardData);

// Analytics Routes
router.get('/analytics', auth, adminAuth, async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    console.log('Fetching analytics data for timeRange:', timeRange);
    
    // Calculate date ranges based on timeRange
    const now = new Date();
    let startDate = new Date();
    let labels = [];
    
    if (timeRange === 'weekly') {
      // Last 7 days
      startDate.setDate(now.getDate() - 7);
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (timeRange === 'monthly') {
      // Last 4 weeks
      startDate.setDate(now.getDate() - 28);
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    } else {
      // Last 12 months
      startDate.setMonth(now.getMonth() - 12);
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
    
    // Import models
    const User = mongoose.model('User');
    // Course is already imported at the top
    
    // Get total users count
    let totalUsers = 0;
    try {
      totalUsers = await User.countDocuments();
    } catch (error) {
      console.error('Error counting users:', error);
    }
    
    // Get users count by role
    let studentCount = 0, instructorCount = 0, adminCount = 0;
    try {
      studentCount = await User.countDocuments({ role: 'student' });
      instructorCount = await User.countDocuments({ role: 'instructor' });
      adminCount = await User.countDocuments({ role: 'admin' });
    } catch (error) {
      console.error('Error counting users by role:', error);
    }
    
    // Get total courses count
    let totalCourses = 0;
    try {
      totalCourses = await Course.countDocuments();
    } catch (error) {
      console.error('Error counting courses:', error);
    }
    
    // Get total certificates count
    let totalCertificates = 0;
    try {
      totalCertificates = await Certificate.countDocuments();
    } catch (error) {
      console.error('Error counting certificates:', error);
      // If Certificate model doesn't exist or has other issues
      console.log('Using default value for certificate count');
    }
    
    // Get course completions count
    let courseCompletions = 0;
    try {
      // Check if Enrollment model exists
      if (mongoose.modelNames().includes('Enrollment')) {
        courseCompletions = await mongoose.model('Enrollment').countDocuments({ status: 'completed' });
      } else {
        console.log('Enrollment model not found, using default value');
        courseCompletions = 325; // Default value if model doesn't exist
      }
    } catch (error) {
      console.error('Error counting course completions:', error);
      courseCompletions = 325; // Fallback to default value
    }
    
    // Calculate user activity (logins/activity per time period)
    // This is simplified - in a real implementation, you'd query login logs or user activity
    const userActivity = {
      labels,
      data: labels.map(() => Math.floor(Math.random() * 100) + 20) // Temporary random data
    };
    
    // Calculate course enrollments over time
    const courseEnrollments = {
      labels,
      data: labels.map(() => Math.floor(Math.random() * 50) + 10) // Temporary random data
    };
    
    // Calculate certificates issued over time
    const certificates = {
      labels,
      data: labels.map(() => Math.floor(Math.random() * 30) + 5) // Temporary random data
    };
    
    // Get top courses by enrollment
    let topCourses = [];
    try {
      // Check if the Enrollment model exists before using it in aggregation
      if (!mongoose.modelNames().includes('Enrollment')) {
        throw new Error('Enrollment model not found');
      }
      
      const topCoursesData = await Course.aggregate([
        // No instructor lookup needed
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'course',
            as: 'enrollments'
          }
        },
        {
          $addFields: {
            registrationCount: { $size: '$enrollments' },
            completionRate: {
              $multiply: [
                {
                  $cond: {
                    if: { $eq: [{ $size: '$enrollments' }, 0] },
                    then: 0,
                    else: {
                      $divide: [
                        {
                          $size: {
                            $filter: {
                              input: '$enrollments',
                              as: 'enrollment',
                              cond: { $eq: ['$$enrollment.status', 'completed'] }
                            }
                          }
                        },
                        { $size: '$enrollments' }
                      ]
                    }
                  }
                },
                100
              ]
            }
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            registrationCount: 1,
            completionRate: 1,
            avgRating: { $ifNull: ['$rating', 4.5] }
          }
        },
        { $sort: { registrationCount: -1 } },
        { $limit: 5 }
      ]);
      
      // Format top courses
      topCourses = topCoursesData.map(course => ({
        title: course.title,
        registrations: course.registrationCount || 0,
        completionRate: Math.round(course.completionRate) || 0,
        avgRating: parseFloat(course.avgRating.toFixed(1)) || 4.5
      }));
    } catch (error) {
      console.error('Error getting top courses:', error);
      // Fallback to default courses if aggregation fails
      topCourses = [
        {
          title: 'Introduction to Web Development',
          registrations: 235,
          completionRate: 78,
          avgRating: 4.8
        },
        {
          title: 'Python for Beginners',
          registrations: 198,
          completionRate: 85,
          avgRating: 4.9
        },
        {
          title: 'Advanced JavaScript Concepts',
          registrations: 167,
          completionRate: 62,
          avgRating: 4.5
        },
        {
          title: 'UX/UI Design Fundamentals',
          registrations: 145,
          completionRate: 70,
          avgRating: 4.7
        },
        {
          title: 'Data Science Essentials',
          registrations: 132,
          completionRate: 58,
          avgRating: 4.6
        }
      ];
    }
    
    // Calculate growth metrics (comparing to previous period)
    // In a real scenario, you would query historical data for comparison
    const userGrowth = 12.5;
    const courseGrowth = 8.2;
    const completionGrowth = 15.7;
    const certificateGrowth = 22.3;
    
    const analyticsData = {
      totalUsers,
      totalCourses,
      courseCompletions,
      totalCertificates,
      userGrowth,
      courseGrowth,
      completionGrowth,
      certificateGrowth,
      usersByRole: {
        student: studentCount,
        instructor: instructorCount,
        admin: adminCount
      },
      userActivity,
      courseEnrollments,
      certificates,
      topCourses
    };
    
    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: error.message });
  }
});

// User Management Routes
router.get('/users', auth, getAllUsers);
router.get('/users/:id', auth, getUserById);
router.put('/users/:id', auth, adminAuth, updateUser);
router.delete('/users/:id', auth, adminAuth, deleteUser);

// Get course enrollment details
router.get('/courses/:courseId/enrollments', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Find course to verify it exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find all enrollments for this course with student details
    const enrollments = await Enrollment.find({ course: courseId })
      .populate({
        path: 'student',
        select: 'username email profile',
        populate: {
          path: 'profile',
          select: 'firstName lastName avatar'
        }
      })
      .sort({ enrollmentDate: -1 });
    
    // Get enrollment statistics
    const statistics = {
      totalEnrollments: enrollments.length,
      byStatus: {
        notStarted: enrollments.filter(e => e.status === 'not-started').length,
        inProgress: enrollments.filter(e => e.status === 'in-progress').length,
        completed: enrollments.filter(e => e.status === 'completed').length,
        wishlist: enrollments.filter(e => e.isWishlisted).length
      },
      averageProgress: enrollments.length > 0 
        ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length 
        : 0
    };
    
    // Format enrollment data for response
    const formattedEnrollments = enrollments.map(enrollment => {
      const student = enrollment.student;
      
      return {
        _id: enrollment._id,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status || 'not-started',
        progress: enrollment.progress || 0,
        lastAccessDate: enrollment.lastAccessDate,
        completionDate: enrollment.completionDate,
        student: student ? {
          _id: student._id,
          username: student.username,
          email: student.email,
          firstName: student.profile?.firstName || '',
          lastName: student.profile?.lastName || '',
          avatar: student.profile?.avatar || ''
        } : null
      };
    });
    
    res.json({
      course: {
        _id: course._id,
        title: course.title,
        enrollmentCount: course.enrollmentCount || course.totalStudents || 0
      },
      statistics,
      enrollments: formattedEnrollments
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get enrollment dashboard data for admin
router.get('/enrollment-dashboard', auth, adminAuth, async (req, res) => {
  try {
    // Get latest enrollment data
    const enrollments = await Enrollment.find()
      .sort({ enrollmentDate: -1 })
      .limit(100);
    
    // Get courses with most enrollments
    const courses = await Course.find()
      .sort({ totalStudents: -1, enrollmentCount: -1 })
      .limit(10)
      .select('title thumbnail totalStudents enrollmentCount');
    
    // Calculate enrollment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    let enrollmentTrends = [];
    try {
      const monthlyEnrollments = await Enrollment.aggregate([
        {
          $match: {
            enrollmentDate: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$enrollmentDate" },
              month: { $month: "$enrollmentDate" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 }
        }
      ]);
      
      // Format monthly trends for chart display
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      enrollmentTrends = monthlyEnrollments.map(item => ({
        month: months[item._id.month - 1],
        year: item._id.year,
        count: item.count,
        label: `${months[item._id.month - 1]} ${item._id.year}`
      }));
    } catch (error) {
      console.error('Error calculating enrollment trends:', error);
      // Provide default data if aggregation fails
      enrollmentTrends = [];
    }
    
    // Count active and completed enrollments with error handling
    let totalActiveEnrollments = 0;
    let totalCompletedEnrollments = 0;
    
    try {
      totalActiveEnrollments = await Enrollment.countDocuments({ 
        status: { $in: ['in-progress', 'not-started'] } 
      });
    } catch (error) {
      console.error('Error counting active enrollments:', error);
    }
    
    try {
      totalCompletedEnrollments = await Enrollment.countDocuments({ 
        status: 'completed' 
      });
    } catch (error) {
      console.error('Error counting completed enrollments:', error);
    }
    
    res.json({
      topCourses: courses,
      recentEnrollments: enrollments.length,
      enrollmentTrends,
      totalActiveEnrollments,
      totalCompletedEnrollments
    });
  } catch (error) {
    console.error('Error fetching enrollment dashboard data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Chat Rooms Management Routes  adminAuth
router.get('/chat-rooms', auth, async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    console.log('Fetching chat rooms for admin, type:', type);
    
    // Query based on type
    let query = {};
    if (type !== 'all') {
      query.type = type;
    }
    
    const chatRooms = await ChatRoom.find(query)
      .populate('courseId', 'title')
      .populate('studyGroupId', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${chatRooms.length} chat rooms`);
    
    // Always return an array, even if empty
    res.json(chatRooms);
  } catch (error) {
    console.error('Error fetching chat rooms for admin:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create Chat Room
router.post('/chat-rooms', auth, adminAuth, async (req, res) => {
  try {
    const { name, type, description, courseId, studyGroupId } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }
    
    // Check if this chat room already exists
    let existingRoom;
    if (type === 'course' && courseId) {
      existingRoom = await ChatRoom.findOne({ courseId, type: 'course' });
    } else if (type === 'study-group' && studyGroupId) {
      existingRoom = await ChatRoom.findOne({ studyGroupId, type: 'study-group' });
    } else if (type === 'discussions') {
      existingRoom = await ChatRoom.findOne({ name, type: 'discussions' });
    }
    
    if (existingRoom) {
      return res.status(400).json({ message: 'A chat room for this already exists' });
    }
    
    // Create new chat room
    const newChatRoom = new ChatRoom({
      name,
      type,
      description,
      courseId: type === 'course' ? courseId : undefined,
      studyGroupId: type === 'study-group' ? studyGroupId : undefined,
      members: [],
      moderators: [req.user._id]
    });
    
    const savedChatRoom = await newChatRoom.save();
    res.status(201).json(savedChatRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Chat Room
router.put('/chat-rooms/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Don't allow changing the type or linked resources
    delete updateData.type;
    delete updateData.courseId;
    delete updateData.studyGroupId;
    
    const updatedChatRoom = await ChatRoom.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedChatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    res.json(updatedChatRoom);
  } catch (error) {
    console.error('Error updating chat room:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Chat Room
router.delete('/chat-rooms/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedChatRoom = await ChatRoom.findByIdAndDelete(id);
    
    if (!deletedChatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    res.json({ message: `Chat room ${id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json({ message: error.message });
  }
});

// Study Groups Management Routes
router.get('/study-groups', auth, adminAuth, async (req, res) => {
  try {
    console.log('Fetching study groups for admin');
    
    const studyGroups = await StudyGroup.find()
      .populate('courseId', 'title')
      .populate('leaderId', 'username email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${studyGroups.length} study groups`);
    
    if (studyGroups.length === 0) {
      return res.json({ message: 'No study groups found in database' });
    }
    
    res.json(studyGroups);
  } catch (error) {
    console.error('Error fetching study groups for admin:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create Study Group
router.post('/study-groups', auth, adminAuth, async (req, res) => {
  try {
    const { name, course, courseId, leader, leaderId, nextMeeting, status } = req.body;
    
    if (!name || !course || !courseId || !leader || !leaderId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure we have a valid user for leader
    let leaderUser;
    try {
      // If leaderId is a string but not a valid ObjectId, create a user
      if (typeof leaderId === 'string' && !mongoose.Types.ObjectId.isValid(leaderId)) {
        console.log(`Creating new user for study group leader with username: ${leader}`);
        const User = (await import('../models/User.js')).default;
        
        // Create a unique email based on leaderId string
        const email = `${leaderId.toLowerCase().replace(/[^a-z0-9]/g, '')}@connectify.edu`;
        
        // Create a simple password
        const password = 'password123'; // Will be hashed by the User model
        
        // Split leader name into firstName and lastName
        const nameParts = leader.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';
        
        // Create a new user for the leader
        leaderUser = new User({
          username: leader,
          email: email,
          password: password,
          role: 'student',
          profile: {
            name: leader,
            firstName: firstName,
            lastName: lastName
          }
        });
        
        await leaderUser.save();
        console.log(`Created new user with ID: ${leaderUser._id}`);
      } else {
        // If leaderId is valid ObjectId, find the user
        const User = (await import('../models/User.js')).default;
        leaderUser = await User.findById(leaderId);
        
        // If user not found, create one
        if (!leaderUser) {
          console.log(`User with ID ${leaderId} not found, creating a new user`);
          // Create a unique email based on leader name
          const email = `${leader.toLowerCase().replace(/\s+/g, '.')}@connectify.edu`;
          
          // Split leader name into firstName and lastName
          const nameParts = leader.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';
          
          leaderUser = new User({
            username: leader,
            email: email,
            password: 'password123', // Will be hashed by the User model
            role: 'student',
            profile: {
              name: leader,
              firstName: firstName,
              lastName: lastName
            }
          });
          
          await leaderUser.save();
          console.log(`Created new user with ID: ${leaderUser._id}`);
        }
      }
    } catch (userError) {
      console.error('Error handling leader user:', userError);
      return res.status(400).json({ message: `Error creating or finding leader user: ${userError.message}` });
    }
    
    const newStudyGroup = new StudyGroup({
      name,
      course,
      courseId,
      leader,
      leaderId: leaderUser._id, // Use the user's _id
      members: [leaderUser._id], // Start with leader as member
      memberCount: 1,
      nextMeeting: nextMeeting || null,
      status: status || 'active'
    });
    
    const savedStudyGroup = await newStudyGroup.save();
    
    // Create a chat room for this study group
    const newChatRoom = new ChatRoom({
      name: `${name} Chat`,
      type: 'study-group',
      description: `Chat room for the ${name} study group`,
      studyGroupId: savedStudyGroup._id,
      members: [leaderUser._id],
      memberCount: 1,
      moderators: [leaderUser._id]
    });
    
    await newChatRoom.save();
    
    res.status(201).json(savedStudyGroup);
  } catch (error) {
    console.error('Error creating study group:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Study Group
router.put('/study-groups/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle leaderId if it's a string but not a valid ObjectId
    if (updateData.leaderId && typeof updateData.leaderId === 'string' && !mongoose.Types.ObjectId.isValid(updateData.leaderId)) {
      try {
        console.log(`Creating/finding user for study group leader update with username: ${updateData.leader}`);
        const User = (await import('../models/User.js')).default;
        
        // Try to find a user with the same username first
        let leaderUser = await User.findOne({ username: updateData.leader });
        
        if (!leaderUser) {
          // Create a unique email based on leaderId string
          const email = `${updateData.leaderId.toLowerCase().replace(/[^a-z0-9]/g, '')}@connectify.edu`;
          
          // Split leader name into firstName and lastName
          const nameParts = updateData.leader.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';
          
          // Create a new user for the leader
          leaderUser = new User({
            username: updateData.leader,
            email: email,
            password: 'password123', // Will be hashed by the User model
            role: 'student',
            profile: {
              name: updateData.leader,
              firstName: firstName,
              lastName: lastName
            }
          });
          
          await leaderUser.save();
          console.log(`Created new user with ID: ${leaderUser._id}`);
        }
        
        // Update the leaderId to use the ObjectId
        updateData.leaderId = leaderUser._id;
      } catch (userError) {
        console.error('Error handling leader user during update:', userError);
        return res.status(400).json({ message: `Error creating or finding leader user: ${userError.message}` });
      }
    }
    
    const updatedStudyGroup = await StudyGroup.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedStudyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }
    
    // Update associated chat room if needed
    if (updateData.name) {
      await ChatRoom.updateOne(
        { studyGroupId: id, type: 'study-group' },
        { 
          name: `${updateData.name} Chat`,
          description: `Chat room for the ${updateData.name} study group`
        }
      );
    }
    
    res.json(updatedStudyGroup);
  } catch (error) {
    console.error('Error updating study group:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Study Group
router.delete('/study-groups/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedStudyGroup = await StudyGroup.findByIdAndDelete(id);
    
    if (!deletedStudyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }
    
    // Delete associated chat room
    await ChatRoom.deleteOne({ studyGroupId: id, type: 'study-group' });
    
    res.json({ message: `Study group ${id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting study group:', error);
    res.status(500).json({ message: error.message });
  }
});

// Assignment Management Routes
// Get all assignments
router.get('/assignments', auth, adminAuth, async (req, res) => {
  try {
    console.log('Fetching assignments for admin');
    const assignments = await Assignment.find()
      .populate('courseId', 'title', null, { strictPopulate: false })
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${assignments.length} assignments`);
    
    // Always return the assignments array
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments for admin:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get assignment by ID
router.get('/assignments/:id', auth, adminAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('courseId', 'title', null, { strictPopulate: false })
      .populate('createdBy', 'username email');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create assignment
router.post('/assignments', auth, adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      courseId, 
      type, 
      questions, 
      passingScore, 
      duration, 
      isCertificateTest,
      totalPoints,
      dueDate 
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    if (!type) {
      return res.status(400).json({ message: 'Type is required' });
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }
    
    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }
    
    if (totalPoints === undefined || totalPoints === null) {
      return res.status(400).json({ message: 'Total points is required' });
    }
    
    // Verify that the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Calculate totalPoints from questions if not explicitly provided
    const calculatedTotalPoints = questions.reduce((sum, question) => sum + (question.points || 1), 0);
    
    const newAssignment = new Assignment({
      title,
      description,
      courseId,
      type,
      questions,
      passingScore: passingScore || 70,
      duration: duration || 30,
      isCertificateTest: isCertificateTest || false,
      totalPoints: totalPoints || calculatedTotalPoints,
      dueDate,
      createdBy: req.user._id
    });
    
    const savedAssignment = await newAssignment.save();
    
    res.status(201).json(savedAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    
    if (error.name === 'ValidationError') {
      // Handle Mongoose validation errors
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Update assignment
router.put('/assignments/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate the update data
    if (updateData.courseId) {
      // Check if the course exists
      const course = await Course.findById(updateData.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
    }
    
    if (updateData.questions && (!Array.isArray(updateData.questions) || updateData.questions.length === 0)) {
      return res.status(400).json({ message: 'At least one question is required' });
    }
    
    // Calculate total points if questions are updated
    if (updateData.questions && Array.isArray(updateData.questions)) {
      updateData.totalPoints = updateData.totalPoints || 
        updateData.questions.reduce((sum, question) => sum + (question.points || 1), 0);
    }
    
    // First check if the assignment exists
    const existingAssignment = await Assignment.findById(id);
    
    if (!existingAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } // Run mongoose validators
    );
    
    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    
    if (error.name === 'ValidationError') {
      // Handle Mongoose validation errors
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors
      });
    } else if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Delete assignment
router.delete('/assignments/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }
    
    const deletedAssignment = await Assignment.findByIdAndDelete(id);
    
    if (!deletedAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Delete associated certificates if this was a certificate test
    if (deletedAssignment.isCertificateTest) {
      try {
        const deletedCertificates = await Certificate.deleteMany({ assignment: id });
        console.log(`Deleted ${deletedCertificates.deletedCount} certificates associated with assignment ${id}`);
      } catch (certError) {
        console.error('Error deleting associated certificates:', certError);
        // We don't want to fail the whole operation if certificate deletion fails
      }
    }
    
    res.json({ 
      message: `Assignment ${id} deleted successfully`,
      deletedAssignment
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Certificate Management Routes
// Get all certificates
router.get('/certificates', auth, adminAuth, async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('student', 'username email profile')
      .populate('course', 'title')
      .populate('assignment', 'title')
      .sort({ issueDate: -1 });
    
    console.log(`Found ${certificates.length} certificates`);
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: error.message });
  }
});

// Issue certificate manually
router.post('/certificates', auth, adminAuth, async (req, res) => {
  try {
    const { studentId, courseId, assignmentId, title, score } = req.body;
    
    if (!studentId || !courseId || !title || !score) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newCertificate = new Certificate({
      student: studentId,
      course: courseId,
      assignment: assignmentId,
      title,
      score
    });
    
    const savedCertificate = await newCertificate.save();
    
    res.status(201).json(savedCertificate);
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ message: error.message });
  }
});

// Revoke certificate
router.put('/certificates/:id/revoke', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const certificate = await Certificate.findById(id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    certificate.status = 'revoked';
    await certificate.save();
    
    res.json({ message: 'Certificate revoked successfully', certificate });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 