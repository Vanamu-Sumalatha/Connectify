import express from 'express';
import { protect, isAdmin } from '../../middleware/auth.js';
import Quiz from '../../models/Quiz.js';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication middleware (protect) to all routes
router.use(protect);

// GET all quizzes
router.get('/', async (req, res) => {
  try {
    // Use the static method which handles population and dynamic fields
    const quizzes = await Quiz.findWithPopulatedFields();
    
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ 
      message: 'Error fetching quizzes', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET a single quiz by ID
router.get('/:id', async (req, res) => {
  try {
    // Use the static method which handles population and dynamic fields
    const quiz = await Quiz.findByIdWithPopulatedFields(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// CREATE a new quiz
router.post('/', isAdmin, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      courseId, 
      type,
      passingScore,
      duration,
      totalPoints,
      dueDate,
      questions,
      isPractice,
      status 
    } = req.body;

    console.log('Received quiz data:', req.body);

    // Validate required fields
    if (!title || !description || !courseId) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'description', 'courseId']
      });
    }

    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: 'Invalid courseId format'
      });
    }

    // Check if course exists
    const course = await mongoose.model('Course').findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: 'Course not found'
      });
    }

    // Process questions
    let processedQuestions = [];
    if (questions && Array.isArray(questions)) {
      processedQuestions = questions.map(q => {
        // Handle both question and text fields
        const questionText = q.question || q.text;
        
        if (!questionText) {
          throw new Error('Question text is required');
        }

        return {
          type: q.type || 'multiple-choice',
          question: questionText,
          options: q.options ? q.options.map(opt => ({
            text: opt.text || '',
            isCorrect: opt.isCorrect || false
          })) : [],
          points: q.points || 1,
          difficulty: 'medium',
          tags: []
        };
      });
    }

    // Create a new quiz
    const newQuiz = new Quiz({
      title,
      description,
      courseId,
      type: type || 'practice',
      passingScore: passingScore || 70,
      duration: duration || 30,
      totalPoints: totalPoints || 100,
      dueDate,
      questions: processedQuestions,
      isPractice: isPractice !== undefined ? isPractice : true,
      status: status || 'published',
      createdBy: req.user ? req.user._id : null
    });

    console.log('Creating quiz with data:', newQuiz);

    // Save the quiz
    const savedQuiz = await newQuiz.save();
    
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ 
      message: 'Error creating quiz', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// UPDATE a quiz
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const quizId = req.params.id;
    console.log(`[PUT /api/admin/quizzes/${quizId}] Received update data:`, req.body);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({ message: 'Invalid Quiz ID format' });
    }

    const {
      title,
      description,
      courseId,
      type, // Added type to update
      passingScore,
      duration,
      // totalPoints, // Field doesn't seem to exist in model
      // dueDate, // Field doesn't seem to exist in model
      questions,
      // isPractice, // Field doesn't seem to exist in model (use type instead?)
      status,
      settings // Added settings to update
    } = req.body;

    // Find the quiz to update
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      console.log(`[PUT /api/admin/quizzes/${quizId}] Quiz not found.`);
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Validate and update courseId if provided
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'Invalid courseId format' });
      }
      const course = await mongoose.model('Course').findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      quiz.courseId = courseId;
    }

    // Update basic fields if provided
    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (type) quiz.type = type;
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (duration !== undefined) quiz.duration = duration;
    if (status) quiz.status = status;

    // Process and update questions if provided
    if (questions && Array.isArray(questions)) {
      console.log(`[PUT /api/admin/quizzes/${quizId}] Processing ${questions.length} questions for update.`);
      const processedQuestions = questions.map(q => {
        const questionText = q.question || q.text;
        if (!questionText) {
          console.warn(`[PUT /api/admin/quizzes/${quizId}] Skipping question update due to missing text: ${JSON.stringify(q)}`);
          return null; // Skip invalid questions
        }
        return {
          _id: q._id, // Keep existing ID if present
          type: q.type || 'multiple-choice',
          question: questionText,
          options: q.options ? q.options.map(opt => ({
            text: opt.text || '',
            isCorrect: opt.isCorrect || false
          })) : [],
          correctAnswer: q.correctAnswer || null,
          points: q.points !== undefined ? q.points : 1,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
          tags: q.tags || []
        };
      }).filter(q => q !== null); // Filter out skipped questions
      quiz.questions = processedQuestions;
    }
    
    // Update settings if provided
    if (settings) {
        // You might want more granular updates here, but a simple merge works for now
        quiz.settings = { ...quiz.settings, ...settings };
    }

    // Manually update the lastUpdated field
    quiz.lastUpdated = Date.now();

    // Save the updated quiz
    console.log(`[PUT /api/admin/quizzes/${quizId}] Saving updated quiz...`);
    const updatedQuiz = await quiz.save();
    console.log(`[PUT /api/admin/quizzes/${quizId}] Quiz saved successfully.`);

    res.json(updatedQuiz);
  } catch (error) {
    console.error(`[PUT /api/admin/quizzes/${req.params.id || 'undefined'}] Error updating quiz:`, error);
    res.status(500).json({ 
        message: 'Error updating quiz', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE a quiz
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    await Quiz.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Error deleting quiz', error: error.message });
  }
});

export default router; 