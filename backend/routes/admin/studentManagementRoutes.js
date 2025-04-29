const express = require('express');
const router = express.Router();
const Student = require('../../models/student/Student');
const Course = require('../../models/common/Course');

// Get all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.find()
            .select('-password')
            .sort({ lastName: 1, firstName: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .select('-password');
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new student
router.post('/', async (req, res) => {
    try {
        // Check if email already exists
        const existingStudent = await Student.findOne({ email: req.body.email });
        if (existingStudent) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        
        const student = new Student({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            profilePicture: req.body.profilePicture,
            bio: req.body.bio,
            dateOfBirth: req.body.dateOfBirth,
            contactNumber: req.body.contactNumber,
            address: req.body.address,
            institution: req.body.institution,
            interests: req.body.interests || [],
            skills: req.body.skills || [],
            socialProfiles: req.body.socialProfiles || {},
            preferences: req.body.preferences || {},
            role: 'student',
            status: req.body.status || 'active'
        });
        
        const newStudent = await student.save();
        
        // Remove password from response
        const studentResponse = newStudent.toObject();
        delete studentResponse.password;
        
        res.status(201).json(studentResponse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a student
router.put('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // If email is being changed, check if it's already in use
        if (req.body.email && req.body.email !== student.email) {
            const existingStudent = await Student.findOne({ email: req.body.email });
            if (existingStudent) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            student.email = req.body.email;
        }
        
        // Update fields that are sent
        if (req.body.firstName) student.firstName = req.body.firstName;
        if (req.body.lastName) student.lastName = req.body.lastName;
        if (req.body.password) student.password = req.body.password;
        if (req.body.profilePicture) student.profilePicture = req.body.profilePicture;
        if (req.body.bio) student.bio = req.body.bio;
        if (req.body.dateOfBirth) student.dateOfBirth = req.body.dateOfBirth;
        if (req.body.contactNumber) student.contactNumber = req.body.contactNumber;
        if (req.body.address) student.address = req.body.address;
        if (req.body.institution) student.institution = req.body.institution;
        if (req.body.interests) student.interests = req.body.interests;
        if (req.body.skills) student.skills = req.body.skills;
        if (req.body.socialProfiles) student.socialProfiles = req.body.socialProfiles;
        if (req.body.preferences) student.preferences = req.body.preferences;
        if (req.body.status) student.status = req.body.status;
        
        const updatedStudent = await student.save();
        
        // Remove password from response
        const studentResponse = updatedStudent.toObject();
        delete studentResponse.password;
        
        res.json(studentResponse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a student
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        await Student.deleteOne({ _id: req.params.id });
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get student course enrollments
router.get('/:id/courses', async (req, res) => {
    try {
        const courses = await Course.find({ 'enrollments.studentId': req.params.id })
            .select('title description category instructor enrollments');
        
        // Filter enrollments to only include this student's enrollment
        const studentCourses = courses.map(course => {
            const studentEnrollment = course.enrollments.find(
                e => e.studentId.toString() === req.params.id
            );
            
            return {
                _id: course._id,
                title: course.title,
                description: course.description,
                category: course.category,
                instructor: course.instructor,
                enrollment: studentEnrollment
            };
        });
        
        res.json(studentCourses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Enroll student in a course
router.post('/:id/courses/:courseId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if student is already enrolled
        const existingEnrollment = course.enrollments.find(
            e => e.studentId.toString() === req.params.id
        );
        
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Student already enrolled in this course' });
        }
        
        // Add enrollment
        const enrollment = {
            studentId: req.params.id,
            enrollmentDate: new Date(),
            status: 'active',
            completionPercentage: 0,
            lastAccessed: new Date()
        };
        
        course.enrollments.push(enrollment);
        await course.save();
        
        res.status(201).json(enrollment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Unenroll student from a course
router.delete('/:id/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Find enrollment index
        const enrollmentIndex = course.enrollments.findIndex(
            e => e.studentId.toString() === req.params.id
        );
        
        if (enrollmentIndex === -1) {
            return res.status(404).json({ message: 'Student not enrolled in this course' });
        }
        
        // Remove enrollment
        course.enrollments.splice(enrollmentIndex, 1);
        await course.save();
        
        res.json({ message: 'Student unenrolled from course' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get student progress
router.get('/:id/progress', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Get all courses the student is enrolled in
        const courses = await Course.find({ 'enrollments.studentId': req.params.id })
            .select('title description enrollments modules');
        
        // Calculate progress stats
        const progress = {
            totalCourses: courses.length,
            completedCourses: 0,
            inProgressCourses: 0,
            notStartedCourses: 0,
            averageCompletion: 0,
            courseProgress: []
        };
        
        // Process each course
        courses.forEach(course => {
            const enrollment = course.enrollments.find(
                e => e.studentId.toString() === req.params.id
            );
            
            if (!enrollment) return;
            
            // Add course progress
            progress.courseProgress.push({
                courseId: course._id,
                title: course.title,
                completionPercentage: enrollment.completionPercentage,
                lastAccessed: enrollment.lastAccessed,
                status: enrollment.status
            });
            
            // Update counts
            if (enrollment.completionPercentage === 100) {
                progress.completedCourses++;
            } else if (enrollment.completionPercentage > 0) {
                progress.inProgressCourses++;
            } else {
                progress.notStartedCourses++;
            }
        });
        
        // Calculate average completion
        if (courses.length > 0) {
            const totalCompletion = progress.courseProgress.reduce(
                (sum, course) => sum + course.completionPercentage, 0
            );
            progress.averageCompletion = totalCompletion / courses.length;
        }
        
        res.json(progress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get students by status
router.get('/status/:status', async (req, res) => {
    try {
        const students = await Student.find({ status: req.params.status })
            .select('-password')
            .sort({ lastName: 1, firstName: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Search students
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        // Search by name or email
        const students = await Student.find({
            $or: [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('-password');
        
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 