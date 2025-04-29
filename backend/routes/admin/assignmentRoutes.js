const express = require('express');
const router = express.Router();
const Assignment = require('../../models/admin/Assignment');

// Get all assignments
router.get('/', async (req, res) => {
    try {
        const assignments = await Assignment.find()
            .populate('courseId', 'title')
            .populate('createdBy', 'firstName lastName')
            .sort({ lastUpdated: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get assignment by ID
router.get('/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('courseId', 'title')
            .populate('createdBy', 'firstName lastName')
            .populate('submissions.studentId', 'firstName lastName email');
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new assignment
router.post('/', async (req, res) => {
    const assignment = new Assignment({
        title: req.body.title,
        description: req.body.description,
        courseId: req.body.courseId,
        type: req.body.type || 'individual',
        dueDate: req.body.dueDate,
        points: req.body.points || 100,
        instructions: req.body.instructions,
        resources: req.body.resources || [],
        submissionFormat: req.body.submissionFormat || 'file',
        allowedFileTypes: req.body.allowedFileTypes || ['pdf', 'doc', 'docx'],
        maxFileSize: req.body.maxFileSize || 10, // MB
        gradingCriteria: req.body.gradingCriteria || [],
        settings: req.body.settings || {
            lateSubmissions: true,
            penaltyPerDay: 10,
            maxDaysLate: 5,
            blindGrading: false
        },
        status: req.body.status || 'draft',
        createdBy: req.user.id
    });

    try {
        const newAssignment = await assignment.save();
        res.status(201).json(newAssignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update an assignment
router.put('/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        // Update fields that are sent
        if (req.body.title) assignment.title = req.body.title;
        if (req.body.description) assignment.description = req.body.description;
        if (req.body.courseId) assignment.courseId = req.body.courseId;
        if (req.body.type) assignment.type = req.body.type;
        if (req.body.dueDate) assignment.dueDate = req.body.dueDate;
        if (req.body.points) assignment.points = req.body.points;
        if (req.body.instructions) assignment.instructions = req.body.instructions;
        if (req.body.resources) assignment.resources = req.body.resources;
        if (req.body.submissionFormat) assignment.submissionFormat = req.body.submissionFormat;
        if (req.body.allowedFileTypes) assignment.allowedFileTypes = req.body.allowedFileTypes;
        if (req.body.maxFileSize) assignment.maxFileSize = req.body.maxFileSize;
        if (req.body.gradingCriteria) assignment.gradingCriteria = req.body.gradingCriteria;
        if (req.body.settings) assignment.settings = req.body.settings;
        if (req.body.status) assignment.status = req.body.status;
        
        assignment.lastUpdated = Date.now();
        
        const updatedAssignment = await assignment.save();
        res.json(updatedAssignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an assignment
router.delete('/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        await Assignment.deleteOne({ _id: req.params.id });
        res.json({ message: 'Assignment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Grade a submission
router.post('/:id/submissions/:submissionId/grade', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        const submissionIndex = assignment.submissions.findIndex(
            s => s._id.toString() === req.params.submissionId
        );
        
        if (submissionIndex === -1) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        
        // Update submission with grade and feedback
        assignment.submissions[submissionIndex].grade = req.body.grade;
        assignment.submissions[submissionIndex].feedback = req.body.feedback;
        assignment.submissions[submissionIndex].gradedBy = req.user.id;
        assignment.submissions[submissionIndex].gradedAt = Date.now();
        assignment.submissions[submissionIndex].status = 'graded';
        
        if (req.body.criteriaGrades) {
            assignment.submissions[submissionIndex].criteriaGrades = req.body.criteriaGrades;
        }
        
        await assignment.save();
        
        res.json(assignment.submissions[submissionIndex]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get assignments by course
router.get('/course/:courseId', async (req, res) => {
    try {
        const assignments = await Assignment.getAssignmentsByCourse(req.params.courseId);
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get student submissions
router.get('/submissions/student/:studentId', async (req, res) => {
    try {
        const submissions = await Assignment.getStudentSubmissions(req.params.studentId);
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get grading queue
router.get('/grading-queue', async (req, res) => {
    try {
        const queue = await Assignment.getGradingQueue();
        res.json(queue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update assignment settings
router.put('/:id/settings', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        assignment.settings = req.body;
        assignment.lastUpdated = Date.now();
        
        await assignment.save();
        res.json(assignment.settings);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add grading criteria
router.post('/:id/criteria', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        const criterion = {
            title: req.body.title,
            description: req.body.description,
            points: req.body.points,
            rubric: req.body.rubric || []
        };
        
        assignment.gradingCriteria.push(criterion);
        assignment.lastUpdated = Date.now();
        
        await assignment.save();
        res.status(201).json(criterion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 