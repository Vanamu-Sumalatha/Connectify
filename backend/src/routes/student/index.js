import express from 'express';
import chatRoomsRouter from './chatRooms.js';
import courseChatRoutes from './courseChatRoutes.js';
import { authenticate } from '../../middleware/auth.js';
import discussionRoutes from './discussionRoutes.js';

const router = express.Router();

// Register chat rooms routes
router.use('/chat-rooms', chatRoomsRouter);
router.use('/course-chat-rooms', courseChatRoutes);

// Mount discussion routes
router.use('/discussions', discussionRoutes);

export default router; 