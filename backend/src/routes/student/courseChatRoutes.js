import express from 'express';
import { authenticate, isStudent } from '../../middleware/auth.js';
import ChatRoom from '../../../models/ChatRoom.js';
import Message from '../../../models/Message.js';
import Enrollment from '../../../models/Enrollment.js'; // Fixed path to the correct models directory

const router = express.Router();

// Get all course chat rooms for the authenticated student
router.get('/', authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Find all courses the student is enrolled in
    const enrollments = await Enrollment.find({ 
      student: studentId,
      status: { $ne: 'wishlist' } // Exclude wishlisted courses
    });
    
    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }
    
    // Get course IDs from enrollments
    const courseIds = enrollments.map(enrollment => enrollment.course);
    
    // Find chat rooms for these courses
    const chatRooms = await ChatRoom.find({
      courseId: { $in: courseIds },
      isActive: true
    })
    .populate('courseId', 'title code thumbnail')
    .sort({ createdAt: -1 });
    
    // Format the chat rooms for frontend
    const formattedRooms = chatRooms.map(room => {
      // Find the corresponding enrollment
      const enrollment = enrollments.find(e => 
        e.course.toString() === room.courseId?._id.toString()
      );
      
      return {
        id: room._id,
        name: room.courseId?.title || 'Course Chat',
        description: `Chat for ${room.courseId?.code || 'course'}`,
        online: true, // Consider this chat always active
        lastMessage: room.lastMessage?.content || 'No messages yet',
        lastMessageTime: room.lastMessage?.timestamp || room.createdAt,
        unreadCount: room.messageCount || 0, // This should be calculated based on user's last read
        type: 'course',
        courseId: room.courseId?._id,
        courseCode: room.courseId?.code,
        enrollmentStatus: enrollment?.status || 'enrolled',
        // Additional fields as needed
        thumbnail: room.courseId?.thumbnail
      };
    });
    
    res.json(formattedRooms);
  } catch (error) {
    console.error('Error fetching course chat rooms:', error);
    res.status(500).json({ 
      message: 'Error fetching course chat rooms',
      error: error.message 
    });
  }
});

// Get messages for a specific course chat room
router.get('/:id/messages', authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user._id;
    const chatRoomId = req.params.id;
    
    // Verify this is a valid course chat room
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      isActive: true
    });
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Verify student is enrolled in this course
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: chatRoom.courseId,
      status: { $ne: 'wishlist' }
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }
    
    // Get messages
    const messages = await Message.find({
      roomId: chatRoomId,
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
    console.error('Error fetching course chat messages:', error);
    res.status(500).json({ 
      message: 'Error fetching course chat messages',
      error: error.message 
    });
  }
});

// Send message to a course chat room
router.post('/:id/messages', authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user._id;
    const chatRoomId = req.params.id;
    const { content, replyTo } = req.body;
    
    // Verify this is a valid course chat room
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      isActive: true
    });
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Verify student is enrolled in this course
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: chatRoom.courseId,
      status: { $ne: 'wishlist' }
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }
    
    // Create message
    const message = new Message({
      roomId: chatRoomId,
      sender: studentId,
      content: content,
      replyTo: replyTo || null,
    });
    
    await message.save();
    
    // Update chat room's last activity and message count
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      $inc: { messageCount: 1 },
      lastActivity: new Date(),
      lastMessage: {
        content: content,
        sender: studentId,
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
    console.error('Error sending course chat message:', error);
    res.status(500).json({ 
      message: 'Error sending course chat message',
      error: error.message 
    });
  }
});

export default router; 