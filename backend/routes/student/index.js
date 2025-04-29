import express from 'express';
import dashboardRoutes from './dashboardRoutes.js';
import courseRoutes from './courseRoutes.js';
import testRoutes from './studentTestRoutes.js';
import quizRoutes from './studentQuizRoutes.js';
import todoRoutes from './studentTodoRoutes.js';
import discussionRoutes from './discussionRoutes.js';
import chatRoomsRoutes from './chatRooms.js';

const router = express.Router();

// Mount routes
router.use('/dashboard', dashboardRoutes);
router.use('/courses', courseRoutes);
router.use('/tests', testRoutes);
router.use('/quizzes', quizRoutes);
router.use('/todos', todoRoutes);
router.use('/discussions', discussionRoutes);
router.use('/chat-rooms', chatRoomsRoutes);

export default router; 