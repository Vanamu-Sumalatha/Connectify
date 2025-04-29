import express from 'express';
import auth from '../../middleware/auth.js';
import Student from '../../models/student/Student.js';
import Course from '../../models/common/Course.js';
import Assignment from '../../models/common/Assignment.js';

const router = express.Router();

// Get student dashboard data
router.get('/', auth, async (req, res) => {
  console.log('Dashboard route hit');
  console.log('User from auth middleware:', req.user);
  
  try {
    // First, check if student record exists
    console.log('Looking up student record for user:', req.user.id);
    let student = await Student.findOne({ user: req.user.id }).populate('enrolledCourses');
    
    // If no student record exists, create one
    if (!student) {
      console.log('No student record found, creating new one');
      student = await Student.create({
        user: req.user.id,
        enrolledCourses: [],
        progress: {},
        achievements: [],
        learningStreak: 0,
        lastActive: new Date(),
        totalLearningHours: 0,
        completedAssignments: [],
        quizScores: [],
        certificates: [],
        preferences: {
          notifications: {
            email: true,
            push: true,
            inApp: true
          },
          theme: 'system',
          language: 'en'
        }
      });
      console.log('New student record created:', student);
    } else {
      console.log('Found existing student record:', student);
    }
    
    // Get active courses
    console.log('Fetching active courses for student');
    const activeCourses = await Course.find({
      _id: { $in: student.enrolledCourses },
      status: 'published'
    });
    console.log('Active courses found:', activeCourses.length);

    // Get upcoming assignments
    console.log('Fetching upcoming assignments');
    const upcomingAssignments = await Assignment.find({
      course: { $in: student.enrolledCourses },
      dueDate: { $gt: new Date() }
    }).sort({ dueDate: 1 }).limit(5);
    console.log('Upcoming assignments found:', upcomingAssignments.length);

    // Calculate progress
    const totalCourses = student.enrolledCourses.length;
    const completedCourses = student.enrolledCourses.filter(course => 
      student.progress.get(course._id.toString()) === 100
    ).length;
    const progress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
    console.log('Progress calculated:', { totalCourses, completedCourses, progress });

    // Prepare dashboard data
    const dashboardData = {
      progress: Math.round(progress),
      activeCourses: activeCourses.length,
      completedCourses: completedCourses,
      streak: student.learningStreak,
      totalHours: student.totalLearningHours,
      achievements: student.achievements.length,
      pendingAchievements: 2,
      upcomingTasks: upcomingAssignments.map(assignment => ({
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        course: assignment.course
      })),
      announcements: [
        {
          title: 'New Course Available',
          content: 'A new course has been added to your program.',
          timestamp: new Date(),
          priority: 'high'
        },
        {
          title: 'Platform Update',
          content: 'We have updated our learning platform with new features.',
          timestamp: new Date(Date.now() - 86400000),
          priority: 'medium'
        }
      ],
      weeklyLearningTime: student.totalLearningHours,
      completedAssignments: student.completedAssignments.length,
      quizAverageScore: student.averageQuizScore || 0,
      upcomingEvents: [
        {
          title: 'Course Review Session',
          description: 'Join us for a review session of your current course.',
          startTime: new Date(Date.now() + 86400000)
        },
        {
          title: 'Live Webinar: Advanced Concepts',
          description: 'A deep dive into advanced concepts in your field of study.',
          startTime: new Date(Date.now() + 3 * 86400000)
        }
      ]
    };

    console.log('Sending dashboard data:', dashboardData);
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

export default router; 