import express from 'express';
import { authenticate, isStudent } from '../../middleware/auth.js';
import ChatRoom from '../../models/ChatRoom.js';
import Message from '../../models/Message.js';

const router = express.Router();

// Get all chat rooms for students (especially support type rooms)
router.get('/', authenticate, isStudent, async (req, res) => {
  try {
    const { type } = req.query;
    let query = { isActive: true };
    
    // If type parameter is provided, filter by type
    if (type) {
      query.type = type;
    } else {
      // Otherwise, show all types that are relevant for students
      query.type = { $in: ['support', 'discussion', 'course', 'study-group'] };
    }
    
    console.log('Student requesting chat rooms with query:', query);
    
    const chatRooms = await ChatRoom.find(query)
      .populate('createdBy', 'name profilePicture')
      .populate('courseId', 'title')
      .populate('studyGroupId', 'name')
      .sort({ createdAt: -1 });

    console.log(`Found ${chatRooms.length} chat rooms for student`);
    res.json(chatRooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ 
      message: 'Error fetching chat rooms',
      error: error.message 
    });
  }
});

// Get a specific chat room
router.get('/:id', authenticate, isStudent, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findOne({
      _id: req.params.id,
      isActive: true,
      type: { $in: ['support', 'discussion', 'course', 'study-group'] }
    })
      .populate('createdBy', 'name profilePicture')
      .populate('courseId', 'title')
      .populate('studyGroupId', 'name');

    if (!chatRoom) {
      return res.status(404).json({ 
        message: 'Chat room not found or not accessible' 
      });
    }

    res.json(chatRoom);
  } catch (error) {
    console.error('Error fetching chat room:', error);
    res.status(500).json({ 
      message: 'Error fetching chat room',
      error: error.message 
    });
  }
});

// Get messages for a specific chat room
router.get('/:id/messages', authenticate, isStudent, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findOne({
      _id: req.params.id,
      isActive: true,
      type: { $in: ['support', 'discussion', 'course', 'study-group'] }
    });

    if (!chatRoom) {
      return res.status(404).json({ 
        message: 'Chat room not found or not accessible' 
      });
    }

    const messages = await Message.find({
      roomId: req.params.id,
      isDeleted: { $ne: true }
    })
      .populate('sender', 'name email profilePicture')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'name email'
        }
      })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      message: 'Error fetching messages',
      error: error.message 
    });
  }
});

// Send a message in a chat room
router.post('/:id/messages', authenticate, isStudent, async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    const chatRoom = await ChatRoom.findOne({
      _id: req.params.id,
      isActive: true,
      type: { $in: ['support', 'discussion', 'course', 'study-group'] }
    });

    if (!chatRoom) {
      return res.status(404).json({ 
        message: 'Chat room not found or not accessible' 
      });
    }

    const message = new Message({
      roomId: req.params.id,
      sender: req.user._id,
      content: content,
      replyTo: replyTo || null,
    });

    await message.save();

    // Update chat room's last activity and message count
    await ChatRoom.findByIdAndUpdate(req.params.id, {
      $inc: { messageCount: 1 },
      lastActivity: new Date(),
      lastMessage: {
        content: content,
        sender: req.user._id,
        timestamp: new Date()
      }
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profilePicture')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'name email'
        }
      });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: 'Error sending message',
      error: error.message 
    });
  }
});

// Delete a message (soft delete)
router.delete('/:id/messages/:messageId', authenticate, isStudent, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      roomId: req.params.id,
      sender: req.user._id // Only allow users to delete their own messages
    });

    if (!message) {
      return res.status(404).json({ 
        message: 'Message not found or you do not have permission to delete it' 
      });
    }

    // Soft delete by setting isDeleted to true
    message.isDeleted = true;
    message.content = 'This message has been deleted';
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      message: 'Error deleting message',
      error: error.message 
    });
  }
});

export default router; 