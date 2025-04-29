const express = require('express');
const router = express.Router();
const Assignment = require('../../models/common/Assignment');
const { auth } = require('../../middleware/auth');

// Get all assignments for a course
router.get('/course/:courseId', async (req, res) => {
    try {
        const assignments = await Assignment.getAssignmentsByCourse(req.params.courseId);
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific assignment
router.get('/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('courseId', 'title code')
            .populate('createdBy', 'firstName lastName')
            .populate('submissions.userId', 'firstName lastName');
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new assignment (admin only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = new Assignment({
        ...req.body,
        createdBy: req.user.id
    });

    try {
        const newAssignment = await assignment.save();
        res.status(201).json(newAssignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Submit an assignment
router.post('/:id/submissions', auth, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const submission = {
            userId: req.user.id,
            userType: req.user.role,
            content: req.body.content,
            files: req.body.files,
            submittedAt: Date.now(),
            status: 'submitted'
        };

        await assignment.addSubmission(submission);
        res.status(201).json({ message: 'Assignment submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Grade a submission (admin only)
router.post('/:id/submissions/:submissionId/grade', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const grade = {
            score: req.body.score,
            feedback: req.body.feedback,
            gradedBy: req.user.id,
            gradedAt: Date.now()
        };

        await assignment.gradeSubmission(req.params.submissionId, grade);
        res.json({ message: 'Submission graded successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's submissions
router.get('/submissions/user', auth, async (req, res) => {
    try {
        const submissions = await Assignment.getUserSubmissions(req.user.id, req.user.role);
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get grading queue (admin only)
router.get('/grading-queue', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const gradingQueue = await Assignment.getGradingQueue();
        res.json(gradingQueue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update assignment settings (admin only)
router.put('/:id/settings', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        await assignment.updateSettings(req.body);
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 