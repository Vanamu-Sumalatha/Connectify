const express = require('express');
const router = express.Router();
const Course = require('../../models/common/Course');
const Module = require('../../models/common/Module');

// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find()
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get course by ID
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('modules')
            .populate('enrollments.studentId', 'firstName lastName email');
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new course
router.post('/', async (req, res) => {
    try {
        // Process requirements and objectives
        let requirements = [];
        if (Array.isArray(req.body.requirements)) {
            requirements = req.body.requirements;
        } else if (typeof req.body.requirements === 'string') {
            requirements = req.body.requirements.split('\n').filter(item => item.trim());
        }
        
        let objectives = [];
        if (Array.isArray(req.body.objectives)) {
            objectives = req.body.objectives;
        } else if (typeof req.body.objectives === 'string') {
            objectives = req.body.objectives.split('\n').filter(item => item.trim());
        }
        
        // Process learning outcomes
        let learningOutcomes = [];
        if (Array.isArray(req.body.learningOutcomes)) {
            learningOutcomes = req.body.learningOutcomes;
        } else if (typeof req.body.learningOutcomes === 'string') {
            learningOutcomes = req.body.learningOutcomes.split('\n').filter(item => item.trim());
        } else if (objectives.length > 0) {
            // Use objectives as learning outcomes if not provided
            learningOutcomes = objectives;
        } else {
            // Default learning outcome
            learningOutcomes = ['Upon completion of this course, students will be able to understand the core concepts'];
        }
        
        // Process lessons
        let lessons = [];
        if (Array.isArray(req.body.lessons)) {
            lessons = req.body.lessons.map(lesson => ({
                title: lesson.title || '',
                videoUrl: lesson.videoUrl || '',
                duration: Number(lesson.duration) || 0,
                description: lesson.description || '',
                materials: Array.isArray(lesson.materials) ? lesson.materials.map(material => ({
                    title: material.title || '',
                    type: material.type || 'document',
                    url: material.url || '',
                    description: material.description || ''
                })) : []
            }));
        }
        
        // Process materials
        let materials = [];
        if (Array.isArray(req.body.materials)) {
            materials = req.body.materials.map(material => ({
                title: material.title || '',
                type: material.type || 'document',
                documentUrl: material.documentUrl || '',
                videoUrl: material.videoUrl || '',
                roadmapContent: material.roadmapContent || '',
                description: material.description || ''
            }));
        }
        
        // Create new course
        const course = new Course({
            title: req.body.title,
            code: req.body.code,
            description: req.body.description,
            category: req.body.category,
            level: req.body.level,
            duration: req.body.duration,
            thumbnail: req.body.thumbnail,
            requirements: requirements,
            objectives: objectives,
            learningOutcomes: learningOutcomes,
            lessons: lessons,
            materials: materials,
            isPublished: req.body.isPublished || false,
            status: req.body.status || 'draft',
            tags: Array.isArray(req.body.tags) ? req.body.tags : []
        });

        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
});

// Update course
router.put('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Update basic course information
        course.title = req.body.title;
        course.code = req.body.code;
        course.description = req.body.description;
        course.category = req.body.category;
        course.level = req.body.level;
        course.duration = req.body.duration;
        course.thumbnail = req.body.thumbnail;
        
        // Update requirements and objectives
        if (Array.isArray(req.body.requirements)) {
            course.requirements = req.body.requirements;
        } else if (typeof req.body.requirements === 'string') {
            course.requirements = req.body.requirements.split('\n').filter(item => item.trim());
        }
        
        if (Array.isArray(req.body.objectives)) {
            course.objectives = req.body.objectives;
        } else if (typeof req.body.objectives === 'string') {
            course.objectives = req.body.objectives.split('\n').filter(item => item.trim());
        }
        
        // Update learning outcomes
        if (Array.isArray(req.body.learningOutcomes)) {
            course.learningOutcomes = req.body.learningOutcomes;
        } else if (typeof req.body.learningOutcomes === 'string') {
            course.learningOutcomes = req.body.learningOutcomes.split('\n').filter(item => item.trim());
        }
        
        // Update lessons
        if (Array.isArray(req.body.lessons)) {
            course.lessons = req.body.lessons.map(lesson => ({
                title: lesson.title || '',
                videoUrl: lesson.videoUrl || '',
                duration: Number(lesson.duration) || 0,
                description: lesson.description || '',
                materials: Array.isArray(lesson.materials) ? lesson.materials.map(material => ({
                    title: material.title || '',
                    type: material.type || 'document',
                    url: material.url || '',
                    description: material.description || ''
                })) : []
            }));
        }
        
        // Update course materials
        if (Array.isArray(req.body.materials)) {
            course.materials = req.body.materials.map(material => ({
                title: material.title || '',
                type: material.type || 'document',
                documentUrl: material.documentUrl || '',
                videoUrl: material.videoUrl || '',
                roadmapContent: material.roadmapContent || '',
                description: material.description || ''
            }));
        }
        
        // Update status fields
        if (req.body.isPublished !== undefined) {
            course.isPublished = req.body.isPublished;
        }
        
        if (req.body.status) {
            course.status = req.body.status;
        }
        
        // Update tags if provided
        if (Array.isArray(req.body.tags)) {
            course.tags = req.body.tags;
        }
        
        // Save the updated course
        const updatedCourse = await course.save();
        res.json(updatedCourse);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
});

// Delete a course
router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        await Course.deleteOne({ _id: req.params.id });
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a module to a course
router.post('/:id/modules', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        const module = new Module({
            title: req.body.title,
            description: req.body.description,
            order: req.body.order || course.modules.length + 1,
            duration: req.body.duration,
            lessons: req.body.lessons || [],
            resources: req.body.resources || [],
            settings: req.body.settings || {
                isPublished: false,
                isPreviewable: false,
                requiresCompletion: true
            }
        });
        
        const newModule = await module.save();
        
        course.modules.push(newModule._id);
        course.updatedAt = Date.now();
        
        await course.save();
        res.status(201).json(newModule);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get course analytics
router.get('/:id/analytics', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('enrollments.studentId', 'firstName lastName');
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Calculate analytics
        const analytics = {
            totalEnrollments: course.enrollments.length,
            activeEnrollments: course.enrollments.filter(e => e.status === 'active').length,
            completedEnrollments: course.enrollments.filter(e => e.completionPercentage === 100).length,
            averageCompletion: 0,
            enrollmentHistory: {},
            moduleCompletionRate: []
        };
        
        // Calculate average completion
        if (course.enrollments.length > 0) {
            const totalCompletion = course.enrollments.reduce(
                (sum, enrollment) => sum + enrollment.completionPercentage, 0
            );
            analytics.averageCompletion = totalCompletion / course.enrollments.length;
        }
        
        // Calculate enrollment history (by month)
        course.enrollments.forEach(enrollment => {
            const date = new Date(enrollment.enrollmentDate);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!analytics.enrollmentHistory[monthYear]) {
                analytics.enrollmentHistory[monthYear] = 0;
            }
            
            analytics.enrollmentHistory[monthYear]++;
        });
        
        // Convert enrollmentHistory to array for easier frontend processing
        analytics.enrollmentHistoryArray = Object.entries(analytics.enrollmentHistory).map(
            ([month, count]) => ({ month, count })
        ).sort((a, b) => a.month.localeCompare(b.month));
        
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get courses by category
router.get('/category/:category', async (req, res) => {
    try {
        const courses = await Course.find({ category: req.params.category })
            .sort({ title: 1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Publish or unpublish a course
router.put('/:id/publish', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if course has modules before publishing
        if (req.body.isPublished && course.modules.length === 0) {
            return res.status(400).json({ message: 'Cannot publish a course with no modules' });
        }
        
        // Update publish status
        course.settings.isPublished = req.body.isPublished;
        course.updatedAt = Date.now();
        
        await course.save();
        res.json({ 
            message: req.body.isPublished ? 'Course published' : 'Course unpublished',
            isPublished: course.settings.isPublished
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update course pricing
router.put('/:id/pricing', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        course.pricing = req.body;
        course.updatedAt = Date.now();
        
        await course.save();
        res.json(course.pricing);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Search courses
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        // Search by title, description, or keywords
        const courses = await Course.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { keywords: { $regex: query, $options: 'i' } }
            ]
        }).populate('instructor', 'firstName lastName');
        
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 