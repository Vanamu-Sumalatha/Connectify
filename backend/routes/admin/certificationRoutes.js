const express = require('express');
const router = express.Router();
const CertificationTest = require('../../models/admin/CertificationTest');

// Get all certification tests
router.get('/', async (req, res) => {
    try {
        const certifications = await CertificationTest.find()
            .populate('courseId', 'title')
            .sort({ lastUpdated: -1 });
        res.json(certifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get certification test by ID
router.get('/:id', async (req, res) => {
    try {
        const certification = await CertificationTest.findById(req.params.id)
            .populate('courseId', 'title')
            .populate('attempts.studentId', 'firstName lastName email');
        
        if (!certification) {
            return res.status(404).json({ message: 'Certification test not found' });
        }
        
        res.json(certification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new certification test
router.post('/', async (req, res) => {
    const certification = new CertificationTest({
        title: req.body.title,
        description: req.body.description,
        courseId: req.body.courseId,
        duration: req.body.duration,
        passingScore: req.body.passingScore,
        maxAttempts: req.body.maxAttempts,
        questions: req.body.questions || [],
        settings: req.body.settings || {
            randomizeQuestions: false,
            showCorrectAnswers: false,
            timeLimit: true
        },
        status: req.body.status || 'draft',
        createdBy: req.user.id
    });

    try {
        const newCertification = await certification.save();
        res.status(201).json(newCertification);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a certification test
router.put('/:id', async (req, res) => {
    try {
        const certification = await CertificationTest.findById(req.params.id);
        
        if (!certification) {
            return res.status(404).json({ message: 'Certification test not found' });
        }
        
        // Update fields that are sent
        if (req.body.title) certification.title = req.body.title;
        if (req.body.description) certification.description = req.body.description;
        if (req.body.courseId) certification.courseId = req.body.courseId;
        if (req.body.duration) certification.duration = req.body.duration;
        if (req.body.passingScore) certification.passingScore = req.body.passingScore;
        if (req.body.maxAttempts) certification.maxAttempts = req.body.maxAttempts;
        if (req.body.questions) certification.questions = req.body.questions;
        if (req.body.settings) certification.settings = req.body.settings;
        if (req.body.status) certification.status = req.body.status;
        
        certification.lastUpdated = Date.now();
        
        const updatedCertification = await certification.save();
        res.json(updatedCertification);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add a question to a certification test
router.post('/:id/questions', async (req, res) => {
    try {
        const certification = await CertificationTest.findById(req.params.id);
        
        if (!certification) {
            return res.status(404).json({ message: 'Certification test not found' });
        }
        
        const question = {
            type: req.body.type,
            question: req.body.question,
            options: req.body.options,
            correctAnswer: req.body.correctAnswer,
            points: req.body.points || 1,
            explanation: req.body.explanation || '',
            difficulty: req.body.difficulty || 'medium'
        };
        
        certification.questions.push(question);
        certification.lastUpdated = Date.now();
        
        await certification.save();
        res.status(201).json(question);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a question in a certification test
router.put('/:id/questions/:questionId', async (req, res) => {
    try {
        const certification = await CertificationTest.findById(req.params.id);
        
        if (!certification) {
            return res.status(404).json({ message: 'Certification test not found' });
        }
        
        const questionIndex = certification.questions.findIndex(q => q._id.toString() === req.params.questionId);
        
        if (questionIndex === -1) {
            return res.status(404).json({ message: 'Question not found' });
        }
        
        // Update question fields
        if (req.body.type) certification.questions[questionIndex].type = req.body.type;
        if (req.body.question) certification.questions[questionIndex].question = req.body.question;
        if (req.body.options) certification.questions[questionIndex].options = req.body.options;
        if (req.body.correctAnswer) certification.questions[questionIndex].correctAnswer = req.body.correctAnswer;
        if (req.body.points) certification.questions[questionIndex].points = req.body.points;
        if (req.body.explanation) certification.questions[questionIndex].explanation = req.body.explanation;
        if (req.body.difficulty) certification.questions[questionIndex].difficulty = req.body.difficulty;
        
        certification.lastUpdated = Date.now();
        
        await certification.save();
        res.json(certification.questions[questionIndex]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a certification test
router.delete('/:id', async (req, res) => {
    try {
        const certification = await CertificationTest.findById(req.params.id);
        
        if (!certification) {
            return res.status(404).json({ message: 'Certification test not found' });
        }
        
        await CertificationTest.deleteOne({ _id: req.params.id });
        res.json({ message: 'Certification test deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get certification tests by course
router.get('/course/:courseId', async (req, res) => {
    try {
        const certifications = await CertificationTest.getTestsByCourse(req.params.courseId);
        res.json(certifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get certification attempts by student
router.get('/attempts/student/:studentId', async (req, res) => {
    try {
        const attempts = await CertificationTest.getStudentAttempts(req.params.studentId);
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get issued certificates
router.get('/certificates', async (req, res) => {
    try {
        const certificates = await CertificationTest.getIssuedCertificates();
        res.json(certificates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Issue a certificate
router.post('/:id/certificates', async (req, res) => {
    try {
        const certification = await CertificationTest.findById(req.params.id);
        
        if (!certification) {
            return res.status(404).json({ message: 'Certification test not found' });
        }
        
        const certificate = {
            studentId: req.body.studentId,
            issueDate: new Date(),
            expiryDate: req.body.expiryDate,
            score: req.body.score,
            certificateId: `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: 'issued'
        };
        
        certification.certificates.push(certificate);
        await certification.save();
        
        res.status(201).json(certificate);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 