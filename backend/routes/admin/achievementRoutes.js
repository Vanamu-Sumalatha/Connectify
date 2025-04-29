const express = require('express');
const router = express.Router();
const Achievement = require('../../models/admin/Achievement');

// Get all achievements
router.get('/', async (req, res) => {
    try {
        const achievements = await Achievement.find()
            .populate('createdBy', 'firstName lastName')
            .sort({ lastUpdated: -1 });
        res.json(achievements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get achievement by ID
router.get('/:id', async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id)
            .populate('createdBy', 'firstName lastName')
            .populate('courseId', 'title')
            .populate('skillId', 'name')
            .populate('earnedBy.studentId', 'firstName lastName email');
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        
        res.json(achievement);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new achievement
router.post('/', async (req, res) => {
    const achievement = new Achievement({
        title: req.body.title,
        description: req.body.description,
        type: req.body.type || 'course',
        category: req.body.category || 'completion',
        icon: req.body.icon || 'default-achievement.png',
        criteria: req.body.criteria || {},
        rewards: req.body.rewards || [],
        prerequisites: req.body.prerequisites || [],
        courseId: req.body.courseId,
        skillId: req.body.skillId,
        visibility: req.body.visibility || 'visible',
        status: req.body.status || 'active',
        createdBy: req.user.id
    });

    try {
        const newAchievement = await achievement.save();
        res.status(201).json(newAchievement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update an achievement
router.put('/:id', async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id);
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        
        // Update fields that are sent
        if (req.body.title) achievement.title = req.body.title;
        if (req.body.description) achievement.description = req.body.description;
        if (req.body.type) achievement.type = req.body.type;
        if (req.body.category) achievement.category = req.body.category;
        if (req.body.icon) achievement.icon = req.body.icon;
        if (req.body.criteria) achievement.criteria = req.body.criteria;
        if (req.body.rewards) achievement.rewards = req.body.rewards;
        if (req.body.prerequisites) achievement.prerequisites = req.body.prerequisites;
        if (req.body.courseId) achievement.courseId = req.body.courseId;
        if (req.body.skillId) achievement.skillId = req.body.skillId;
        if (req.body.visibility) achievement.visibility = req.body.visibility;
        if (req.body.status) achievement.status = req.body.status;
        
        achievement.lastUpdated = Date.now();
        
        const updatedAchievement = await achievement.save();
        res.json(updatedAchievement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an achievement
router.delete('/:id', async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id);
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        
        await Achievement.deleteOne({ _id: req.params.id });
        res.json({ message: 'Achievement deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a student who earned an achievement
router.post('/:id/earner', async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id);
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        
        const earner = {
            studentId: req.body.studentId,
            earnedAt: req.body.earnedAt || Date.now(),
            progress: 100
        };
        
        // Check if student already earned this achievement
        const existingEarner = achievement.earnedBy.find(
            e => e.studentId.toString() === req.body.studentId
        );
        
        if (existingEarner) {
            return res.status(400).json({ message: 'Student already earned this achievement' });
        }
        
        achievement.earnedBy.push(earner);
        achievement.lastUpdated = Date.now();
        
        await achievement.save();
        res.status(201).json(earner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a student's progress towards an achievement
router.put('/:id/progress/:studentId', async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id);
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        
        const earnerIndex = achievement.earnedBy.findIndex(
            e => e.studentId.toString() === req.params.studentId
        );
        
        if (earnerIndex === -1) {
            // If student doesn't exist yet, add them with progress
            const earner = {
                studentId: req.params.studentId,
                earnedAt: null,
                progress: req.body.progress || 0
            };
            
            // If progress is 100%, set earnedAt
            if (earner.progress >= 100) {
                earner.earnedAt = Date.now();
                earner.progress = 100;
            }
            
            achievement.earnedBy.push(earner);
            achievement.lastUpdated = Date.now();
            
            await achievement.save();
            return res.status(201).json(earner);
        }
        
        // Update existing student's progress
        achievement.earnedBy[earnerIndex].progress = req.body.progress;
        
        // If progress is 100%, set earnedAt if it's not already set
        if (req.body.progress >= 100 && !achievement.earnedBy[earnerIndex].earnedAt) {
            achievement.earnedBy[earnerIndex].earnedAt = Date.now();
            achievement.earnedBy[earnerIndex].progress = 100;
        }
        
        achievement.lastUpdated = Date.now();
        
        await achievement.save();
        res.json(achievement.earnedBy[earnerIndex]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get achievements by type
router.get('/type/:type', async (req, res) => {
    try {
        const achievements = await Achievement.getAchievementsByType(req.params.type);
        res.json(achievements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get student achievements
router.get('/student/:studentId', async (req, res) => {
    try {
        const achievements = await Achievement.getStudentAchievements(req.params.studentId);
        res.json(achievements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get course achievements
router.get('/course/:courseId', async (req, res) => {
    try {
        const achievements = await Achievement.getCourseAchievements(req.params.courseId);
        res.json(achievements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create reward for achievement
router.post('/:id/rewards', async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id);
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        
        const reward = {
            type: req.body.type,
            value: req.body.value,
            description: req.body.description
        };
        
        achievement.rewards.push(reward);
        achievement.lastUpdated = Date.now();
        
        await achievement.save();
        res.status(201).json(reward);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 