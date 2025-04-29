import express from 'express';
import Discussion from '../../models/student/Discussion.js';
import User from '../../models/User.js';
import Course from '../../models/Course.js';
import auth from '../../middleware/auth.js';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/student/discussions/default
// @desc    Ensure default discussions group exists and return it
// @access  Private
router.get('/default', auth, async (req, res) => {
  try {
    // Instead of creating a default group, just return a message
    res.json({ message: 'Default discussions are managed by administrators' });
  } catch (error) {
    console.error('Error with default discussion endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student/discussions/rooms
// @desc    Get all discussions for the authenticated user
// @access  Private
router.get('/rooms', auth, async (req, res) => {
  try {
    // Removed default group creation
    const discussions = await Discussion.getForUser(req.user.id);
    
    // Get basic info and last message for each discussion
    const discussionsWithLastMessage = await Promise.all(
      discussions.map(async (discussion) => {
        // Get the full discussion with messages
        const fullDiscussion = await Discussion.findById(discussion._id)
          .populate('participants.userId', 'name avatar')
          .populate('courseId', 'title code')
          .select('name description participants messages courseId lastActivity participantCount messageCount');
        
        // Get the last message
        const lastMessage = fullDiscussion.messages.length > 0 
          ? fullDiscussion.messages[fullDiscussion.messages.length - 1]
          : null;
        
        // Get unread messages count for this user
        let unreadCount = 0;
        if (lastMessage) {
          // Find the participant object for this user
          const participant = fullDiscussion.participants.find(
            p => p.userId._id.toString() === req.user.id
          );
          
          // Calculate unread by comparing lastSeen with message timestamps
          if (participant) {
            unreadCount = fullDiscussion.messages.filter(
              msg => msg.createdAt > participant.lastSeen
            ).length;
          }
        }
        
        // Only return the needed information
        return {
          _id: fullDiscussion._id,
          name: fullDiscussion.name,
          description: fullDiscussion.description,
          participantCount: fullDiscussion.participantCount,
          messageCount: fullDiscussion.messageCount,
          lastActivity: fullDiscussion.lastActivity,
          course: fullDiscussion.courseId,
          lastMessage: lastMessage ? {
            content: lastMessage.content.substring(0, 50),
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount
        };
      })
    );
    
    res.json(discussionsWithLastMessage);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/student/discussions/rooms
// @desc    Create a new discussion room
// @access  Private (Admin only)
router.post(
  '/rooms',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('courseId', 'Course ID is required').optional().isMongoId()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is an admin or instructor
      const user = await User.findById(req.user.id);
      if (!user || !['admin', 'instructor'].includes(user.role)) {
        return res.status(403).json({ message: 'Not authorized to create discussions' });
      }

      const { name, description, courseId } = req.body;

      // Create new discussion
      const newDiscussion = new Discussion({
        name,
        description,
        courseId: courseId || null,
        participants: [{ userId: req.user.id, role: 'admin' }],
        participantCount: 1
      });

      // If course ID is provided, add all enrolled students
      if (courseId) {
        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({ message: 'Course not found' });
        }

        // Add course instructor(s) first
        if (course.instructors && course.instructors.length > 0) {
          for (const instructorId of course.instructors) {
            if (instructorId.toString() !== req.user.id) {
              newDiscussion.participants.push({
                userId: instructorId,
                role: 'moderator'
              });
            }
          }
        }

        // Find all enrolled students and add them
        const enrolledStudents = await User.find({
          _id: { $in: course.students || [] },
          role: 'student'
        });

        for (const student of enrolledStudents) {
          newDiscussion.participants.push({
            userId: student._id,
            role: 'participant'
          });
        }

        newDiscussion.participantCount = newDiscussion.participants.length;
      }

      await newDiscussion.save();
      res.status(201).json(newDiscussion);
    } catch (error) {
      console.error('Error creating discussion:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/student/discussions/:id/messages
// @desc    Get messages for a specific discussion
// @access  Private
router.get('/:id/messages', auth, async (req, res) => {
  try {
    console.log(`Fetching messages for discussion: ${req.params.id}`);
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid discussion ID' });
    }

    // First try to get the discussion from the Discussion model
    let discussion = await Discussion.findById(req.params.id)
      .populate({
        path: 'messages.senderId',
        select: 'name avatar'
      });

    // If not found in Discussion model, check if it's an admin ChatRoom
    if (!discussion) {
      console.log(`Discussion not found, checking if it's an admin chat room`);
      try {
        const ChatRoom = mongoose.model('ChatRoom');
        const chatRoom = await ChatRoom.findById(req.params.id)
          .populate({
            path: 'messages.senderId',
            select: 'name avatar'
          });

        console.log(`Found chat room: ${chatRoom ? chatRoom.name : 'null'}, type: ${chatRoom?.type}`);
        
        // Check if it's a chat room that should be accessible (support type or otherwise)
        if (chatRoom && (chatRoom.type === 'support' || chatRoom.type === 'announcement')) {
          // Verify the user is a participant in the ChatRoom
          const isParticipant = chatRoom.participants.some(
            participant => participant.userId.toString() === req.user.id
          );

          console.log(`User is participant: ${isParticipant}`);

          if (!isParticipant) {
            return res.status(403).json({ message: 'Not authorized to view this discussion' });
          }

          // Update lastSeen for this user
          const participantIndex = chatRoom.participants.findIndex(
            p => p.userId.toString() === req.user.id
          );
          
          if (participantIndex !== -1) {
            chatRoom.participants[participantIndex].lastSeen = new Date();
            await chatRoom.save();
          }

          // Format ChatRoom messages to match Discussion message format
          const formattedMessages = chatRoom.messages.map(msg => ({
            _id: msg._id,
            content: msg.content,
            sender: msg.senderId,
            createdAt: msg.createdAt,
            isEdited: msg.isEdited || false,
            isDeleted: false,
            isReply: false,
            replyTo: null,
            mediaType: msg.type !== 'text' ? msg.type : 'none',
            mediaUrl: msg.fileUrl || null,
            readBy: []  // ChatRoom doesn't track this the same way
          }));

          console.log(`Returning ${formattedMessages.length} messages from chat room`);
          return res.json(formattedMessages);
        }
      } catch (error) {
        console.error('Error checking for ChatRoom:', error);
      }

      // If not found in either model
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Verify the user is a participant in the Discussion
    const isParticipant = discussion.participants.some(
      participant => participant.userId.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this discussion' });
    }

    // Update the lastSeen field for this user
    const participantIndex = discussion.participants.findIndex(
      p => p.userId.toString() === req.user.id
    );
    
    if (participantIndex !== -1) {
      discussion.participants[participantIndex].lastSeen = new Date();
      await discussion.save();
    }

    // Format messages for response
    const formattedMessages = discussion.messages.map(msg => ({
      _id: msg._id,
      content: msg.content,
      sender: msg.senderId,
      createdAt: msg.createdAt,
      isEdited: msg.isEdited,
      isDeleted: msg.isDeleted,
      isReply: msg.isReply,
      replyTo: msg.replyTo,
      mediaType: msg.mediaType,
      mediaUrl: msg.mediaUrl,
      readBy: msg.readBy
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching discussion messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/student/discussions/:id/messages
// @desc    Post a message to a discussion
// @access  Private
router.post(
  '/:id/messages',
  [
    auth,
    [
      check('content', 'Message content is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log(`Posting message to discussion: ${req.params.id}`);
      
      // First try to find the discussion in the Discussion model
      let discussion = await Discussion.findById(req.params.id);
      let isAdminChatRoom = false;
      let chatRoom;

      // If not found in Discussion model, check if it's an admin ChatRoom
      if (!discussion) {
        console.log(`Discussion not found, checking if it's an admin chat room`);
        try {
          const ChatRoom = mongoose.model('ChatRoom');
          chatRoom = await ChatRoom.findById(req.params.id);
          
          console.log(`Found chat room: ${chatRoom ? chatRoom.name : 'null'}, type: ${chatRoom?.type}`);
          
          if (chatRoom && (chatRoom.type === 'support' || chatRoom.type === 'announcement')) {
            isAdminChatRoom = true;
          } else {
            return res.status(404).json({ message: 'Discussion not found' });
          }
        } catch (error) {
          console.error('Error checking for ChatRoom:', error);
          return res.status(404).json({ message: 'Discussion not found' });
        }
      }

      // Handle different models
      if (isAdminChatRoom) {
        // Verify the user is a participant in the ChatRoom
        const participant = chatRoom.participants.find(
          p => p.userId.toString() === req.user.id
        );

        console.log(`User is participant: ${!!participant}`);

        if (!participant) {
          return res.status(403).json({ message: 'Not authorized to post in this discussion' });
        }

        // Check if only admins can post (if set) and user is not admin/moderator
        if (
          chatRoom.settings?.onlyAdminsCanPost && 
          !['admin', 'moderator'].includes(participant.role)
        ) {
          return res.status(403).json({ message: 'Only admins and moderators can post in this discussion' });
        }

        // Create the message data for ChatRoom model
        const senderType = req.user.role === 'admin' ? 'AdminUser' : 'StudentUser';
        
        const messageData = {
          senderId: req.user.id,
          senderType,
          content: req.body.content,
          type: 'text',
          createdAt: new Date()
        };

        console.log(`Adding message to chat room, sender type: ${senderType}`);
        
        // Add the message to the ChatRoom
        chatRoom.messages.push(messageData);
        chatRoom.lastActivity = new Date();
        await chatRoom.save();

        // Return the created message with populated sender
        const user = await User.findById(req.user.id).select('name avatar');
        
        return res.status(201).json({
          _id: chatRoom.messages[chatRoom.messages.length - 1]._id,
          content: messageData.content,
          sender: user,
          createdAt: messageData.createdAt,
          isEdited: false,
          isDeleted: false,
          isReply: false,
          replyTo: null
        });
      } else {
        // This is a regular Discussion model

        // Verify the user is a participant in the Discussion
      const participant = discussion.participants.find(
        p => p.userId.toString() === req.user.id
      );

      if (!participant) {
        return res.status(403).json({ message: 'Not authorized to post in this discussion' });
      }

      // Check if only admins can post (if set) and user is not admin/moderator
      if (
          discussion.settings && 
        discussion.settings.onlyAdminsCanPost &&
        !['admin', 'moderator'].includes(participant.role)
      ) {
        return res.status(403).json({ message: 'Only admins and moderators can post in this discussion' });
      }

        // Create message data for Discussion model
        const messageData = {
        senderId: req.user.id,
          content: req.body.content,
          readBy: [{ userId: req.user.id, readAt: new Date() }]
        };

        // Add reply information if provided
        if (req.body.replyTo && req.body.replyTo.messageId) {
          const replyToMsg = discussion.messages.id(req.body.replyTo.messageId);
          
          if (replyToMsg) {
            messageData.isReply = true;
            messageData.replyTo = {
              messageId: replyToMsg._id,
              content: replyToMsg.content.substring(0, 100),
              senderId: replyToMsg.senderId
          };
        }
      }

      // Add the message
        discussion.messages.push(messageData);
        discussion.lastActivity = new Date();
        discussion.messageCount = discussion.messages.length;
        await discussion.save();

        // Get the created message with populated sender
        const newMessage = discussion.messages[discussion.messages.length - 1];
      const populatedMessage = await Discussion.findOne(
          { _id: discussion._id, 'messages._id': newMessage._id },
        { 'messages.$': 1 }
      ).populate('messages.senderId', 'name avatar');

        // Format the result
        const result = populatedMessage.messages[0].toObject();
        result.sender = result.senderId;
        delete result.senderId;

        return res.status(201).json(result);
      }
    } catch (error) {
      console.error('Error posting message:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/student/discussions/:discussionId/messages/:messageId
// @desc    Delete a message from a discussion
// @access  Private
router.delete('/:discussionId/messages/:messageId', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Find the message
    const message = discussion.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender or has admin/moderator privileges
    const participant = discussion.participants.find(
      p => p.userId.toString() === req.user.id
    );

    const isSender = message.senderId.toString() === req.user.id;
    const hasPrivilege = participant && ['admin', 'moderator'].includes(participant.role);

    if (!isSender && !hasPrivilege) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Soft delete the message
    message.isDeleted = true;
    message.content = isSender ? "This message was deleted" : "This message was removed by an admin";
    
    await discussion.save();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student/discussions/course/:courseId
// @desc    Get all discussions for a specific course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const discussions = await Discussion.find({
      courseId: req.params.courseId,
      isActive: true,
      'participants.userId': req.user.id
    })
    .select('-messages')
    .sort({ lastActivity: -1 });

    res.json(discussions);
  } catch (error) {
    console.error('Error fetching course discussions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 