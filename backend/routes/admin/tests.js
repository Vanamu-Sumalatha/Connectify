import express from 'express';
import { protect, isAdmin } from '../../middleware/auth.js';
import CertificationTest from '../../models/admin/CertificationTest.js';
import Course from '../../models/Course.js';

const router = express.Router();

// Create a new test
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    console.log('Received test data:', req.body);
    const {
      title,
      description,
      courseId,
      duration,
      passingScore,
      maxAttempts = 3,
      questions,
      settings = {}
    } = req.body;

    if (!title || !description || !courseId) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'description', 'courseId']
      });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Validate and format questions
    const formattedQuestions = questions.map(q => ({
      type: q.type || 'multiple-choice',
      question: q.question,
      options: q.options.map(opt => ({
        text: opt.text,
        isCorrect: Boolean(opt.isCorrect)
      })),
      correctAnswer: q.correctAnswer,
      points: Number(q.points) || 1,
      explanation: q.explanation || ''
    }));

    const test = new CertificationTest({
      title: title.trim(),
      description: description.trim(),
      courseId,
      duration: Number(duration) || 30,
      passingScore: Number(passingScore) || 70,
      maxAttempts,
      questions: formattedQuestions,
      settings: {
        isRandomized: Boolean(settings.isRandomized ?? true),
        showResults: Boolean(settings.showResults ?? true),
        allowReview: Boolean(settings.allowReview ?? true),
        timeLimit: Boolean(settings.timeLimit ?? true),
        requireProctoring: Boolean(settings.requireProctoring ?? false)
      },
      status: 'published'
    });

    console.log('Creating test with data:', test);
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all tests - accessible by both admin and students
router.get('/public', protect, async (req, res) => {
  try {
    console.log('Public tests endpoint accessed by user role:', req.user.role);
    
    const tests = await CertificationTest.find({
      status: 'published'
    }).populate('courseId', 'title code');
    
    console.log(`Found ${tests.length} published tests`);
    
    // If user is a student, sanitize the data to remove sensitive information
    if (req.user.role === 'student') {
      const sanitizedTests = tests.map(test => {
        const testData = test.toObject();
        
        // Remove correct answers from questions for students
        if (Array.isArray(testData.questions)) {
          testData.questions = testData.questions.map(q => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            type: q.type || 'multiple-choice',
            points: q.points || 1
            // Deliberately omitting correctAnswer
          }));
        }
        
        // Don't include all attempts data for students
        delete testData.attempts;
        
        return testData;
      });
      
      console.log('Returning sanitized tests for student');
      res.json(sanitizedTests);
    } else {
      // For admin, return full data
      console.log('Returning full tests for admin');
      res.json(tests);
    }
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all tests (admin only)
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const tests = await CertificationTest.find()
      .populate('courseId', 'title code')
      .sort('-createdAt');
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get test by ID
router.get('/:id', protect, isAdmin, async (req, res) => {
  try {
    const test = await CertificationTest.findById(req.params.id)
      .populate('courseId', 'title code');
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update test
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      duration,
      passingScore,
      maxAttempts,
      questions,
      settings,
      status
    } = req.body;

    const test = await CertificationTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Update fields
    if (title) test.title = title;
    if (description) test.description = description;
    if (courseId) test.courseId = courseId;
    if (duration) test.duration = duration;
    if (passingScore) test.passingScore = passingScore;
    if (maxAttempts) test.maxAttempts = maxAttempts;
    if (questions) test.questions = questions;
    if (settings) test.settings = { ...test.settings, ...settings };
    if (status) test.status = status;

    test.lastUpdated = new Date();
    await test.save();
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete test
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const test = await CertificationTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Instead of deleting, archive the test
    test.status = 'archived';
    await test.save();
    
    res.json({ message: 'Test archived successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get test statistics
router.get('/:id/stats', protect, isAdmin, async (req, res) => {
  try {
    const test = await CertificationTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const stats = {
      totalAttempts: test.attempts.length,
      averageScore: test.attempts.reduce((acc, curr) => acc + curr.score, 0) / test.attempts.length || 0,
      passRate: (test.attempts.filter(a => a.score >= test.passingScore).length / test.attempts.length) * 100 || 0,
      certificatesIssued: test.certificates.length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all tests - special endpoint for student access
router.get('/for-student', protect, async (req, res) => {
  try {
    console.log('Student accessing tests via admin API:', req.user._id, 'with role:', req.user.role);
    
    // Get courseIds from query parameter if provided
    const courseIds = req.query.courseIds ? req.query.courseIds.split(',') : [];
    
    // Build the query - only return published tests
    let query = { status: 'published' };
    
    // If course IDs are provided, filter by those courses
    if (courseIds.length > 0) {
      console.log('Filtering by course IDs:', courseIds);
      query.courseId = { $in: courseIds };
    }
    
    console.log('Query:', JSON.stringify(query));
    
    // Log all tests in the database for debugging
    const allTests = await CertificationTest.find().lean();
    console.log('All tests in database:', allTests.map(t => ({
      id: t._id,
      title: t.title,
      courseId: t.courseId,
      status: t.status
    })));
    
    // Get tests matching the query
    const tests = await CertificationTest.find(query)
      .populate('courseId', 'title code')
      .lean();
    
    console.log(`Found ${tests.length} tests for student access`);
    
    // Sanitize the tests for student use
    const safeTests = tests.map(test => {
      // Create a clean copy
      const safeTest = { ...test };
      
      // Remove attempts from other students
      if (Array.isArray(safeTest.attempts)) {
        safeTest.studentAttempts = safeTest.attempts
          .filter(attempt => 
            attempt && attempt.studentId && 
            attempt.studentId.toString() === req.user._id.toString()
          )
          .map(attempt => ({
            _id: attempt._id,
            startTime: attempt.startTime,
            endTime: attempt.endTime,
            status: attempt.status,
            score: attempt.score,
            passed: attempt.score >= safeTest.passingScore
          }));
          
        // Remove all attempts to prevent leaking other student data
        delete safeTest.attempts;
      }
      
      // Remove correct answers from questions
      if (Array.isArray(safeTest.questions)) {
        safeTest.questions = safeTest.questions.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options,
          type: q.type || 'multiple-choice',
          points: q.points || 1
          // Deliberately omit correctAnswer and other sensitive fields
        }));
      }
      
      return safeTest;
    });
    
    res.json(safeTests);
  } catch (error) {
    console.error('Error in admin tests for-student endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
