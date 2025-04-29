import express from 'express';
import { protect, isStudent } from '../../middleware/auth.js';
import Quiz from '../../models/common/Quiz.js';
import Course from '../../models/Course.js';
import Enrollment from '../../models/Enrollment.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);
router.use(isStudent);

// Get available quizzes for enrolled courses
router.get('/available', async (req, res) => {
    try {
        // Get student's enrolled courses
        const enrollments = await Enrollment.find({
            student: req.user._id,
            status: { $in: ['in-progress', 'completed'] }
        }).select('course');

        const enrolledCourseIds = enrollments.map(e => e.course);

        // Get quizzes for enrolled courses
    const quizzes = await Quiz.find({
      courseId: { $in: enrolledCourseIds },
      status: 'published'
    })
      .populate('courseId', 'title code')
        .select('-questions.options.isCorrect') // Don't send correct answers
        .sort({ createdAt: -1 });

        res.json(quizzes);
  } catch (error) {
        console.error('Error fetching available quizzes:', error);
    res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
});

// Get quiz details
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
            .populate('courseId', 'title code');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

        // Check if student is enrolled in the course
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: quiz.courseId,
            status: { $in: ['in-progress', 'completed'] }
        });

        if (!enrollment) {
            return res.status(403).json({ message: 'You must be enrolled in this course to take the quiz' });
        }

        // Don't send correct answers
        const sanitizedQuiz = {
            ...quiz.toObject(),
            questions: quiz.questions.map(q => ({
                ...q,
                options: q.options.map(opt => ({
                    text: opt.text
                }))
            }))
        };

        res.json(sanitizedQuiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
});

// Start quiz attempt
router.post('/:id/start', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

        // Check enrollment
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: quiz.courseId,
            status: { $in: ['in-progress', 'completed'] }
        });

        if (!enrollment) {
            return res.status(403).json({ message: 'You must be enrolled in this course to take the quiz' });
        }

        // Check if student has exceeded max attempts
        const attempts = quiz.attempts.filter(a => 
            a.userId.equals(req.user._id) && 
            a.userType === 'StudentUser'
        );

        if (attempts.length >= quiz.maxAttempts) {
            return res.status(400).json({ message: 'Maximum attempts reached for this quiz' });
        }

        // Create new attempt
        const attempt = {
            userId: req.user._id,
            userType: 'StudentUser',
            score: 0,
            answers: [],
      startTime: new Date(),
            endTime: new Date(Date.now() + quiz.duration * 60000), // Convert minutes to milliseconds
      status: 'in-progress'
        };

        quiz.attempts.push(attempt);
        await quiz.save();

        // Return quiz without correct answers
        const sanitizedQuiz = {
            ...quiz.toObject(),
            questions: quiz.questions.map(q => ({
                ...q,
                options: q.options.map(opt => ({
                    text: opt.text
                }))
            }))
        };

        res.json(sanitizedQuiz);
  } catch (error) {
        console.error('Error starting quiz:', error);
        res.status(500).json({ message: 'Error starting quiz', error: error.message });
  }
});

// Submit quiz attempt
router.post('/:id/submit', async (req, res) => {
  try {
        const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

        // Find the in-progress attempt
        const attemptIndex = quiz.attempts.findIndex(a => 
            a.userId.equals(req.user._id) && 
            a.userType === 'StudentUser' &&
            a.status === 'in-progress'
        );

        if (attemptIndex === -1) {
            return res.status(400).json({ message: 'No active attempt found' });
        }

        const attempt = quiz.attempts[attemptIndex];

        // Calculate score
        let totalScore = 0;
    const processedAnswers = answers.map(answer => {
      const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
            if (!question) return null;

            let isCorrect = false;
            let pointsEarned = 0;

            if (question.type.type === 'multiple-choice') {
                const correctOptions = question.options
                    .filter(opt => opt.isCorrect)
                    .map(opt => opt._id.toString());
                
                isCorrect = answer.selectedOptions.length === correctOptions.length &&
                    answer.selectedOptions.every(opt => correctOptions.includes(opt));
            } else if (question.type.type === 'true-false') {
                const correctOption = question.options.find(opt => opt.isCorrect)._id.toString();
                isCorrect = answer.selectedOptions.length === 1 && 
                    answer.selectedOptions[0] === correctOption;
            }

            if (isCorrect) {
                pointsEarned = question.points;
                totalScore += pointsEarned;
            }
      
      return {
        questionId: answer.questionId,
                answer: answer.selectedOptions.join(','),
        isCorrect,
                pointsEarned
      };
        }).filter(Boolean);

        // Update attempt
    attempt.answers = processedAnswers;
        attempt.score = totalScore;
        attempt.status = 'completed';
    attempt.endTime = new Date();

        // Update quiz analytics
        quiz.analytics.totalAttempts += 1;
        quiz.analytics.averageScore = 
            (quiz.analytics.averageScore * (quiz.analytics.totalAttempts - 1) + totalScore) / 
            quiz.analytics.totalAttempts;

        await quiz.save();

        res.json({
            score: totalScore,
            passed: totalScore >= quiz.passingScore,
            answers: processedAnswers
        });
  } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
});

export default router; 