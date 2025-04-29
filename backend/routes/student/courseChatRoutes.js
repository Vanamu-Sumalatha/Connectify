import express from 'express';
import { protect, isStudent } from '../../middleware/auth.js';
import ChatRoom from '../../models/ChatRoom.js';
import Message from '../../models/Message.js';
import Enrollment from '../../models/Enrollment.js';
import CourseChat from '../../models/student/CourseChat.js'; // Import the CourseChat model
import mongoose from 'mongoose';

const router = express.Router();

// Test endpoint to verify route mounting
router.get('/test', async (req, res) => {
  console.log('Test endpoint accessed from courseChatRoutes.js');
  res.json({
    status: 'ok',
    message: 'Route is correctly mounted and accessible',
    timestamp: new Date().toISOString(),
    router: 'courseChatRoutes.js'
  });
});

// Debug endpoint to test route accessibility
router.get('/debug', async (req, res) => {
  console.log('Debug endpoint accessed successfully');
  
  // Check if Message model exists
  let messageModelExists = false;
  try {
    const messageCount = await Message.estimatedDocumentCount();
    messageModelExists = true;
    console.log(`Message model exists, contains ${messageCount} documents`);
  } catch (err) {
    console.error(`Message model check failed: ${err.message}`);
  }
  
  // Check if CourseChat model exists
  let courseChatModelExists = false;
  try {
    const chatCount = await CourseChat.estimatedDocumentCount();
    courseChatModelExists = true;
    console.log(`CourseChat model exists, contains ${chatCount} documents`);
  } catch (err) {
    console.error(`CourseChat model check failed: ${err.message}`);
  }
  
  // Log all registered routes (for debugging)
  const routes = [];
  router.stack.forEach((middleware) => {
    if (middleware.route) {
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      routes.push(`${methods} ${path}`);
    }
  });
  
  res.json({ 
    status: 'ok', 
    message: 'Course chat routes are accessible',
    timestamp: new Date().toISOString(),
    models: {
      messageModelExists,
      courseChatModelExists
    },
    registeredRoutes: routes,
    serverPath: req.originalUrl
  });
});

// Temporary endpoint to create a CourseChat for a specific course
router.get('/create-for-course/:courseId', protect, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user._id;
    console.log(`Creating CourseChat for course: ${courseId} by user: ${userId}`);
    
    // Check if it already exists
    let existingChat = await CourseChat.findOne({ courseId });
    
    if (existingChat) {
      console.log(`CourseChat already exists for course: ${courseId}`);
      return res.json({
        status: 'exists',
        chat: existingChat
      });
    }
    
    // Get course details if possible
    let courseName = 'Course Chat';
    try {
      const Course = mongoose.model('Course');
      const course = await Course.findById(courseId);
      if (course) {
        courseName = course.title || 'Course Chat';
        console.log(`Using course name: ${courseName} for chat room`);
      }
    } catch (err) {
      console.log(`Could not fetch course details: ${err.message}`);
    }
    
    // Create new CourseChat
    const newChat = new CourseChat({
      courseId,
      name: `${courseName} Chat`,
      description: `Chat for ${courseName}`,
      participants: [{
        userId: userId,
        joinedAt: new Date(),
        lastSeen: new Date()
      }],
      messages: [],  
      createdAt: new Date()
    });
    
    await newChat.save();
    console.log(`Created new CourseChat with ID: ${newChat._id} for course: ${courseId}`);
    
    res.json({
      status: 'created',
      chat: newChat
    });
  } catch (error) {
    console.error(`Error creating CourseChat: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get all course chat rooms for the authenticated student - Improved
router.get('/', protect, isStudent, async (req, res) => {
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
    console.log(`Found ${courseIds.length} course enrollments for student ${studentId}`);
    
    // First try to find CourseChat instances for these courses
    const courseChats = await CourseChat.find({
      courseId: { $in: courseIds },
      isActive: true
    }).populate('courseId', 'title code thumbnail');
    
    console.log(`Found ${courseChats.length} CourseChat instances`);
    
    // If we have CourseChat instances, use them
    if (courseChats.length > 0) {
      // Format the chat rooms for frontend
      const formattedRooms = courseChats.map(chat => {
        // Find the corresponding enrollment
        const enrollment = enrollments.find(e => 
          e.course.toString() === chat.courseId?.toString()
        );
        
        return {
          id: chat._id,
          name: chat.name || 'Course Chat',
          description: chat.description || `Chat for course`,
          online: true,
          lastMessage: chat.messages.length > 0 ? 
            chat.messages[chat.messages.length - 1].content : 
            'No messages yet',
          lastMessageTime: chat.lastActivity || chat.createdAt,
          unreadCount: 0, // This should be calculated based on user's last read
          type: 'course',
          courseId: chat.courseId,
          enrollmentStatus: enrollment?.status || 'enrolled'
        };
      });
      
      return res.json(formattedRooms);
    }
    
    // Fallback: Find chat rooms for these courses in the old ChatRoom model
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

// Get messages for a course chat room - IMPROVED FOR ANY COURSE ID
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const chatId = req.params.id;
    
    console.log(`GET request for messages in chat room: ${chatId}`);
    console.log(`Full URL path: ${req.originalUrl}`);
    console.log(`Request from user: ${userId}`);
    
    // Validate chatId format for MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      console.error(`Invalid ObjectId format for chatId: ${chatId}`);
      return res.status(400).json({ 
        message: 'Invalid course ID format',
        chatId: chatId
      });
    }
    
    // Try multiple approaches to find the chat room
    let courseChat = null;
    let searchMethod = '';
    let searchLog = [];
    
    // 1. First try direct ID match (most common case when chat already exists)
    courseChat = await CourseChat.findById(chatId);
    if (courseChat) {
      searchMethod = 'direct ID match';
      searchLog.push(`Found by _id: ${chatId}`);
    } else {
      searchLog.push(`Not found by _id: ${chatId}`);
      
      // 2. Try by courseId reference
      courseChat = await CourseChat.findOne({ courseId: chatId });
      if (courseChat) {
        searchMethod = 'courseId reference';
        searchLog.push(`Found by courseId: ${chatId}`);
      } else {
        searchLog.push(`Not found by courseId: ${chatId}`);
      }
    }
    
    // 3. Get course details for name/description if we need to create a chat
    let courseName = 'Course Chat';
    let courseDetails = null;
    
    try {
      const Course = mongoose.model('Course');
      courseDetails = await Course.findById(chatId);
      if (courseDetails) {
        courseName = courseDetails.title || 'Course Chat';
        console.log(`Found course details: ${courseName}`);
        searchLog.push(`Found course details: ${courseName}`);
      } else {
        searchLog.push(`No course found with id: ${chatId}`);
      }
    } catch (err) {
      console.log(`Could not fetch course details: ${err.message}`);
      searchLog.push(`Error fetching course: ${err.message}`);
    }
    
    // 4. If still not found, create a new chat room
    if (!courseChat) {
      console.log(`No CourseChat found. Creating a new one for ID: ${chatId}`);
      searchLog.push(`Creating new chat for ID: ${chatId}`);
      
      // Check if this looks like a course ID
      const isCourseId = !!courseDetails;
      
      // Create a unique chat ID for this chat room
      const uniqueChatId = new mongoose.Types.ObjectId();
      
      courseChat = new CourseChat({
        _id: uniqueChatId, // Ensure it has a unique MongoDB ID
        courseId: isCourseId ? chatId : uniqueChatId, // Use chatId as courseId if it's a course
        name: isCourseId ? `${courseName} Chat` : 'Course Discussion',
        description: isCourseId ? `Chat for ${courseName}` : 'General course discussion',
        isActive: true,
        participants: [{
          userId: userId,
          joinedAt: new Date(),
          lastSeen: new Date()
        }],
        messages: [],
        createdAt: new Date()
      });
      
      try {
        await courseChat.save();
        console.log(`Created new CourseChat with ID: ${courseChat._id} for course ID: ${chatId}`);
        searchLog.push(`Successfully created new chat with ID: ${courseChat._id}`);
        searchMethod = 'newly created';
      } catch (createError) {
        console.error(`Error creating CourseChat: ${createError.message}`);
        searchLog.push(`Error creating chat: ${createError.message}`);
        // Return an empty array if we couldn't create a chat
        return res.json({
          messages: [],
          error: 'Failed to create chat room',
          searchLog
        });
      }
    }
    
    // Update the user's last seen time if they're a participant
    let isParticipant = false;
    
    if (courseChat) {
      isParticipant = courseChat.participants.some(p => 
        p.userId && userId && p.userId.toString() === userId.toString()
      );
      
      if (isParticipant) {
        // Update last seen time
        await CourseChat.updateOne(
          { _id: courseChat._id, "participants.userId": userId },
          { $set: { "participants.$.lastSeen": new Date() }}
        );
        searchLog.push('Updated existing participant lastSeen time');
      } else {
        // Add user as participant
        courseChat.participants.push({
          userId: userId,
          joinedAt: new Date(),
          lastSeen: new Date()
        });
        await courseChat.save();
        searchLog.push('Added user as new participant');
      }
      
      console.log(`Found CourseChat ${courseChat._id} with ${courseChat.messages?.length || 0} messages via ${searchMethod}`);
      
      // If no messages, return empty array
      if (!courseChat.messages || courseChat.messages.length === 0) {
        return res.json([]);
      }
      
      // Format messages
      const formattedMessages = courseChat.messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        timestamp: msg.createdAt,
        senderId: msg.senderId || null,
        senderName: msg.senderId && msg.senderId.toString() === userId.toString() ? 'You' : 'User',
        senderAvatar: null,
        read: true,
        chatId: courseChat._id // Add the actual chat ID for future references
      }));
      
      return res.json(formattedMessages);
    }
    
    // Return empty array if nothing found (this should never happen now)
    console.error("No chat found or created - unexpected condition");
    return res.json([]);
    
  } catch (error) {
    console.error(`Error getting messages: ${error.message}`);
    res.status(500).json({ 
      message: 'Error fetching chat messages',
      error: error.message 
    });
  }
});

// Send a message to a course chat room - IMPROVED FOR ANY COURSE ID
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const chatId = req.params.id;
    const { content } = req.body;
    
    console.log(`POST request to send message in chat room: ${chatId}`);
    console.log(`Message content: ${content?.substring(0, 30) || 'empty'}...`);
    console.log(`Request from user: ${userId}`);
    
    if (!content || content.trim() === '') {
      console.error('Empty message content');
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }
    
    // IMPORTANT: First try to find by direct ID match
    let courseChat = await CourseChat.findById(chatId);
    let searchMethod = 'direct ID';
    
    // If not found by direct ID, try by courseId
    if (!courseChat) {
      courseChat = await CourseChat.findOne({ courseId: chatId });
      searchMethod = 'courseId';
    }
    
    // If still not found, we need to create one
    if (!courseChat) {
      console.log(`CourseChat not found. Creating new one for ID: ${chatId}`);
      
      // Try to get course details if available
      let courseName = 'Course Chat';
      let isCourseId = false;
      
      try {
        const Course = mongoose.model('Course');
        const course = await Course.findById(chatId);
        if (course) {
          courseName = course.title || 'Course Chat';
          isCourseId = true;
          console.log(`Found course: ${courseName}`);
        }
      } catch (err) {
        console.log(`Could not fetch course details: ${err.message}`);
      }
      
      // Create a unique chat ID for this chat room
      const uniqueChatId = new mongoose.Types.ObjectId();
      
      courseChat = new CourseChat({
        _id: uniqueChatId, // Ensure it has a unique MongoDB ID
        courseId: isCourseId ? chatId : uniqueChatId, // Use chatId as courseId if it's a course
        name: isCourseId ? `${courseName} Chat` : 'Course Discussion',
        description: isCourseId ? `Chat for ${courseName}` : 'General course discussion',
        isActive: true,
        participants: [{
          userId: userId,
          joinedAt: new Date(),
          lastSeen: new Date()
        }],
        messages: [],
        createdAt: new Date()
      });
      
      try {
        await courseChat.save();
        console.log(`Created new CourseChat with ID: ${courseChat._id} for ID: ${chatId}`);
        searchMethod = 'newly created';
      } catch (createError) {
        console.error(`Error creating CourseChat: ${createError.message}`);
        return res.status(500).json({ 
          error: `Failed to create chat room: ${createError.message}` 
        });
      }
    }
    
    // Check if user is already a participant
    let isParticipant = courseChat.participants.some(p => 
      p.userId && userId && p.userId.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      // Add user as participant
      courseChat.participants.push({
        userId: userId,
        joinedAt: new Date(),
        lastSeen: new Date()
      });
    } else {
      // Update last seen time
      await CourseChat.updateOne(
        { _id: courseChat._id, "participants.userId": userId },
        { $set: { "participants.$.lastSeen": new Date() }}
      );
    }
    
    // Create the new message
    const newMessage = {
      senderId: userId,
      content: content,
      createdAt: new Date(),
      readBy: [{ userId, readAt: new Date() }]
    };
    
    // Add the message to the messages array
    courseChat.messages.push(newMessage);
    courseChat.lastActivity = new Date();
    await courseChat.save();
    
    // Get the ID of the newly added message
    const addedMessage = courseChat.messages[courseChat.messages.length - 1];
    console.log(`Message added to CourseChat with ID: ${addedMessage._id} via ${searchMethod}`);
    
    // Return the newly added message with the correct chat ID for future reference
    res.status(201).json({
      id: addedMessage._id,
      content: addedMessage.content,
      timestamp: addedMessage.createdAt,
      senderId: userId,
      senderName: 'You',
      senderAvatar: null,
      read: true,
      chatId: courseChat._id // Add the actual chat ID
    });
  } catch (error) {
    console.error(`Error sending message: ${error.message}`);
    res.status(500).json({ 
      message: 'Error sending chat message',
      error: error.message 
    });
  }
});

// Add a fallback route to catch any other requests to this router
router.use('*', (req, res) => {
  console.log(`Unhandled route accessed: ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Endpoint not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      '/api/student/course-chat-rooms',
      '/api/student/course-chat-rooms/create-for-course/:courseId',
      '/api/student/course-chat-rooms/:id/messages'
    ]
  });
});

export default router; 