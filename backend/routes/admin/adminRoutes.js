const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');

// Import admin sub-routes
const dashboardRoutes = require('./dashboardRoutes');
const certificationRoutes = require('./certificationRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const roadmapRoutes = require('./roadmapRoutes');
const achievementRoutes = require('./achievementRoutes');
const quizRoutes = require('./quizRoutes');
const studentManagementRoutes = require('./studentManagementRoutes');
const courseManagementRoutes = require('./courseManagementRoutes');
const contentManagementRoutes = require('./contentManagementRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const settingsRoutes = require('./settingsRoutes');

// Admin authentication check middleware
const adminAuth = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};

// Admin root route - verify admin access
router.get('/', auth, adminAuth, (req, res) => {
    res.json({ 
        message: 'Admin API access granted',
        admin: {
            id: req.user.id,
            name: req.user.firstName + ' ' + req.user.lastName,
            email: req.user.email
        }
    });
});

// Mount sub-routes
router.use('/dashboard', auth, adminAuth, dashboardRoutes);
router.use('/certifications', auth, adminAuth, certificationRoutes);
router.use('/assignments', auth, adminAuth, assignmentRoutes);
router.use('/roadmaps', auth, adminAuth, roadmapRoutes);
router.use('/achievements', auth, adminAuth, achievementRoutes);
router.use('/quizzes', auth, adminAuth, quizRoutes);
router.use('/students', auth, adminAuth, studentManagementRoutes);
router.use('/courses', auth, adminAuth, courseManagementRoutes);
router.use('/content', auth, adminAuth, contentManagementRoutes);
router.use('/analytics', auth, adminAuth, analyticsRoutes);
router.use('/settings', auth, adminAuth, settingsRoutes);

module.exports = router; 