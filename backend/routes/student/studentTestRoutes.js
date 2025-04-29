import express from 'express';
import { protect, isStudent } from '../../middleware/auth.js';
import Test from '../../models/Test.js';
import TestAttempt from '../../models/TestAttempt.js';
import Course from '../../models/Course.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);
router.use(isStudent);

// GET all available tests for the student (where they are enrolled in the course)
router.get('/', async (req, res) => {
  try {
    // Get all courses where the student is enrolled
    const enrolledCourses = await Course.find({
      'enrolledStudents.student': req.user._id,
      'enrolledStudents.status': 'active'
    }, '_id');

    const enrolledCourseIds = enrolledCourses.map(course => course._id);

    // Get all tests for courses where the student is enrolled
    const tests = await Test.find({
      courseId: { $in: enrolledCourseIds },
      status: 'published'
    })
      .populate('courseId', 'title')
      .sort({ dueDate: 1 });

    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Error fetching tests', error: error.message });
  }
});

// GET a single test by ID
router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('courseId', 'title');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if student is enrolled in the course for this test
    const course = await Course.findOne({
      _id: test.courseId,
      'enrolledStudents.student': req.user._id,
      'enrolledStudents.status': 'active'
    });

    if (!course) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Error fetching test', error: error.message });
  }
});

// START a test attempt
router.post('/:id/start', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if student is enrolled in the course for this test
    const course = await Course.findOne({
      _id: test.courseId,
      'enrolledStudents.student': req.user._id,
      'enrolledStudents.status': 'active'
    });

    if (!course) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // Check if student already has a completed attempt
    const existingCompletedAttempt = await TestAttempt.findOne({
      test: test._id,
      student: req.user._id,
      completed: true
    });

    if (existingCompletedAttempt && existingCompletedAttempt.passed) {
      return res.status(400).json({ message: 'You have already passed this test' });
    }

    // Check if there's an in-progress attempt
    const existingAttempt = await TestAttempt.findOne({
      test: test._id,
      student: req.user._id,
      status: 'in-progress'
    });

    if (existingAttempt) {
      // Return the existing attempt
      return res.json(existingAttempt);
    }

    // Calculate total possible points
    const totalPossiblePoints = test.questions.reduce((sum, q) => sum + q.points, 0);

    // Create a new test attempt
    const newAttempt = new TestAttempt({
      test: test._id,
      student: req.user._id,
      course: test.courseId,
      startTime: new Date(),
      totalPossiblePoints: totalPossiblePoints || test.totalPoints,
      status: 'in-progress'
    });

    const savedAttempt = await newAttempt.save();

    res.status(201).json(savedAttempt);
  } catch (error) {
    console.error('Error starting test attempt:', error);
    res.status(500).json({ message: 'Error starting test attempt', error: error.message });
  }
});

// SUBMIT test attempt
router.post('/:id/submit', async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    if (!attemptId || !answers) {
      return res.status(400).json({ message: 'Attempt ID and answers are required' });
    }

    // Find the attempt
    const attempt = await TestAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    // Verify the student owns this attempt
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this test attempt' });
    }

    // Find the test
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Process and grade the answers
    const processedAnswers = answers.map(answer => {
      const question = test.questions.id(answer.questionId);
      
      if (!question) {
        return {
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions,
          isCorrect: false,
          pointsEarned: 0
        };
      }

      // Check if the answer is correct
      const selectedOptionIds = answer.selectedOptions || [];
      const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt._id.toString());
      
      // For multiple-choice, all correct options must be selected and no incorrect ones
      const isCorrect = selectedOptionIds.length === correctOptions.length && 
                         selectedOptionIds.every(id => correctOptions.includes(id.toString()));
      
      return {
        questionId: answer.questionId,
        selectedOptions: answer.selectedOptions,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0
      };
    });

    // Update the attempt
    attempt.answers = processedAnswers;
    attempt.endTime = new Date();
    attempt.completed = true;
    attempt.status = 'completed';
    
    // Calculate score
    attempt.calculateScore();

    const savedAttempt = await attempt.save();

    res.json(savedAttempt);
  } catch (error) {
    console.error('Error submitting test attempt:', error);
    res.status(500).json({ message: 'Error submitting test attempt', error: error.message });
  }
});

// GET all attempts for a test by the student
router.get('/:id/attempts', async (req, res) => {
  try {
    const attempts = await TestAttempt.find({
      test: req.params.id,
      student: req.user._id
    }).sort({ startTime: -1 });

    res.json(attempts);
  } catch (error) {
    console.error('Error fetching test attempts:', error);
    res.status(500).json({ message: 'Error fetching test attempts', error: error.message });
  }
});

// GET a single attempt by ID
router.get('/attempts/:attemptId', async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }

    // Verify the student owns this attempt
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this test attempt' });
    }

    res.json(attempt);
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    res.status(500).json({ message: 'Error fetching test attempt', error: error.message });
  }
});

export default router; 