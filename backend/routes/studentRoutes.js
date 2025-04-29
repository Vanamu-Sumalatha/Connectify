import express from 'express';
import auth from '../middleware/auth.js';
import Student from '../models/student/Student.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Enrollment from '../models/Enrollment.js';
import studentController from '../controllers/studentController.js';

const router = express.Router();

// Get student dashboard data
router.get('/dashboard', auth, async (req, res) => {
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

// Get student enrolled courses
router.get('/courses', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const enrolledCourses = await Course.find({
      _id: { $in: student.enrolledCourses }
    }).select('title description thumbnail category level enrollmentCount');

    res.json(enrolledCourses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses' });
  }
});

// Get all enrolled courses for a student
router.get('/courses/enrolled', auth, async (req, res) => {
  try {
    console.log('Fetching enrolled courses for user:', req.user.id);
    
    // Find all enrollments for this student
    const enrollments = await Enrollment.find({ 
      student: req.user.id,
      status: { $ne: 'wishlist' } // Exclude wishlist items
    }).populate({
      path: 'course',
      select: 'title description thumbnail category level totalStudents'
    });
    
    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }
    
    // Format the response
    const formattedCourses = enrollments.map(enrollment => {
      return {
        _id: enrollment.course._id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnail: enrollment.course.thumbnail,
        instructor: 'Course Instructor', // Default value since instructor field was removed
        progress: enrollment.progress,
        status: enrollment.status,
        lastAccessed: enrollment.lastAccessDate,
        completedLessons: enrollment.completedLessons ? enrollment.completedLessons.length : 0,
        totalLessons: 12, // This should come from the course schema
        isWishlisted: enrollment.isWishlisted,
        category: enrollment.course.category,
        level: enrollment.course.level,
        enrollmentCount: enrollment.course.totalStudents
      };
    });
    
    console.log(`Found ${formattedCourses.length} enrolled courses`);
    res.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses', error: error.message });
  }
});

// Get an enrolled course by ID
router.get('/courses/enrolled/:courseId', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Find the enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    }).populate('course');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Course enrollment not found' });
    }
    
    // Format the response
    const courseData = {
      _id: enrollment.course._id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      thumbnail: enrollment.course.thumbnail,
      instructor: 'Course Instructor', // Default value
      progress: enrollment.progress,
      status: enrollment.status,
      lastAccessed: enrollment.lastAccessDate,
      completedLessons: enrollment.completedLessons ? enrollment.completedLessons.length : 0,
      totalLessons: enrollment.course.lessons ? enrollment.course.lessons.length : 12,
      isWishlisted: enrollment.isWishlisted,
      lessons: enrollment.course.lessons || [],
      category: enrollment.course.category,
      level: enrollment.course.level,
      duration: enrollment.course.duration
    };
    
    res.json(courseData);
  } catch (error) {
    console.error('Error fetching enrolled course:', error);
    res.status(500).json({ message: 'Error fetching enrolled course', error: error.message });
  }
});

// Get all courses in wishlist
router.get('/courses/wishlist', auth, async (req, res) => {
  try {
    console.log('Fetching wishlist for user:', req.user.id);
    
    // Find all wishlist enrollments for this student
    const enrollments = await Enrollment.find({ 
      student: req.user.id,
      isWishlisted: true
    }).populate({
      path: 'course',
      select: 'title description thumbnail category level totalStudents'
    });
    
    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }
    
    // Format the response
    const wishlistedCourses = enrollments.map(enrollment => {
      return {
        _id: enrollment.course._id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnail: enrollment.course.thumbnail,
        instructor: 'Course Instructor', // Default value
        progress: 0,
        status: 'wishlist',
        isWishlisted: true,
        category: enrollment.course.category,
        level: enrollment.course.level,
        enrollmentCount: enrollment.course.totalStudents
      };
    });
    
    console.log(`Found ${wishlistedCourses.length} wishlisted courses`);
    res.json(wishlistedCourses);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
});

// Toggle course wishlist status
router.post('/courses/wishlist/:courseId', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find existing enrollment
    let enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });
    
    if (!enrollment) {
      // Create new enrollment with wishlist status
      enrollment = new Enrollment({
        student: req.user.id,
        course: courseId,
        enrollmentDate: new Date(),
        status: 'wishlist',
        progress: 0,
        isWishlisted: true,
        lastAccessDate: new Date()
      });
    } else {
      // Toggle wishlist status
      enrollment.isWishlisted = !enrollment.isWishlisted;
      
      // Update status if needed
      if (enrollment.isWishlisted && enrollment.status !== 'in-progress' && enrollment.status !== 'completed') {
        enrollment.status = 'wishlist';
      } else if (!enrollment.isWishlisted && enrollment.status === 'wishlist') {
        enrollment.status = 'not-started';
      }
    }
    
    await enrollment.save();
    
    // Find or create student record
    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      student = new Student({
        user: req.user.id,
        enrolledCourses: [],
        progress: new Map(),
        achievements: [],
        learningStreak: 0,
        lastActive: new Date(),
        totalLearningHours: 0
      });
    }
    
    // Update student's enrolled courses if needed
    if (enrollment.isWishlisted && !student.enrolledCourses.includes(courseId)) {
      student.enrolledCourses.push(courseId);
      await student.save();
    }
    
    res.json({ 
      message: enrollment.isWishlisted ? 'Added to wishlist' : 'Removed from wishlist',
      isWishlisted: enrollment.isWishlisted
    });
  } catch (error) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({ message: 'Error updating wishlist', error: error.message });
  }
});

// Enroll in a course
router.post('/courses/enroll/:courseId', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Create a new enrollment record
    const enrollment = new Enrollment({
      student: req.user.id,
      course: courseId,
      enrollmentDate: new Date(),
      status: 'not-started',
      progress: 0,
      lastAccessDate: new Date()
    });
    
    await enrollment.save();
    
    // Find or create student record
    let student = await Student.findOne({ user: req.user.id });
    
    if (!student) {
      student = await Student.create({
        user: req.user.id,
        enrolledCourses: [courseId],
        progress: new Map([[courseId, 0]]),
        achievements: [],
        learningStreak: 0,
        lastActive: new Date(),
        totalLearningHours: 0,
        completedAssignments: [],
        quizScores: []
      });
    } else {
      // Add to enrolled courses if not already there
      if (!student.enrolledCourses.includes(courseId)) {
        student.enrolledCourses.push(courseId);
        student.progress.set(courseId, 0);
        await student.save();
      }
    }
    
    // Update course enrollment count and add student to enrolledStudents
    await Course.findByIdAndUpdate(courseId, { 
      $inc: { totalStudents: 1 },
      $addToSet: { enrolledStudents: req.user.id }
    });
    
    // Add student to course chat rooms
    try {
      const ChatRoom = (await import('../models/ChatRoom.js')).default;
      const chatRooms = await ChatRoom.find({ courseId: courseId });
      
      for (const room of chatRooms) {
        if (!room.members.includes(req.user.id)) {
          room.members.push(req.user.id);
          room.memberCount = room.members.length;
          await room.save();
        }
      }
      
      console.log(`Added student to chat rooms for course`);
    } catch (chatError) {
      console.error('Error adding student to chat rooms:', chatError);
      // Continue even if adding to chat rooms fails
    }
    
    res.json({ 
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Error enrolling in course', error: error.message });
  }
});

// Update course progress
router.put('/courses/:courseId/progress', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }
    
    // Update progress
    student.progress.set(req.params.courseId, progress);
    await student.save();
    
    res.json({ message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
});

// Todo Routes
router.get('/todos', auth, studentController.getTodos);
router.post('/todos', auth, studentController.createTodo);
router.patch('/todos/:id', auth, studentController.updateTodo);
router.delete('/todos/:id', auth, studentController.deleteTodo);

export default router; 