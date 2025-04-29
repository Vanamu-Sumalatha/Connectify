const express = require('express');
const router = express.Router();
const AdminDashboard = require('../../models/admin/Dashboard');
const { auth } = require('../../middleware/auth');

// Get dashboard overview
router.get('/overview', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const dashboard = await AdminDashboard.getDashboardOverview();
        res.json(dashboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get course analytics
router.get('/courses/analytics', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const analytics = await AdminDashboard.getCourseAnalytics();
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get student analytics
router.get('/students/analytics', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const analytics = await AdminDashboard.getStudentAnalytics();
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get revenue analytics
router.get('/revenue/analytics', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const analytics = await AdminDashboard.getRevenueAnalytics();
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get engagement metrics
router.get('/engagement/metrics', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const metrics = await AdminDashboard.getEngagementMetrics();
        res.json(metrics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get performance metrics
router.get('/performance/metrics', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const metrics = await AdminDashboard.getPerformanceMetrics();
        res.json(metrics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get recent activities
router.get('/activities/recent', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const activities = await AdminDashboard.getRecentActivities();
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get system status
router.get('/system/status', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const status = await AdminDashboard.getSystemStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 