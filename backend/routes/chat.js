import express from 'express';
import Chat from '../models/common/Chat.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/chats/test
// @desc    Test endpoint to verify Chat model and DB connection
// @access  Public
router.get('/test', async (req, res) => {
  try {
    // Test if the Chat model is connected to MongoDB
    console.log('Test endpoint accessed');
    const count = await Chat.countDocuments();
    
    // Check if we can query the DB
    const recentChats = await Chat.find().limit(5).lean();
    
    res.json({ 
      success: true, 
      message: 'Chat routes are working',
      modelExists: !!Chat,
      collectionExists: true,
      count,
      modelName: Chat.modelName,
      collectionName: Chat.collection.name,
      sampleChats: recentChats.map(chat => ({
        id: chat._id,
        userId: chat.userId,
        title: chat.title,
        messageCount: chat.messages?.length || 0
      }))
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing Chat model', 
      error: error.message,
      stack: error.stack
    });
  }
});

// @route   GET /api/chats/debug/:userId
// @desc    Debug endpoint to get all chats for a user bypassing auth (FOR TESTING ONLY)
// @access  Public (but should be removed in production)
router.get('/debug/:userId', async (req, res) => {
  try {
    console.log(`Debug request for user ${req.params.userId}`);
    const chats = await Chat.find({ userId: req.params.userId });
    console.log(`Found ${chats.length} chats for user ${req.params.userId}`);
    
    // Check if the userId is a valid ObjectId
    const mongoose = (await import('mongoose')).default;
    const isValidObjectId = mongoose.isValidObjectId(req.params.userId);
    
    res.json({ 
      chats, 
      debug: { 
        userIdProvided: req.params.userId,
        isValidObjectId,
        chatCount: chats.length,
        timestamp: new Date().toISOString() 
      } 
    });
  } catch (error) {
    console.error(`Debug endpoint error: ${error.message}`);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route   GET /api/chats/:userId
// @desc    Get all chats for a user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId });
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/chats/:userId
// @desc    Create a new chat
// @access  Private
router.post('/:userId', auth, async (req, res) => {
  try {
    const newChat = new Chat({
      userId: req.params.userId,
      title: req.body.title,
      messages: req.body.messages || [],
      timestamp: req.body.timestamp || new Date()
    });
    const savedChat = await newChat.save();
    res.json({ chat: savedChat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/chats/:userId/:chatId
// @desc    Update a chat
// @access  Private
router.put('/:userId/:chatId', auth, async (req, res) => {
  try {
    const updatedChat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.params.userId },
      { $set: req.body },
      { new: true }
    );
    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json({ chat: updatedChat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/chats/:userId/:chatId
// @desc    Delete a chat
// @access  Private
router.delete('/:userId/:chatId', auth, async (req, res) => {
  try {
    const deletedChat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.params.userId
    });
    if (!deletedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 