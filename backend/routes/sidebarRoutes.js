import express from 'express';
import { isAdmin, isStudent } from '../middleware/auth.js';

// For now, we'll mock these models until they're properly implemented
// We'll create placeholder functions to avoid errors
const mockSidebarModel = {
  initializeDefaultItems: async () => Promise.resolve([]),
  getStudentSidebarItems: async () => Promise.resolve([
    { title: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
    { title: 'My Courses', path: '/student/courses', icon: 'school' },
    { title: 'Study Groups', path: '/student/study-groups', icon: 'groups' },
    { title: 'AI Chatbot', path: '/student/ai-chatbot', icon: 'smart_toy' },
    { title: 'Progress', path: '/student/progress', icon: 'insights' },
    { title: 'Resources', path: '/student/resources', icon: 'library_books' },
    { title: 'Settings', path: '/student/settings', icon: 'settings' }
  ]),
  getAdminSidebarItems: async () => Promise.resolve([
    { title: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { title: 'User Management', path: '/admin/users', icon: 'people' },
    { title: 'Course Management', path: '/admin/courses', icon: 'school' },
    { title: 'Analytics', path: '/admin/analytics', icon: 'analytics' },
    { title: 'Settings', path: '/admin/settings', icon: 'settings' }
  ]),
  findByIdAndUpdate: async (id, data) => Promise.resolve(data),
  findByIdAndDelete: async (id) => Promise.resolve({ id })
};

const router = express.Router();

// Initialize default sidebar items
router.get('/initialize', async (req, res) => {
    try {
        await mockSidebarModel.initializeDefaultItems();
        await mockSidebarModel.initializeDefaultItems();
        res.json({ message: 'Sidebar items initialized successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student sidebar items
router.get('/student', isStudent, async (req, res) => {
    try {
        const items = await mockSidebarModel.getStudentSidebarItems();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get admin sidebar items
router.get('/admin', isAdmin, async (req, res) => {
    try {
        const items = await mockSidebarModel.getAdminSidebarItems();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update student sidebar item
router.put('/student/:id', isAdmin, async (req, res) => {
    try {
        const item = await mockSidebarModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update admin sidebar item
router.put('/admin/:id', isAdmin, async (req, res) => {
    try {
        const item = await mockSidebarModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new student sidebar item
router.post('/student', isAdmin, async (req, res) => {
    try {
        const item = { ...req.body, id: Date.now().toString() };
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new admin sidebar item
router.post('/admin', isAdmin, async (req, res) => {
    try {
        const item = { ...req.body, id: Date.now().toString() };
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete student sidebar item
router.delete('/student/:id', isAdmin, async (req, res) => {
    try {
        await mockSidebarModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete admin sidebar item
router.delete('/admin/:id', isAdmin, async (req, res) => {
    try {
        await mockSidebarModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 