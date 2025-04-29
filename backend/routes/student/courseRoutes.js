import express from 'express';
import auth from '../../middleware/auth.js';
import Student from '../../models/student/Student.js';
import Course from '../../models/Course.js';
import Enrollment from '../../models/Enrollment.js';
import User from '../../models/User.js';

const router = express.Router();

// Apply middleware to all routes
router.use(auth);

// Get student enrolled courses (basic info)
router.get('/basic', async (req, res) => {
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

// Get student enrolled courses with detailed info
router.get('/enrolled', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    
    // Find all enrollments for this student
    const enrollments = await Enrollment.find({ 
      student: req.user.id,
      status: { $ne: 'wishlist' } // Exclude wishlist items
    }).populate({
      path: 'course',
      select: 'title description thumbnail category level duration totalStudents lessons'
    });
    
    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }
    
    // Format the response
    const formattedCourses = enrollments.map(enrollment => {
      // Calculate progress based on completed lessons
      let completedLessonsCount = enrollment.completedLessons ? enrollment.completedLessons.length : 0;
      let totalLessonsCount = enrollment.course && enrollment.course.lessons ? enrollment.course.lessons.length : 0;
      
      // Calculate progress percentage
      let progress = totalLessonsCount > 0 
        ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
        : 0;
      
      // Determine status based on progress and completion date
      let status = enrollment.status;
      
      // Only mark as completed if explicitly marked as completed or has completion date
      if (enrollment.completionDate || enrollment.status === 'completed') {
        status = 'completed';
      } 
      // For courses without completion date, use progress to determine status
      else if (progress > 0) {
        status = 'in-progress';
      } else {
        status = 'not-started';
      }
      
      return {
        _id: enrollment.course._id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnail: enrollment.course.thumbnail || '/assets/course-placeholder.jpg',
        instructor: 'Course Instructor',
        progress: progress,
        status: status,
        lastAccessed: enrollment.lastAccessDate,
        completedLessons: completedLessonsCount,
        totalLessons: totalLessonsCount,
        isWishlisted: enrollment.isWishlisted,
        isCompleted: status === 'completed',
        completionDate: enrollment.completionDate,
        category: enrollment.course.category,
        level: enrollment.course.level,
        duration: enrollment.course.duration || 10,
        enrollmentCount: enrollment.course.totalStudents || 0
      };
    });
    
    // Apply filter if specified
    let filteredCourses = formattedCourses;
    if (filter === 'in-progress') {
      filteredCourses = formattedCourses.filter(course => course.status === 'in-progress');
    } else if (filter === 'completed') {
      filteredCourses = formattedCourses.filter(course => course.status === 'completed');
    } else if (filter === 'not-started') {
      filteredCourses = formattedCourses.filter(course => course.status === 'not-started');
    }
    
    res.json(filteredCourses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Error fetching enrolled courses', error: error.message });
  }
});

// Get wishlist courses
router.get('/wishlist', async (req, res) => {
  try {
    // Find all wishlist enrollments for this student
    const enrollments = await Enrollment.find({ 
      student: req.user.id,
      isWishlisted: true
    }).populate({
      path: 'course',
      select: 'title description thumbnail category level duration totalStudents'
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
        thumbnail: enrollment.course.thumbnail || '/assets/course-placeholder.jpg',
        instructor: 'Course Instructor', // Default value
        progress: 0,
        status: 'wishlist',
        isWishlisted: true,
        category: enrollment.course.category,
        level: enrollment.course.level,
        duration: enrollment.course.duration || 10,
        enrollmentCount: enrollment.course.totalStudents || 0
      };
    });
    
    res.json(wishlistedCourses);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
});

// Get details for a specific course
router.get('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Find the enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    }).populate('course');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Course enrollment not found' });
    }
    
    // Enhanced course details
    const courseDetails = {
      _id: enrollment.course._id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      thumbnail: enrollment.course.thumbnail || '/assets/course-placeholder.jpg',
      instructor: 'Course Instructor', // Default value
      progress: enrollment.progress,
      status: enrollment.status,
      lastAccessed: enrollment.lastAccessDate,
      completedLessons: enrollment.completedLessons ? enrollment.completedLessons.length : 0,
      totalLessons: enrollment.course.lessons ? enrollment.course.lessons.length : 12,
      isWishlisted: enrollment.isWishlisted,
      category: enrollment.course.category,
      level: enrollment.course.level,
      duration: enrollment.course.duration || 10,
      enrollmentDate: enrollment.enrollmentDate,
      syllabus: enrollment.course.syllabus || [],
      lessons: enrollment.course.lessons || []
    };
    
    res.json(courseDetails);
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ message: 'Error fetching course details', error: error.message });
  }
});

// Enroll in a course
router.post('/enroll/:courseId', async (req, res) => {
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
    
    if (existingEnrollment && !existingEnrollment.isWishlisted) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Create or update enrollment
    let enrollment;
    if (existingEnrollment) {
      // Update existing enrollment from wishlist
      existingEnrollment.status = 'not-started';
      existingEnrollment.isWishlisted = false;
      existingEnrollment.enrollmentDate = new Date();
      enrollment = await existingEnrollment.save();
    } else {
      // Create new enrollment
      enrollment = await Enrollment.create({
        student: req.user.id,
        course: courseId,
        enrollmentDate: new Date(),
        status: 'not-started',
        progress: 0,
        isWishlisted: false
      });
    }
    
    // Find or create student record
    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      student = new Student({
        user: req.user.id,
        enrolledCourses: [courseId],
        progress: new Map(),
        achievements: [],
        learningStreak: 0,
        lastActive: new Date(),
        totalLearningHours: 0
      });
    } else if (!student.enrolledCourses.includes(courseId)) {
      student.enrolledCourses.push(courseId);
    }
    
    await student.save();
    
    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });
    
    res.json({ 
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Error enrolling in course', error: error.message });
  }
});

// Toggle wishlist status
router.post('/wishlist/:courseId', async (req, res) => {
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

// Update course progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { progress, lessonId, completed } = req.body;
    
    // Update enrollment progress
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    }).populate('course', 'lessons title');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Handle lesson completion if provided
    if (lessonId && completed !== undefined) {
      // If completing the lesson
      if (completed && !enrollment.completedLessons.includes(lessonId)) {
        enrollment.completedLessons.push(lessonId);
      } 
      // If uncompleting the lesson
      else if (!completed && enrollment.completedLessons.includes(lessonId)) {
        enrollment.completedLessons = enrollment.completedLessons.filter(id => id.toString() !== lessonId.toString());
      }
    }
    
    // Calculate progress using the enhanced method
    let calculatedProgress;
    if (progress !== undefined) {
      // If progress is manually provided
      calculatedProgress = progress;
      await enrollment.updateProgress(calculatedProgress);
    } else {
      // Otherwise calculate based on completed lessons
      calculatedProgress = await enrollment.calculateProgress();
      await enrollment.updateProgress();
    }

    // Check if all lessons are completed
    let isCompleted = false;
    if (enrollment.course && enrollment.course.lessons && 
        enrollment.completedLessons.length >= enrollment.course.lessons.length) {
      isCompleted = true;
      // Mark as completed if all lessons are done
      if (enrollment.status !== 'completed') {
        await enrollment.markAsCompleted();
      }
    }
    
    res.json({ 
      message: 'Progress updated successfully',
      progress: enrollment.progress,
      status: enrollment.status,
      completedLessons: enrollment.completedLessons,
      isCompleted: isCompleted
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

// Mark a lesson as completed
router.put('/:id/lessons/:lessonId/complete', async (req, res) => {
  try {
    const { id: courseId, lessonId } = req.params;
    const { completed = true } = req.body;
    
    // Find the enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    }).populate('course', 'lessons title');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Update completed lessons
    if (completed && !enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    } else if (!completed && enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons = enrollment.completedLessons.filter(id => id.toString() !== lessonId.toString());
    }
    
    // Calculate progress percentage
    let totalLessons = 0;
    if (enrollment.course && enrollment.course.lessons) {
      totalLessons = enrollment.course.lessons.length;
    }
    
    const completedCount = enrollment.completedLessons.length;
    const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    
    // Determine if the course is completed
    const isCompleted = totalLessons > 0 && completedCount >= totalLessons;
    
    // Update progress
    enrollment.progress = progress;
    
    // Update status based on progress
    if (isCompleted) {
      enrollment.status = 'completed';
      enrollment.completionDate = new Date();
    } else if (completedCount > 0) {
      enrollment.status = 'in-progress';
    } else {
      enrollment.status = 'not-started';
    }
    
    // Update lastAccessDate
    enrollment.lastAccessDate = new Date();
    await enrollment.save();
    
    res.json({
      message: completed ? 'Lesson marked as complete' : 'Lesson marked as incomplete',
      progress,
      status: enrollment.status, 
      completedLessons: enrollment.completedLessons,
      isCompleted
    });
  } catch (error) {
    console.error('Error updating lesson completion status:', error);
    res.status(500).json({ message: 'Error updating lesson status', error: error.message });
  }
});

/**
 * @route   GET /api/student/courses
 * @desc    Get all courses for the authenticated student
 * @access  Private (Student)
 */
router.get('/', async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get all enrollments for the current student
    const enrollments = await Enrollment.find({
      student: studentId
    }).populate({
      path: 'course',
      select: 'title code description thumbnail category level instructor createdAt',
      populate: {
        path: 'instructor',
        select: 'name email'
      }
    });

    if (!enrollments || !Array.isArray(enrollments)) {
      console.log('No enrollments found for student:', studentId);
      return res.json([]);
    }

    // Extract course data from enrollments and add enrollment status
    const courses = enrollments.map(enrollment => {
      // Return course with additional status field
      if (!enrollment.course) return null;
      
      const courseObj = enrollment.course.toObject();
      courseObj.status = enrollment.status; // Add enrollment status (active, completed, etc.)
      courseObj.enrollmentDate = enrollment.createdAt;
      courseObj.progress = enrollment.progress || 0;
      return courseObj;
    }).filter(course => course !== null); // Filter out null courses

    res.json(courses);
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/student/courses/completed
 * @desc    Get all completed courses for the authenticated student
 * @access  Private (Student)
 */
router.get('/completed', async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get all enrollments for the current student with status 'completed'
    const enrollments = await Enrollment.find({
      student: studentId,
      status: 'completed' // Only completed courses
    }).populate({
      path: 'course',
      select: 'title code description thumbnail category level'
    });

    if (!enrollments || !Array.isArray(enrollments)) {
      console.log('No completed enrollments found for student:', studentId);
      return res.json([]);
    }

    // Extract course data from enrollments and add completion info
    const completedCourses = enrollments
      .filter(enrollment => enrollment.course) // Filter out any enrollments with missing course data
      .map(enrollment => {
        const courseObj = enrollment.course.toObject();
        courseObj.completedDate = enrollment.updatedAt;
        courseObj.status = 'completed';
        return courseObj;
      });

    res.json(completedCourses);
  } catch (error) {
    console.error('Error fetching completed courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 