import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  getDiscussions,
  getDiscussionMessages,
  sendMessage,
  deleteMessage
} from '../../controllers/student/discussionController.js';

const router = express.Router();

// Get all discussions for the authenticated student
router.get('/', authenticate, getDiscussions);

// Get messages for a specific discussion
router.get('/:id/messages', authenticate, getDiscussionMessages);

// Send a message in a discussion
router.post('/:id/messages', authenticate, sendMessage);

// Delete a message
router.delete('/:id/messages/:messageId', authenticate, deleteMessage);

export default router; 