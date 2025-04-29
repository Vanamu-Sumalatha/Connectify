import express from 'express';
import { authenticate, isAdmin, isAdminOrStudent } from '../../middleware/auth.js';
import {
    getChatRooms,
    getChatRoom,
    createChatRoom,
    updateChatRoom,
    deleteChatRoom
} from '../../controllers/admin/chatRoomController.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateChatRoom = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['support', 'course', 'study-group']).withMessage('Invalid room type'),
    body('description').optional().trim(),
    body('courseId').optional().isMongoId().withMessage('Invalid course ID'),
    body('studyGroupId').optional().isMongoId().withMessage('Invalid study group ID'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// Get all chat rooms with optional type filter
// Allow both admins and students to access this route
router.get('/', authenticate, isAdminOrStudent, getChatRooms);

// Get a single chat room
// Allow both admins and students to access this route
router.get('/:id', authenticate, isAdminOrStudent, getChatRoom);

// Create a new chat room - admin only
router.post('/', authenticate, isAdmin, validateChatRoom, createChatRoom);

// Update a chat room - admin only
router.put('/:id', authenticate, isAdmin, validateChatRoom, updateChatRoom);

// Delete a chat room (soft delete) - admin only
router.delete('/:id', authenticate, isAdmin, deleteChatRoom);

export default router; 