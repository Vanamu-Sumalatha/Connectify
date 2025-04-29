const express = require('express');
const router = express.Router();
const Course = require('../../models/common/Course');
const { auth } = require('../../middleware/auth');

// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('instructor', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a single course
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'firstName lastName')
            .populate('modules')
            .populate('enrolledStudents.studentId', 'firstName lastName');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new course (admin only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const course = new Course({
        ...req.body,
        instructor: req.user.id
    });

    try {
        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a course (admin only)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        Object.assign(course, req.body);
        const updatedCourse = await course.save();
        res.json(updatedCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a course (admin only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await course.remove();
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Enroll in a course (student only)
router.post('/:id/enroll', auth, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.enrolledStudents.some(student => student.studentId.equals(req.user.id))) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        course.enrolledStudents.push({
            studentId: req.user.id,
            enrolledAt: Date.now()
        });

        const updatedCourse = await course.save();
        res.json(updatedCourse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Unenroll from a course (student only)
router.post('/:id/unenroll', auth, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        course.enrolledStudents = course.enrolledStudents.filter(
            student => !student.studentId.equals(req.user.id)
        );

        const updatedCourse = await course.save();
        res.json(updatedCourse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 