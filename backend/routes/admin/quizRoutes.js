const express = require('express');
const router = express.Router();
const Quiz = require('../../models/common/Quiz');
const { auth } = require('../../middleware/auth');

// Get all quizzes
router.get('/', auth, async (req, res) => {
    try {
        const quizzes = await Quiz.find()
            .populate('courseId', 'title')
            .populate('createdBy', 'firstName lastName')
            .sort({ lastUpdated: -1 });
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get quiz by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('courseId', 'title')
            .populate('createdBy', 'firstName lastName')
            .populate('attempts.studentId', 'firstName lastName email');
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new quiz
router.post('/', auth, async (req, res) => {
    try {
        const {
            title,
            description,
            courseId,
            type,
            duration,
            passingScore,
            questions
        } = req.body;

        // Validate required fields
        if (!title || !description || !courseId || !type || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                required: ['title', 'description', 'courseId', 'type', 'questions']
            });
        }

        // Format questions to match schema
        const formattedQuestions = questions.map(q => ({
            type: {
                type: q.type || 'multiple-choice'
            },
            question: q.question,
            options: q.options.map(opt => ({
                text: opt.text,
                isCorrect: opt.isCorrect
            })),
            points: q.points || 1,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            tags: q.tags || []
        }));

        const quiz = new Quiz({
            title,
            description,
            courseId,
            type: type || 'practice',
            duration: duration || 30,
            passingScore: passingScore || 70,
            questions: formattedQuestions,
            settings: {
                isRandomized: true,
                showResults: true,
                allowReview: true,
                timeLimit: true,
                shuffleQuestions: true,
                shuffleOptions: true
            },
            status: 'published',
            createdBy: req.user.id
        });

        const newQuiz = await quiz.save();
        res.status(201).json(newQuiz);
    } catch (err) {
        console.error('Error creating quiz:', err);
        res.status(500).json({ 
            message: 'Error creating quiz',
            error: err.message 
        });
    }
});

// Update quiz
router.put('/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (key !== '_id' && key !== 'createdBy') {
                quiz[key] = req.body[key];
            }
        });

        quiz.lastUpdated = Date.now();
        const updatedQuiz = await quiz.save();
        res.json(updatedQuiz);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete quiz
router.delete('/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        await quiz.remove();
        res.json({ message: 'Quiz deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a question to a quiz
router.post('/:id/questions', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        const question = {
            type: req.body.type,
            question: req.body.question,
            options: req.body.options,
            correctAnswer: req.body.correctAnswer,
            points: req.body.points || 1,
            explanation: req.body.explanation || '',
            difficulty: req.body.difficulty || 'medium',
            tags: req.body.tags || []
        };
        
        quiz.questions.push(question);
        quiz.lastUpdated = Date.now();
        
        await quiz.save();
        res.status(201).json(question);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a question in a quiz
router.put('/:id/questions/:questionId', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        const questionIndex = quiz.questions.findIndex(q => q._id.toString() === req.params.questionId);
        
        if (questionIndex === -1) {
            return res.status(404).json({ message: 'Question not found' });
        }
        
        // Update question fields
        if (req.body.type) quiz.questions[questionIndex].type = req.body.type;
        if (req.body.question) quiz.questions[questionIndex].question = req.body.question;
        if (req.body.options) quiz.questions[questionIndex].options = req.body.options;
        if (req.body.correctAnswer) quiz.questions[questionIndex].correctAnswer = req.body.correctAnswer;
        if (req.body.points) quiz.questions[questionIndex].points = req.body.points;
        if (req.body.explanation) quiz.questions[questionIndex].explanation = req.body.explanation;
        if (req.body.difficulty) quiz.questions[questionIndex].difficulty = req.body.difficulty;
        if (req.body.tags) quiz.questions[questionIndex].tags = req.body.tags;
        
        quiz.lastUpdated = Date.now();
        
        await quiz.save();
        res.json(quiz.questions[questionIndex]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get quizzes by course
router.get('/course/:courseId', async (req, res) => {
    try {
        const quizzes = await Quiz.getQuizzesByCourse(req.params.courseId);
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get student attempts
router.get('/attempts/student/:studentId', async (req, res) => {
    try {
        const attempts = await Quiz.getStudentAttempts(req.params.studentId);
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get quiz analytics
router.get('/:id/analytics', async (req, res) => {
    try {
        const analytics = await Quiz.getQuizAnalytics(req.params.id);
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update quiz settings
router.put('/:id/settings', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        quiz.settings = req.body;
        quiz.lastUpdated = Date.now();
        
        await quiz.save();
        res.json(quiz.settings);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Export quiz questions (for backup or sharing)
router.get('/:id/export', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        const exportData = {
            title: quiz.title,
            description: quiz.description,
            questions: quiz.questions.map(q => ({
                type: q.type,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                points: q.points,
                explanation: q.explanation,
                difficulty: q.difficulty,
                tags: q.tags
            })),
            settings: quiz.settings,
            exportedAt: new Date()
        };
        
        res.json(exportData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Import quiz questions
router.post('/:id/import', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        if (!req.body.questions || !Array.isArray(req.body.questions)) {
            return res.status(400).json({ message: 'Questions array is required' });
        }
        
        // Add imported questions to existing questions
        req.body.questions.forEach(q => {
            const question = {
                type: q.type,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                points: q.points || 1,
                explanation: q.explanation || '',
                difficulty: q.difficulty || 'medium',
                tags: q.tags || []
            };
            
            quiz.questions.push(question);
        });
        
        quiz.lastUpdated = Date.now();
        
        await quiz.save();
        res.json(quiz.questions);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 