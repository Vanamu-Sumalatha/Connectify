import express from 'express';
import { protect, isStudent } from '../../middleware/auth.js';
import DirectChat from '../../models/student/directChat.js';
import User from '../../models/User.js';

const router = express.Router();

// Create or get direct chat
router.post('/chat', protect, isStudent, async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user._id;

    // Check if chat already exists
    let chat = await DirectChat.findOne({
      participants: { 
        $all: [currentUserId, participantId]
      }
    }).populate('participants', 'username email profile');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = new DirectChat({
      participants: [currentUserId, participantId],
      messages: []
    });

    await chat.save();
    chat = await DirectChat.findById(chat._id)
      .populate('participants', 'username email profile');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/chat/:chatId/message', protect, isStudent, async (req, res) => {
  try {
    const { content } = req.body;
    const { chatId } = req.params;

    let chat = await DirectChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add message
    chat.messages.push({
      sender: req.user._id,
      content,
      timestamp: new Date()
    });

    await chat.save();
    chat = await DirectChat.findById(chatId)
      .populate('participants', 'username email profile')
      .populate('messages.sender', 'username email profile');

    res.json(chat);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all students for suggestions
router.get('/suggestions', protect, isStudent, async (req, res) => {
  try {
    // Get all students except the current user
    const students = await User.find({
      _id: { $ne: req.user._id },
      role: 'student',
      isActive: true
    }).select('name email profilePicture');

    res.json(students);
  } catch (error) {
    console.error('Error fetching student suggestions:', error);
    res.status(500).json({
      message: 'Error fetching student suggestions',
      error: error.message
    });
  }
});

// Get all direct chats for the current user
router.get('/chats', protect, isStudent, async (req, res) => {
  try {
    const chats = await DirectChat.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'name email profilePicture')
    .populate('lastMessage.sender', 'name')
    .sort({ updatedAt: -1 });

    res.json(chats);
    console.error('Fetching direct chats:', chats);
  } catch (error) {
    console.error('Error fetching direct chats:', error);
    res.status(500).json({
      message: 'Error fetching direct chats',
      error: error.message
    });
  }
});

// Get or create a direct chat with another student
router.post('/chat', protect, isStudent, async (req, res) => {
  try {
    const { participantId } = req.body;

    // Validate participant
    const participant = await User.findOne({
      _id: participantId,
      role: 'student',
      isActive: true
    });

    if (!participant) {
      return res.status(404).json({
        message: 'Student not found'
      });
    }

    // Check if chat already exists
    let chat = await DirectChat.findOne({
      participants: {
        $all: [req.user._id, participantId]
      },
      isActive: true
    }).populate('participants', 'name email profilePicture');

    // If chat doesn't exist, create new one
    if (!chat) {
      chat = new DirectChat({
        participants: [req.user._id, participantId],
        messages: []
      });
      await chat.save();
      chat = await chat.populate('participants', 'name email profilePicture');
    }

    res.json(chat);
  } catch (error) {
    console.error('Error creating/getting direct chat:', error);
    res.status(500).json({
      message: 'Error creating/getting direct chat',
      error: error.message
    });
  }
});

// Send a message in a direct chat
router.post('/chat/:chatId/messages', protect, isStudent, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const chat = await DirectChat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    const newMessage = {
      sender: req.user._id,
      content,
      attachments: attachments || [],
      timestamp: new Date()
    };

    chat.messages.push(newMessage);
    chat.lastMessage = {
      content,
      sender: req.user._id,
      timestamp: new Date()
    };

    await chat.save();

    // Populate the sender details for the new message
    const populatedChat = await DirectChat.findById(chat._id)
      .populate('participants', 'name email profilePicture')
      .populate('messages.sender', 'name email profilePicture')
      .populate('lastMessage.sender', 'name');

    res.json(populatedChat);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      message: 'Error sending message',
      error: error.message
    });
  }
});

// Get messages for a specific chat
router.get('/chat/:chatId/messages', protect, isStudent, async (req, res) => {
  try {
    const chat = await DirectChat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
      isActive: true
    })
    .populate('messages.sender', 'name email profilePicture')
    .select('messages');

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    res.json(chat.messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      message: 'Error fetching messages',
      error: error.message
    });
  }
});

// Mark messages as read
router.put('/chat/:chatId/read', protect, isStudent, async (req, res) => {
  try {
    const chat = await DirectChat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    // Mark all unread messages from other participants as read
    chat.messages.forEach(msg => {
      if (msg.sender.toString() !== req.user._id.toString() && !msg.read) {
        msg.read = true;
      }
    });

    await chat.save();
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      message: 'Error marking messages as read',
      error: error.message
    });
  }
});

export default router;
