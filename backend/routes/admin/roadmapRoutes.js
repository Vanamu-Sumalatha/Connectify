const express = require('express');
const router = express.Router();
const Roadmap = require('../../models/admin/Roadmap');

// Get all roadmaps
router.get('/', async (req, res) => {
    try {
        const roadmaps = await Roadmap.find()
            .populate('createdBy', 'firstName lastName')
            .sort({ lastUpdated: -1 });
        res.json(roadmaps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get roadmap by ID
router.get('/:id', async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id)
            .populate('createdBy', 'firstName lastName');
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        
        res.json(roadmap);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new roadmap
router.post('/', async (req, res) => {
    const roadmap = new Roadmap({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        level: req.body.level || 'beginner',
        duration: req.body.duration,
        milestones: req.body.milestones || [],
        prerequisites: req.body.prerequisites || [],
        targetAudience: req.body.targetAudience || [],
        learningOutcomes: req.body.learningOutcomes || [],
        tags: req.body.tags || [],
        status: req.body.status || 'draft',
        createdBy: req.user.id
    });

    try {
        const newRoadmap = await roadmap.save();
        res.status(201).json(newRoadmap);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a roadmap
router.put('/:id', async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        
        // Update fields that are sent
        if (req.body.title) roadmap.title = req.body.title;
        if (req.body.description) roadmap.description = req.body.description;
        if (req.body.category) roadmap.category = req.body.category;
        if (req.body.level) roadmap.level = req.body.level;
        if (req.body.duration) roadmap.duration = req.body.duration;
        if (req.body.milestones) roadmap.milestones = req.body.milestones;
        if (req.body.prerequisites) roadmap.prerequisites = req.body.prerequisites;
        if (req.body.targetAudience) roadmap.targetAudience = req.body.targetAudience;
        if (req.body.learningOutcomes) roadmap.learningOutcomes = req.body.learningOutcomes;
        if (req.body.tags) roadmap.tags = req.body.tags;
        if (req.body.status) roadmap.status = req.body.status;
        
        roadmap.lastUpdated = Date.now();
        
        const updatedRoadmap = await roadmap.save();
        res.json(updatedRoadmap);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a roadmap
router.delete('/:id', async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        
        await Roadmap.deleteOne({ _id: req.params.id });
        res.json({ message: 'Roadmap deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a milestone to a roadmap
router.post('/:id/milestones', async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        
        // Calculate the next order number
        const nextOrder = roadmap.milestones.length > 0 
            ? Math.max(...roadmap.milestones.map(m => m.order)) + 1 
            : 1;
        
        const milestone = {
            title: req.body.title,
            description: req.body.description,
            order: req.body.order || nextOrder,
            estimatedTime: req.body.estimatedTime,
            resources: req.body.resources || [],
            prerequisites: req.body.prerequisites || [],
            skills: req.body.skills || [],
            projects: req.body.projects || [],
            assessments: req.body.assessments || []
        };
        
        roadmap.milestones.push(milestone);
        roadmap.lastUpdated = Date.now();
        
        await roadmap.save();
        res.status(201).json(milestone);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a milestone in a roadmap
router.put('/:id/milestones/:milestoneId', async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        
        const milestoneIndex = roadmap.milestones.findIndex(
            m => m._id.toString() === req.params.milestoneId
        );
        
        if (milestoneIndex === -1) {
            return res.status(404).json({ message: 'Milestone not found' });
        }
        
        // Update milestone fields
        if (req.body.title) roadmap.milestones[milestoneIndex].title = req.body.title;
        if (req.body.description) roadmap.milestones[milestoneIndex].description = req.body.description;
        if (req.body.order) roadmap.milestones[milestoneIndex].order = req.body.order;
        if (req.body.estimatedTime) roadmap.milestones[milestoneIndex].estimatedTime = req.body.estimatedTime;
        if (req.body.resources) roadmap.milestones[milestoneIndex].resources = req.body.resources;
        if (req.body.prerequisites) roadmap.milestones[milestoneIndex].prerequisites = req.body.prerequisites;
        if (req.body.skills) roadmap.milestones[milestoneIndex].skills = req.body.skills;
        if (req.body.projects) roadmap.milestones[milestoneIndex].projects = req.body.projects;
        if (req.body.assessments) roadmap.milestones[milestoneIndex].assessments = req.body.assessments;
        
        roadmap.lastUpdated = Date.now();
        
        await roadmap.save();
        res.json(roadmap.milestones[milestoneIndex]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Reorder milestones in a roadmap
router.post('/:id/milestones/reorder', async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        
        // req.body.order should be an array of milestone IDs in the desired order
        if (!req.body.order || !Array.isArray(req.body.order)) {
            return res.status(400).json({ message: 'Order array is required' });
        }
        
        // Verify all milestone IDs exist in the roadmap
        const validIds = roadmap.milestones.map(m => m._id.toString());
        const allIdsValid = req.body.order.every(id => validIds.includes(id));
        
        if (!allIdsValid) {
            return res.status(400).json({ message: 'Invalid milestone ID in order array' });
        }
        
        // Update milestone orders
        req.body.order.forEach((id, index) => {
            const milestone = roadmap.milestones.find(m => m._id.toString() === id);
            if (milestone) {
                milestone.order = index + 1;
            }
        });
        
        roadmap.lastUpdated = Date.now();
        
        await roadmap.save();
        res.json(roadmap.milestones.sort((a, b) => a.order - b.order));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get roadmaps by category
router.get('/category/:category', async (req, res) => {
    try {
        const roadmaps = await Roadmap.getRoadmapsByCategory(req.params.category);
        res.json(roadmaps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get roadmaps by level
router.get('/level/:level', async (req, res) => {
    try {
        const roadmaps = await Roadmap.getRoadmapsByLevel(req.params.level);
        res.json(roadmaps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Search roadmaps
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        const roadmaps = await Roadmap.searchRoadmaps(query);
        res.json(roadmaps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 