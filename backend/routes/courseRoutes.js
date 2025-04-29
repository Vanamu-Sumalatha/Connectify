import express from 'express';
import Course from '../models/Course.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import Enrollment from '../models/Enrollment.js';
import mongoose from 'mongoose';
import StudentProfile from '../models/StudentProfile.js';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// Get all published courses
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, level, rating } = req.query;
    
    // Build the query filter
    const filter = { status: 'published' };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (level && level !== 'all') {
      filter.level = level;
    }
    
    if (rating && rating !== 'all') {
      filter.rating = { $gte: parseFloat(rating) };
    }
    
    // Text search if provided
    let courses;
    if (search) {
      courses = await Course.find({
        ...filter,
        $text: { $search: search }
      }).sort({ score: { $meta: 'textScore' } });
    } else {
      courses = await Course.find(filter).sort('-createdAt');
    }
    
    // Get all enrollments for the current user to mark enrolled/wishlisted courses
    const userId = req.user.id;
    const enrollments = await Enrollment.find({ student: userId });
    
    // Format the response
    const formattedCourses = courses.map(course => {
      const enrollment = enrollments.find(e => e.course.toString() === course._id.toString());
      return {
        ...course.toObject(),
        isEnrolled: !!enrollment && enrollment.status !== 'wishlist',
        isWishlisted: enrollment?.isWishlisted || false
      };
    });
    
    res.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Get all published courses for browse catalog
router.get('/published', async (req, res) => {
  try {
    const { search, category, level, rating } = req.query;
    
    // Build the query filter
    const filter = { status: 'published' };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (level && level !== 'all') {
      filter.level = level;
    }
    
    if (rating && rating !== 'all') {
      filter.rating = { $gte: parseFloat(rating) };
    }
    
    // Text search if provided
    let courses;
    if (search) {
      courses = await Course.find({
        ...filter,
        $text: { $search: search }
      }).sort({ score: { $meta: 'textScore' } });
    } else {
      courses = await Course.find(filter).sort('-createdAt');
    }
    
    // Format the response for non-authenticated users (no enrollment status)
    const formattedCourses = courses.map(course => {
      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        duration: course.duration,
        rating: course.rating,
        totalStudents: course.totalStudents || 0,
        isEnrolled: false,
        isWishlisted: false
      };
    });
    
    res.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching published courses:', error);
    res.status(500).json({ message: 'Error fetching published courses', error: error.message });
  }
});

// Get a single course
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: course._id
    });
    
    const courseData = {
      ...course.toObject(),
      isEnrolled: !!enrollment && enrollment.status !== 'wishlist',
      isWishlisted: enrollment?.isWishlisted || false,
      enrollment: enrollment ? {
        status: enrollment.status,
        progress: enrollment.progress,
        lastAccessed: enrollment.lastAccessDate
      } : null
    };
    
    res.json(courseData);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
});

// Create course (admin/instructor only)
router.post('/', protect, authorize(['admin', 'instructor']), async (req, res) => {
  try {
    const { 
      title, 
      code, 
      description, 
      category, 
      level, 
      duration, 
      thumbnail, 
      lessons,
      materials,
      requirements,
      objectives,
      learningOutcomes,
      totalStudents,
      rating,
    } = req.body;

    // Create a default course code if not provided
    if (!code) {
      const timestamp = Date.now().toString().slice(-6);
      req.body.code = `CRS-${timestamp}`;
    }

    // Ensure requirements and objectives are arrays
    if (requirements && !Array.isArray(requirements)) {
      try {
        req.body.requirements = JSON.parse(requirements);
      } catch (e) {
        req.body.requirements = [req.body.requirements];
      }
    }

    if (objectives && !Array.isArray(objectives)) {
      try {
        req.body.objectives = JSON.parse(objectives);
      } catch (e) {
        req.body.objectives = [req.body.objectives];
      }
    }

    if (learningOutcomes && !Array.isArray(learningOutcomes)) {
      try {
        req.body.learningOutcomes = JSON.parse(learningOutcomes);
      } catch (e) {
        req.body.learningOutcomes = [req.body.learningOutcomes];
      }
    }

    // Process lessons data
    if (lessons && Array.isArray(lessons)) {
      try {
        // Add lesson numbers to the lessons
        req.body.lessons = lessons.map((lesson, index) => ({
          title: lesson.title,
          description: lesson.description || '',
          videoUrl: lesson.videoUrl || '',
          duration: Number(lesson.duration) || 0,
          lessonNumber: index + 1, // Set lessonNumber based on order in array
          materials: (lesson.materials && Array.isArray(lesson.materials)) 
            ? lesson.materials.map(material => ({ 
                title: material.title || material || 'Material',
                type: material.type || 'document',
                url: material.url || ''
              }))
            : []
        }));
      } catch (e) {
        console.error('Error processing lessons:', e);
      }
    }

    // Process materials data - ensure proper structure with the new fields
    if (materials && Array.isArray(materials)) {
      // Transform materials to ensure they have the right structure
      req.body.materials = materials.map(material => {
        // Store the URL in the correct field based on type
        const processedMaterial = {
          title: material.title,
          type: material.type || 'document',
          description: material.description || '',
          documentUrl: '',
          videoUrl: '',
          roadmapContent: ''
        };

        // Set the appropriate URL field based on type
        if (material.type === 'document') {
          processedMaterial.documentUrl = material.documentUrl || material.url || '';
        } else if (material.type === 'video') {
          processedMaterial.videoUrl = material.videoUrl || material.url || '';
        } else if (material.type === 'roadmap') {
          processedMaterial.roadmapContent = material.roadmapContent || material.url || '';
        }

        return processedMaterial;
      });
    }

    // Convert string values to numbers
    if (totalStudents) {
      req.body.totalStudents = Number(totalStudents);
    }
    
    if (rating) {
      req.body.rating = Number(rating);
    }
    
    if (duration) {
      req.body.duration = Number(duration);
    }

    // Create the course
    const course = new Course({
      title,
      code,
      description,
      category,
      level,
      duration,
      thumbnail,
      lessons: req.body.lessons || [],
      materials: req.body.materials || [],
      requirements: requirements || [],
      objectives: objectives || [],
      learningOutcomes: learningOutcomes || [],
      totalStudents: req.body.totalStudents,
      rating: req.body.rating,
      status: 'published', // Set status to published by default for new courses
    });

    // Save the course
    await course.save();

    // Create chat rooms for this course
    try {
      const ChatRoom = (await import('../models/ChatRoom.js')).default;
      
      // Create course discussion room
      const courseDiscussionRoom = new ChatRoom({
        name: `${course.title} Discussion`,
        type: 'course',
        description: `Official discussion forum for the ${course.title} course`,
        courseId: course._id,
        members: [req.user._id],
        memberCount: 1,
        moderators: [req.user._id]
      });
      
      await courseDiscussionRoom.save();
      
      // Create general discussion room for this course
      const generalDiscussionRoom = new ChatRoom({
        name: `${course.title} General Chat`,
        type: 'discussions',
        description: `General chat for students taking the ${course.title} course`,
        courseId: course._id,
        members: [req.user._id],
        memberCount: 1,
        moderators: [req.user._id]
      });
      
      await generalDiscussionRoom.save();
      
      console.log(`Created chat rooms for course: ${course.title}`);
    } catch (chatError) {
      console.error('Error creating chat rooms for course:', chatError);
      // We don't want to fail course creation if chat room creation fails
    }

    res.status(201).json(course);
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update course (admin/instructor only)
router.put('/:id', protect, authorize(['admin', 'instructor']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { 
      title, 
      code, 
      description, 
      category, 
      level, 
      duration, 
      thumbnail, 
      lessons,
      materials,
      requirements,
      objectives,
      learningOutcomes,
      totalStudents,
      rating,
    } = req.body;

    // Find the course to update
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Update course fields
    course.title = title || course.title;
    course.code = code || course.code;
    course.description = description || course.description;
    course.category = category || course.category;
    course.level = level || course.level;
    course.duration = duration || course.duration;
    course.thumbnail = thumbnail || course.thumbnail;
    
    if (lessons && lessons.length > 0) {
      // Add lesson numbers to the lessons
      const processedLessons = lessons.map((lesson, index) => ({
        title: lesson.title,
        description: lesson.description || '',
        videoUrl: lesson.videoUrl || '',
        duration: Number(lesson.duration) || 0,
        lessonNumber: index + 1, // Set lessonNumber based on order in array
        materials: (lesson.materials && Array.isArray(lesson.materials)) 
          ? lesson.materials.map(material => ({ 
              title: material.title || material || 'Material',
              type: material.type || 'document',
              url: material.url || ''
            }))
          : []
      }));
      
      course.lessons = processedLessons;
    }
    
    // Process materials data if provided
    if (materials && Array.isArray(materials)) {
      // Transform materials to ensure they have the right structure
      const processedMaterials = materials.map(material => {
        // Store the URL in the correct field based on type
        const processedMaterial = {
          title: material.title,
          type: material.type || 'document',
          description: material.description || '',
          documentUrl: '',
          videoUrl: '',
          roadmapContent: ''
        };

        // Set the appropriate URL field based on type
        if (material.type === 'document') {
          processedMaterial.documentUrl = material.documentUrl || material.url || '';
        } else if (material.type === 'video') {
          processedMaterial.videoUrl = material.videoUrl || material.url || '';
        } else if (material.type === 'roadmap') {
          processedMaterial.roadmapContent = material.roadmapContent || material.url || '';
        }

        return processedMaterial;
      });
      
      course.materials = processedMaterials;
    }
    
    if (requirements && requirements.length > 0) {
      course.requirements = requirements;
    }
    
    if (objectives && objectives.length > 0) {
      course.objectives = objectives;
    }
    
    if (learningOutcomes && learningOutcomes.length > 0) {
      course.learningOutcomes = learningOutcomes;
    }
    
    if (totalStudents) {
      course.totalStudents = Number(totalStudents);
    }
    
    if (rating) {
      course.rating = Number(rating);
    }

    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course (admin/instructor only)
router.delete('/:id', protect, authorize(['admin', 'instructor']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Only admins can delete courses
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // Delete associated chat rooms
    try {
      const ChatRoom = (await import('../models/ChatRoom.js')).default;
      await ChatRoom.deleteMany({ courseId: course._id });
      console.log(`Deleted chat rooms for course: ${course.title}`);
    } catch (chatError) {
      console.error('Error deleting chat rooms for course:', chatError);
      // Continue with course deletion even if chat room deletion fails
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enroll in course (student only)
router.post('/:id/enroll', protect, authorize(['student']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Add student to course's enrolledStudents array
    course.enrolledStudents.push(req.user._id);
    course.totalStudents = course.totalStudents + 1;
    await course.save();

    // Create a new enrollment record
    const enrollment = new Enrollment({
      student: req.user._id,
      course: course._id,
      enrollmentDate: new Date(),
      status: 'not-started',
      progress: 0,
      lastAccessDate: new Date()
    });

    await enrollment.save();

    // Add student to course chat rooms
    try {
      const ChatRoom = (await import('../models/ChatRoom.js')).default;
      const chatRooms = await ChatRoom.find({ courseId: course._id });
      
      for (const room of chatRooms) {
        if (!room.members.includes(req.user._id)) {
          room.members.push(req.user._id);
          room.memberCount = room.members.length;
          await room.save();
        }
      }
      
      console.log(`Added student to chat rooms for course: ${course.title}`);
    } catch (chatError) {
      console.error('Error adding student to chat rooms:', chatError);
      // Continue even if adding to chat rooms fails
    }

    res.json({ 
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Unenroll from course (student only)
router.post('/:id/unenroll', protect, authorize(['student']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if enrolled
    if (!course.enrolledStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'Not enrolled in this course' });
    }

    course.enrolledStudents = course.enrolledStudents.filter(
      id => id.toString() !== req.user._id.toString()
    );
    course.totalStudents = Math.max(0, course.totalStudents - 1);
    await course.save();

    // Remove student from course chat rooms
    try {
      const ChatRoom = (await import('../models/ChatRoom.js')).default;
      const chatRooms = await ChatRoom.find({ courseId: course._id });
      
      for (const room of chatRooms) {
        if (room.members.includes(req.user._id)) {
          room.members = room.members.filter(
            id => id.toString() !== req.user._id.toString()
          );
          room.memberCount = room.members.length;
          await room.save();
        }
      }
      
      console.log(`Removed student from chat rooms for course: ${course.title}`);
    } catch (chatError) {
      console.error('Error removing student from chat rooms:', chatError);
      // Continue even if removing from chat rooms fails
    }

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add review to course (student only)
router.post('/:id/review', protect, authorize(['student']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if enrolled
    if (!course.enrolledStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'Must be enrolled to review' });
    }

    const { rating, comment } = req.body;

    course.reviews.push({
      student: req.user._id,
      rating,
      comment,
    });

    course.calculateRating();
    await course.save();

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment (student only)
router.post('/:id/assignments/:assignmentId/submit', protect, authorize(['student']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if enrolled
    if (!course.enrolledStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'Must be enrolled to submit assignments' });
    }

    const assignment = course.assignments.id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.submissions.push({
      student: req.user._id,
      submissionDate: Date.now(),
      ...req.body,
    });

    await course.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Grade assignment (instructor only)
router.put('/:id/assignments/:assignmentId/submissions/:submissionId/grade', protect, authorize(['instructor']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if instructor
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to grade this assignment' });
    }

    const assignment = course.assignments.id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = req.body.grade;
    submission.feedback = req.body.feedback;

    await course.save();
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Take quiz (student only)
router.post('/:id/quizzes/:quizId/take', protect, authorize(['student']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if enrolled
    if (!course.enrolledStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'Must be enrolled to take quizzes' });
    }

    const quiz = course.quizzes.id(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const { answers } = req.body;
    let score = 0;

    // Calculate score
    quiz.questions.forEach((question, index) => {
      if (question.correctAnswer === answers[index]) {
        score += question.points;
      }
    });

    quiz.attempts.push({
      student: req.user._id,
      score,
      date: Date.now(),
    });

    await course.save();
    res.json({ score, passingScore: quiz.passingScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's enrolled courses with detailed information
router.get("/courses/enrolled", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the student profile
    const studentProfile = await StudentProfile.findOne({ user: userId })
      .populate({
        path: 'enrolledCourses',
        populate: {
          path: 'course',
          model: 'Course',
        },
      });
    
    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    
    // Extract and format enrolled courses
    const enrolledCourses = studentProfile.enrolledCourses.map(enrollment => {
      return {
        _id: enrollment.course._id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        code: enrollment.course.code,
        instructor: enrollment.course.instructor,
        status: enrollment.status,
        progress: enrollment.progress,
        enrollmentDate: enrollment.enrollmentDate,
      };
    });
    
    res.status(200).json(enrolledCourses);
  } catch (error) {
    console.error("Error in /courses/enrolled:", error);
    res.status(500).json({ 
      message: "Error fetching enrolled courses",
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Get all quizzes specifically associated with Vue.js
router.get("/quizzes/vue", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the student profile to verify enrollment
    const studentProfile = await StudentProfile.findOne({ user: userId });
    
    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    
    // Find Vue course by title or code
    const vueCourse = await Course.findOne({
      $or: [
        { title: { $regex: 'vue', $options: 'i' } },
        { code: { $regex: 'vue', $options: 'i' } }
      ]
    });
    
    let vueQuizzes = [];
    
    if (vueCourse) {
      // First fetch quizzes directly associated with the course
      vueQuizzes = await Quiz.find({ courseId: vueCourse._id })
        .populate('courseId')
        .lean();
      
      console.log(`Found ${vueQuizzes.length} directly associated Vue quizzes`);
    }
    
    // Also find quizzes by title/description containing "Vue" regardless of course association
    const additionalVueQuizzes = await Quiz.find({
      $or: [
        { title: { $regex: 'vue', $options: 'i' } },
        { description: { $regex: 'vue', $options: 'i' } }
      ]
    })
    .populate('courseId')
    .lean();
    
    console.log(`Found ${additionalVueQuizzes.length} Vue quizzes by title/description`);
    
    // Combine and deduplicate
    const allVueQuizzes = [...vueQuizzes];
    
    // Add additional quizzes only if they don't already exist
    additionalVueQuizzes.forEach(quiz => {
      if (!allVueQuizzes.some(q => q._id.toString() === quiz._id.toString())) {
        allVueQuizzes.push(quiz);
      }
    });
    
    console.log(`Returning total of ${allVueQuizzes.length} Vue quizzes`);
    res.status(200).json(allVueQuizzes);
  } catch (error) {
    console.error("Error in /quizzes/vue:", error);
    res.status(500).json({ 
      message: "Error fetching Vue quizzes",
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Get all quizzes specifically associated with Angular
router.get("/quizzes/angular", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the student profile to verify enrollment
    const studentProfile = await StudentProfile.findOne({ user: userId });
    
    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    
    // Find Angular course by title or code
    const angularCourse = await Course.findOne({
      $or: [
        { title: { $regex: 'angular', $options: 'i' } },
        { code: { $regex: 'angular', $options: 'i' } }
      ]
    });
    
    let angularQuizzes = [];
    
    if (angularCourse) {
      // First fetch quizzes directly associated with the course
      angularQuizzes = await Quiz.find({ courseId: angularCourse._id })
        .populate('courseId')
        .lean();
      
      console.log(`Found ${angularQuizzes.length} directly associated Angular quizzes`);
    }
    
    // Also find quizzes by title/description containing "Angular" regardless of course association
    const additionalAngularQuizzes = await Quiz.find({
      $or: [
        { title: { $regex: 'angular', $options: 'i' } },
        { description: { $regex: 'angular', $options: 'i' } }
      ]
    })
    .populate('courseId')
    .lean();
    
    console.log(`Found ${additionalAngularQuizzes.length} Angular quizzes by title/description`);
    
    // Combine and deduplicate
    const allAngularQuizzes = [...angularQuizzes];
    
    // Add additional quizzes only if they don't already exist
    additionalAngularQuizzes.forEach(quiz => {
      if (!allAngularQuizzes.some(q => q._id.toString() === quiz._id.toString())) {
        allAngularQuizzes.push(quiz);
      }
    });
    
    console.log(`Returning total of ${allAngularQuizzes.length} Angular quizzes`);
    res.status(200).json(allAngularQuizzes);
  } catch (error) {
    console.error("Error in /quizzes/angular:", error);
    res.status(500).json({ 
      message: "Error fetching Angular quizzes",
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Improved error handling for the main courses endpoint
router.get('/courses', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the student profile
    const studentProfile = await StudentProfile.findOne({ user: userId });
    
    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    
    // Find enrolled courses details
    const enrolledCourseIds = studentProfile.enrolledCourses.map(enrollment => 
      enrollment.course.toString()
    );
    
    const courses = await Course.find({ _id: { $in: enrolledCourseIds } })
      .sort({ updatedAt: -1 });
    
    // If no courses found, return empty array instead of error
    if (!courses || courses.length === 0) {
      console.log("No courses found for student:", userId);
      return res.status(200).json([]);
    }
    
    // Add enrollment status to each course
    const coursesWithEnrollmentStatus = courses.map(course => {
      const enrollment = studentProfile.enrolledCourses.find(
        enrollment => enrollment.course.toString() === course._id.toString()
      );
      
      return {
        ...course.toObject(),
        enrollmentStatus: enrollment ? enrollment.status : 'unknown',
        progress: enrollment ? enrollment.progress : 0,
      };
    });
    
    res.status(200).json(coursesWithEnrollmentStatus);
  } catch (error) {
    console.error("Error in /courses:", error);
    res.status(500).json({ 
      message: "Error fetching courses",
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

export default router; 