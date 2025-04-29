const express = require('express');
const router = express.Router();
const Quiz = require('../../models/common/Quiz');
const { auth } = require('../../middleware/auth');

// Get all quizzes for a course
router.get('/course/:courseId', async (req, res) => {
    try {
        const quizzes = await Quiz.getQuizzesByCourse(req.params.courseId);
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific quiz
router.get('/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('courseId', 'title code')
            .populate('createdBy', 'firstName lastName');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new quiz (admin only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const quiz = new Quiz({
        ...req.body,
        createdBy: req.user.id
    });

    try {
        const newQuiz = await quiz.save();
        res.status(201).json(newQuiz);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add a question to a quiz (admin only)
router.post('/:id/questions', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        await quiz.addQuestion(req.body);
        res.status(201).json({ message: 'Question added successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a question in a quiz (admin only)
router.put('/:id/questions/:questionId', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        await quiz.updateQuestion(req.params.questionId, req.body);
        res.json({ message: 'Question updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Submit a quiz attempt
router.post('/:id/attempts', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const attempt = {
            userId: req.user.id,
            userType: req.user.role,
            answers: req.body.answers,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            status: 'completed'
        };

        await quiz.addAttempt(attempt);
        res.status(201).json({ message: 'Quiz attempt submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's quiz attempts
router.get('/attempts/user', auth, async (req, res) => {
    try {
        const attempts = await Quiz.getUserAttempts(req.user.id, req.user.role);
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get quiz analytics (admin only)
router.get('/:id/analytics', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const analytics = await Quiz.getQuizAnalytics(req.params.id);
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 