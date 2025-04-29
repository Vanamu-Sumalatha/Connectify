import express from 'express';
import { protect } from '../../middleware/auth.js';
import ChatRoom from '../../models/common/ChatRoom.js';
import User from '../../models/User.js';
import { check, validationResult } from 'express-validator';

const router = express.Router();

// Custom middleware to allow both admin and student access
const isAdminOrStudent = (req, res, next) => {
  console.log('Admin/Student check middleware called');
  console.log('User role:', req.user?.role);
  console.log('User ID:', req.user?.id);
  
  if (req.user && (req.user.role === 'admin' || req.user.role === 'student' || req.user.role === 'instructor')) {
    console.log(`User is ${req.user.role}, allowing access to admin chat rooms`);
    next();
  } else {
    console.log(`User is ${req.user?.role || 'unknown'}, access denied`);
    res.status(403).json({ message: 'Access denied. Admin or Student only.' });
  }
};

// Custom middleware for admin-only routes
const adminOnly = (req, res, next) => {
  console.log('Admin-only check middleware called');
  if (req.user && req.user.role === 'admin') {
    console.log('User is admin, proceeding');
    next();
  } else {
    console.log(`User is ${req.user?.role || 'unknown'}, access denied for admin-only resource`);
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Apply authentication middleware for all routes
router.use(protect);

// Routes accessible to both admin and students
// @route   GET /api/admin/chat-rooms
// @desc    Get all chat rooms or filter by type
// @access  Admin and Student
router.get('/', isAdminOrStudent, async (req, res) => {
  try {
    const { type } = req.query;
    console.log(`${req.user.role.toUpperCase()} UI - Received request for chat rooms with type:`, type);
    
    let filter;
    
    // If type is 'discussions', return rooms with type 'support'
    if (type === 'discussions') {
      filter = { type: 'support', status: { $ne: 'deleted' } };
      console.log(`${req.user.role.toUpperCase()} UI - Fetching discussion rooms (support type)`);
    } else if (type) {
      filter = { type, status: { $ne: 'deleted' } };
      console.log(`${req.user.role.toUpperCase()} UI - Fetching chat rooms with type: ${type}`);
    } else {
      filter = { status: { $ne: 'deleted' } };
      console.log(`${req.user.role.toUpperCase()} UI - Fetching all chat rooms`);
    }
    
    console.log(`${req.user.role.toUpperCase()} UI - Using filter:`, JSON.stringify(filter));
    
    const chatRooms = await ChatRoom.find(filter)
      .populate('courseId', 'title code')
      .populate('studyGroupId', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`${req.user.role.toUpperCase()} UI - Found ${chatRooms.length} chat rooms`);
    
    if (chatRooms.length > 0) {
      console.log(`${req.user.role.toUpperCase()} UI - First room details:`, {
        id: chatRooms[0]._id,
        name: chatRooms[0].name,
        type: chatRooms[0].type,
        participants: chatRooms[0].participants?.length,
        messages: chatRooms[0].messages?.length
      });
    }
    
    // Calculate member counts for each room
    const roomsWithCounts = chatRooms.map(room => {
      // Count the number of participants with StudentUser type
      const studentCount = room.participants ? 
        room.participants.filter(p => p.userType === 'StudentUser').length : 0;
      
      console.log(`Room ${room.name}: ${studentCount} students, ${room.participants?.length || 0} total participants`);
      
      return {
        ...room.toObject(),
        memberCount: room.participants ? room.participants.length : 0,
        studentCount: studentCount,
        messageCount: room.messages ? room.messages.length : 0
      };
    });
    
    console.log(`${req.user.role.toUpperCase()} UI - Returning chat rooms with member counts and message counts`);
    res.json(roomsWithCounts);
  } catch (error) {
    console.error(`${req.user.role.toUpperCase()} UI - Error fetching chat rooms:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/chat-rooms/:id/messages
// @desc    Get messages for a specific chat room
// @access  Admin and Student
router.get('/:id/messages', isAdminOrStudent, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findOne({
      _id: req.params.id,
      status: { $ne: 'deleted' }
    });
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Return all messages for the room
    const messages = chatRoom.messages || [];
    res.json(messages);
  } catch (error) {
    console.error(`Error fetching chat room messages:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/chat-rooms/:id/messages
// @desc    Send a message in a chat room
// @access  Admin and Student
router.post('/:id/messages', isAdminOrStudent, async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    
    const chatRoom = await ChatRoom.findOne({
      _id: req.params.id,
      status: { $ne: 'deleted' }
    });
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Create the new message
    const newMessage = {
      senderId: req.user._id,
      senderType: req.user.role === 'admin' ? 'AdminUser' : 'StudentUser',
      content: content,
      type: 'text',
      createdAt: new Date(),
      replyTo: replyTo || null
    };
    
    // Add message to the chat room
    chatRoom.messages.push(newMessage);
    
    // Update last activity
    chatRoom.lastActivity = new Date();
    
    await chatRoom.save();
    
    console.log(`${req.user.role.toUpperCase()} - Message sent to chat room ${chatRoom.name}`);
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error(`Error sending message:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/chat-rooms/:id/messages/:messageId
// @desc    Delete a message (mark as deleted)
// @access  Admin and Student (only their own messages)
router.delete('/:id/messages/:messageId', isAdminOrStudent, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id);
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Find the message in the room
    const messageIndex = chatRoom.messages.findIndex(
      message => message._id.toString() === req.params.messageId
    );
    
    if (messageIndex === -1) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const message = chatRoom.messages[messageIndex];
    
    // Check if user is admin or the sender of the message
    if (req.user.role !== 'admin' && message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only delete your own messages' 
      });
    }
    
    // Mark message as deleted
    chatRoom.messages[messageIndex].isDeleted = true;
    chatRoom.messages[messageIndex].content = 'This message has been deleted';
    
    await chatRoom.save();
    
    console.log(`${req.user.role.toUpperCase()} - Message deleted from chat room ${chatRoom.name}`);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error(`Error deleting message:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only routes below
// @route   POST /api/admin/chat-rooms
// @desc    Create a new chat room
// @access  Admin only
router.post('/', adminOnly, [
  check('name', 'Room name is required').not().isEmpty(),
  check('type', 'Room type is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, type, courseId, studyGroupId } = req.body;
    console.log('Admin UI - Creating chat room with data:', { name, description, type, courseId, studyGroupId });
    
    // Create chat room - use a valid enum value
    // For discussions tab, we'll use 'support' type which is a valid enum value
    const chatRoom = new ChatRoom({
      name,
      description,
      type: type,
      courseId: courseId || null,
      studyGroupId: studyGroupId || null,
      settings: {
        isPrivate: false,
        allowFileSharing: true,
        messageRetention: 'forever',
        allowedRoles: ['admin', 'moderator', 'member', 'support']
      }
    });
    
    // Add the admin as a participant
    chatRoom.participants.push({
      userId: req.user.id,
      userType: 'AdminUser',
      role: 'admin',
      joinedAt: Date.now(),
      lastSeen: Date.now()
    });
    console.log(`Admin UI - Added admin (${req.user.id}) as participant`);
    
    // Always add all students to discussion rooms (support type)
    if (type === 'support') {
      console.log('Admin UI - Adding all students to this support room');
      const students = await User.find({ role: 'student' });
      console.log(`Admin UI - Found ${students.length} students to add`);
      
      // Add each student
      for (const student of students) {
        chatRoom.participants.push({
          userId: student._id,
          userType: 'StudentUser',
          role: 'member',
          joinedAt: Date.now(),
          lastSeen: Date.now()
        });
      }

      // Add a welcome message
      chatRoom.messages.push({
        senderId: req.user.id,
        senderType: 'AdminUser',
        content: `Welcome to ${name}! This is a place for all students to discuss.`,
        type: 'text',
        createdAt: new Date()
      });
      console.log('Admin UI - Added welcome message to chat room');
    }
    
    console.log(`Admin UI - Saving chat room with ${chatRoom.participants.length} participants`);
    await chatRoom.save();
    console.log('Admin UI - Chat room saved successfully with ID:', chatRoom._id);
    
    // Return the created room with counts
    const result = {
      ...chatRoom.toObject(),
      memberCount: chatRoom.participants.length,
      messageCount: chatRoom.messages.length
    };
    
    console.log('Admin UI - Returning chat room with counts:', {
      id: result._id,
      name: result.name,
      type: result.type,
      memberCount: result.memberCount,
      messageCount: result.messageCount
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Admin UI - Error creating chat room:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/admin/chat-rooms/:id
// @desc    Delete a chat room
// @access  Admin
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id);
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Soft delete by changing status
    chatRoom.status = 'deleted';
    await chatRoom.save();
    
    res.json({ message: 'Chat room deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/chat-rooms/:id/add-all-students
// @desc    Add all students to a specific chat room
// @access  Admin only
router.post('/:id/add-all-students', adminOnly, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id);
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Get all students
    const students = await User.find({ role: 'student' });
    console.log(`ADMIN UI - Found ${students.length} students to add to room ${chatRoom.name}`);
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found' });
    }
    
    // Create a map of existing participant IDs for faster lookup
    const existingParticipantIds = new Map();
    chatRoom.participants.forEach(p => {
      if (p.userType === 'StudentUser') {
        existingParticipantIds.set(p.userId.toString(), true);
      }
    });
    
    let studentsAdded = 0;
    
    // Add each student if not already a participant
    for (const student of students) {
      const studentId = student._id.toString();
      
      if (!existingParticipantIds.has(studentId)) {
        chatRoom.participants.push({
          userId: student._id,
          userType: 'StudentUser',
          role: 'member',
          joinedAt: Date.now(),
          lastSeen: Date.now()
        });
        studentsAdded++;
      }
    }
    
    if (studentsAdded > 0) {
      console.log(`ADMIN UI - Added ${studentsAdded} students to room ${chatRoom.name}`);
      
      // Add a system message
      chatRoom.messages.push({
        senderId: req.user.id,
        senderType: 'AdminUser',
        content: `${studentsAdded} new students were added to this room.`,
        type: 'text',
        createdAt: new Date()
      });
      
      await chatRoom.save();
      
      return res.json({ 
        message: `Successfully added ${studentsAdded} students to the room`,
        studentsAdded,
        totalParticipants: chatRoom.participants.length,
        studentCount: chatRoom.participants.filter(p => p.userType === 'StudentUser').length
      });
    } else {
      return res.json({ message: 'All students are already in this room' });
    }
  } catch (error) {
    console.error('Error adding students to room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/chat-rooms/:id/participants
// @desc    Get the participants of a chat room
// @access  Admin only
router.get('/:id/participants', adminOnly, async (req, res) => {
  try {
    console.log(`ADMIN UI - Fetching participants for chat room ${req.params.id}`);
    
    const chatRoom = await ChatRoom.findById(req.params.id);
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Return the participants array
    const participants = chatRoom.participants || [];
    console.log(`ADMIN UI - Found ${participants.length} participants in room ${chatRoom.name}`);
    
    res.json(participants);
  } catch (error) {
    console.error('Error fetching chat room participants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/chat-rooms/:id/participants
// @desc    Add a participant to a chat room
// @access  Admin only
router.post('/:id/participants', adminOnly, async (req, res) => {
  try {
    const { userId, userType, role } = req.body;
    
    if (!userId || !userType) {
      return res.status(400).json({ message: 'userId and userType are required' });
    }
    
    console.log(`ADMIN UI - Adding participant to chat room ${req.params.id}:`, { userId, userType, role });
    
    const chatRoom = await ChatRoom.findById(req.params.id);
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Check if the user already exists in the participants array
    const existingParticipant = chatRoom.participants.find(
      p => p.userId.toString() === userId && p.userType === userType
    );
    
    if (existingParticipant) {
      return res.status(400).json({ message: 'User is already a participant in this room' });
    }
    
    // Add the participant
    chatRoom.participants.push({
      userId,
      userType,
      role: role || 'member',
      joinedAt: Date.now(),
      lastSeen: Date.now()
    });
    
    await chatRoom.save();
    
    console.log(`ADMIN UI - Added participant to room ${chatRoom.name}`);
    
    res.status(201).json({ 
      message: 'Participant added successfully',
      participantCount: chatRoom.participants.length
    });
  } catch (error) {
    console.error('Error adding participant to chat room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 