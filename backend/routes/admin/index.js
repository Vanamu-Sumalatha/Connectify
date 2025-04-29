import express from 'express';
import { protect } from '../../middleware/auth.js';
import testRoutes from './adminTestRoutes.js';
import quizRoutes from './adminQuizRoutes.js';
import chatRoomRoutes from './chatRoomRoutes.js';

const router = express.Router();

// Apply authentication middleware to all routes, but let individual route files
// handle their own authorization (admin vs student access)
router.use(protect);

// Mount specific admin routes
router.use('/tests', testRoutes);
router.use('/quizzes', quizRoutes);
router.use('/chat-rooms', chatRoomRoutes);

export default router; 