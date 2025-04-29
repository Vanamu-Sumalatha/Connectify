import express from 'express';
import auth from '../middleware/auth.js';
import Quiz from '../models/Quiz.js';
import Course from '../models/Course.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Enrollment from '../models/Enrollment.js';
import Todo from '../models/Todo.js';

const router = express.Router();

// Admin routes
// Get all quizzes
router.get('/admin/quizzes', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const quizzes = await Quiz.find()
      .populate('courseId', 'title code', null, { strictPopulate: false })
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
});

// Get a specific quiz by ID
router.get('/admin/quizzes/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title code', null, { strictPopulate: false })
      .populate('createdBy', 'username email');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
});

// Create a new quiz
router.post('/admin/quizzes', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, description, courseId, type, passingScore, duration, questions } = req.body;

    if (!title || !description || !courseId || !type || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify that the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Format questions to match the model structure
    const formattedQuestions = questions.map(q => {
      // If the question type is already in the correct format, use it as is
      if (q.type && typeof q.type === 'object' && q.type.type) {
        return q;
      }
      
      // Otherwise, format it correctly
      return {
        ...q,
        type: {
          type: q.type || 'multiple-choice'
        }
      };
    });

    const newQuiz = new Quiz({
      title,
      description,
      courseId,
      type,
      passingScore: passingScore || 70,
      duration: duration || 30,
      questions: formattedQuestions,
      createdBy: req.user._id,
      status: 'published'
    });

    const savedQuiz = await newQuiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Error creating quiz', error: error.message });
  }
});

// Update a quiz
router.put('/admin/quizzes/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Update fields
    Object.keys(updates).forEach(field => {
      quiz[field] = updates[field];
    });

    const updatedQuiz = await quiz.save();
    res.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ message: 'Error updating quiz', error: error.message });
  }
});

// Delete a quiz
router.delete('/admin/quizzes/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await quiz.remove();
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Error deleting quiz', error: error.message });
  }
});

// Student routes
// Get available quizzes for student (from completed courses)
router.get('/student/quizzes', auth, async (req, res) => {
  try {
    // Get student's completed course enrollments
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: 'completed'
    });

    const completedCourseIds = enrollments.map(enrollment => enrollment.course);

    // Get quizzes for completed courses
    const quizzes = await Quiz.find({
      courseId: { $in: completedCourseIds },
      status: 'published'
    }).populate('courseId', 'title thumbnail', null, { strictPopulate: false });

    // Check if student has attempted each quiz
    const quizzesWithAttempts = await Promise.all(
      quizzes.map(async quiz => {
        const attempts = await QuizAttempt.find({
          quiz: quiz._id,
          student: req.user._id
        }).sort({ startTime: -1 });

        const bestAttempt = attempts.reduce((best, current) => {
          if (!best || current.percentageScore > best.percentageScore) {
            return current;
          }
          return best;
        }, null);

        return {
          ...quiz.toObject(),
          attempts: attempts.length,
          bestScore: bestAttempt ? bestAttempt.percentageScore : null,
          passed: bestAttempt ? bestAttempt.passed : false,
          lastAttemptDate: attempts.length > 0 ? attempts[0].startTime : null
        };
      })
    );

    res.json(quizzesWithAttempts);
  } catch (error) {
    console.error('Error fetching available quizzes:', error);
    res.status(500).json({ message: 'Error fetching available quizzes', error: error.message });
  }
});

// Get quiz details for student
router.get('/student/quizzes/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title thumbnail', null, { strictPopulate: false });

    if (!quiz || quiz.status !== 'published') {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.courseId
    });

    if (!enrollment || enrollment.status !== 'completed') {
      return res.status(403).json({ message: 'You must complete this course before taking the quiz' });
    }

    // Get previous attempts
    const attempts = await QuizAttempt.find({
      quiz: quiz._id,
      student: req.user._id
    }).sort({ startTime: -1 });

    // Remove answers from questions for security
    const sanitizedQuiz = {
      ...quiz.toObject(),
      questions: quiz.questions.map(q => ({
        ...q,
        options: q.options.map(o => ({
          ...o,
          isCorrect: undefined // Hide correct answers
        }))
      })),
      attempts: attempts.map(a => ({
        _id: a._id,
        startTime: a.startTime,
        endTime: a.endTime,
        score: a.score,
        percentageScore: a.percentageScore,
        passed: a.passed,
        status: a.status
      }))
    };

    res.json(sanitizedQuiz);
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    res.status(500).json({ message: 'Error fetching quiz details', error: error.message });
  }
});

// Start a quiz attempt
router.post('/student/quizzes/:id/attempt', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    console.log(`Starting quiz attempt for user ${req.user._id} on quiz ${req.params.id}`);

    // Create a simplified attempt object that matches the expected schema
    const attempt = new QuizAttempt({
      quiz: quiz._id,
      user: req.user._id,
      student: req.user._id, // Include both user and student fields for flexibility
      courseId: quiz.courseId,
      // Initialize with empty required fields to avoid validation errors
      answers: {},
      timeSpent: 0,
      score: 0,
      startTime: new Date(),
      status: 'in-progress'
    });

    await attempt.save();

    // Return response in the format the frontend expects
    res.json({
      message: 'Quiz attempt started',
      _id: attempt._id,
      attemptId: attempt._id,
      quiz: quiz._id,
      user: req.user._id,
      startTime: attempt.startTime,
      totalQuestions: quiz.questions?.length || 0,
      duration: quiz.duration || 30, // Default to 30 minutes if not specified
      status: 'in-progress'
    });
  } catch (error) {
    console.error('Error starting quiz attempt:', error);
    // Check if the error is a duplicate key error (user already has an attempt)
    if (error.code === 11000) {
      try {
        // Find the existing attempt
        const existingAttempt = await QuizAttempt.findOne({
          quiz: req.params.id,
          user: req.user._id
        });
        
        if (existingAttempt) {
          return res.json({
            message: 'Continuing existing quiz attempt',
            _id: existingAttempt._id,
            attemptId: existingAttempt._id,
            quiz: req.params.id,
            user: req.user._id,
            startTime: existingAttempt.startTime,
            duration: quiz?.duration || 30
          });
        }
      } catch (findError) {
        console.error('Error finding existing attempt:', findError);
      }
    }
    
    res.status(500).json({ 
      message: 'Error starting quiz attempt', 
      error: error.message 
    });
  }
});

// Submit quiz answers
router.post('/student/quizzes/:id/attempts/:attemptId/submit', auth, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    
    console.log(`Submitting quiz ${req.params.id} attempt ${req.params.attemptId} for user ${req.user._id}`);
    console.log('Submission data:', { answers, timeSpent });
    
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt || (attempt.user.toString() !== req.user._id.toString() && 
                    (!attempt.student || attempt.student.toString() !== req.user._id.toString()))) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    if (attempt.status === 'completed') {
      return res.status(400).json({ message: 'This attempt has already been submitted' });
    }

    // Calculate a basic score based on answers provided
    const answeredQuestions = answers ? answers.length : 0;
    const totalQuestions = quiz.questions ? quiz.questions.length : 0;
    const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    const passed = percentage >= (quiz.passingScore || 70);

    // Update the attempt with submission data
    attempt.answers = answers || {};
    attempt.timeSpent = timeSpent || 0;
    attempt.endTime = new Date();
    attempt.status = 'completed';
    attempt.score = percentage;  
    attempt.percentageScore = percentage;
    attempt.passed = passed;
    attempt.completedAt = new Date();

    await attempt.save();

    // Create a to-do for retaking the quiz if failed
    if (!attempt.passed) {
      await Todo.create({
        title: `Retake quiz: ${quiz.title}`,
        description: `You didn't pass the quiz. Score: ${Math.round(attempt.percentageScore)}%. Required: ${quiz.passingScore}%`,
        student: req.user._id,
        priority: 'high',
        relatedCourse: quiz.courseId,
        relatedQuiz: quiz._id
      });
    }

    // Return response in the format frontend expects
    res.json({
      message: 'Quiz submitted successfully',
      attemptId: attempt._id,
      quiz: quiz._id,
      score: percentage,
      percentageScore: percentage,
      passed,
      totalQuestions,
      correctAnswers: Math.round(percentage * totalQuestions / 100), // Estimate correct answers
      completedAt: attempt.completedAt
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
});

// Alternative endpoint for starting a quiz attempt with /attempts (plural)
router.post('/student/quizzes/:id/attempts', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    console.log(`Starting quiz attempt for user ${req.user._id} on quiz ${req.params.id} (using plural endpoint)`);

    // Use user ID from request body if provided, otherwise use authenticated user
    const userId = req.body.user || req.body.student || req.user._id;

    // Create a simplified attempt object
    const attempt = new QuizAttempt({
      quiz: quiz._id,
      user: userId,
      student: userId, // Include both for compatibility
      courseId: quiz.courseId,
      answers: req.body.answers || {},
      timeSpent: req.body.timeSpent || 0,
      score: req.body.score || 0,
      startTime: req.body.startTime || new Date(),
      status: req.body.status || 'in-progress'
    });

    await attempt.save();

    // Return response in the format the frontend expects
    res.json({
      message: 'Quiz attempt started',
      _id: attempt._id,
      attemptId: attempt._id,
      quiz: quiz._id,
      user: userId,
      startTime: attempt.startTime,
      totalQuestions: quiz.questions?.length || 0,
      duration: quiz.duration || 30,
      status: 'in-progress'
    });
  } catch (error) {
    console.error('Error starting quiz attempt (plural endpoint):', error);
    if (error.code === 11000) {
      try {
        const existingAttempt = await QuizAttempt.findOne({
          quiz: req.params.id,
          user: req.body.user || req.user._id
        });
        
        if (existingAttempt) {
          return res.json({
            message: 'Continuing existing quiz attempt',
            _id: existingAttempt._id,
            attemptId: existingAttempt._id,
            quiz: req.params.id,
            user: existingAttempt.user,
            startTime: existingAttempt.startTime,
            duration: quiz?.duration || 30
          });
        }
      } catch (findError) {
        console.error('Error finding existing attempt:', findError);
      }
    }
    
    res.status(500).json({ 
      message: 'Error starting quiz attempt', 
      error: error.message 
    });
  }
});

// Generic submission endpoint
router.post('/student/quizzes/submit', auth, async (req, res) => {
  try {
    const { quizId, attemptId, answers, timeSpent } = req.body;
    
    if (!quizId || !attemptId) {
      return res.status(400).json({ message: 'Quiz ID and attempt ID are required' });
    }
    
    console.log(`Submitting quiz ${quizId} attempt ${attemptId} for user ${req.user._id} (generic endpoint)`);
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    if (attempt.status === 'completed') {
      return res.status(400).json({ message: 'This attempt has already been submitted' });
    }

    // Calculate a basic score
    const answeredQuestions = answers ? (Array.isArray(answers) ? answers.length : Object.keys(answers).length) : 0;
    const totalQuestions = quiz.questions ? quiz.questions.length : 0;
    const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    const passed = percentage >= (quiz.passingScore || 70);

    // Update the attempt with submission data
    attempt.answers = answers || {};
    attempt.timeSpent = timeSpent || 0;
    attempt.endTime = new Date();
    attempt.status = 'completed';
    attempt.score = percentage;
    attempt.percentageScore = percentage;
    attempt.passed = passed;
    attempt.completedAt = new Date();

    await attempt.save();

    res.json({
      message: 'Quiz submitted successfully',
      attemptId: attempt._id,
      quiz: quizId,
      score: percentage,
      percentageScore: percentage,
      passed,
      totalQuestions,
      correctAnswers: Math.round(percentage * totalQuestions / 100),
      completedAt: attempt.completedAt
    });
  } catch (error) {
    console.error('Error submitting quiz (generic endpoint):', error);
    res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
});

export default router; 