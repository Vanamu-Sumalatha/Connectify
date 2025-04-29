import Discussion from '../../models/Discussion.js';
import DiscussionParticipant from '../../models/DiscussionParticipant.js';
import DiscussionMessage from '../../models/DiscussionMessage.js';

// Get all discussions for a student
export const getDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find({
      $or: [
        { createdBy: req.user._id },
        { 'participants': req.user._id }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('participants', 'name email')
    .populate('course', 'name')
    .populate('studyGroup', 'name')
    .sort({ lastActivity: -1 });

    // Enhance the discussions with additional metadata
    const enhancedDiscussions = await Promise.all(discussions.map(async (discussion) => {
      const discussionObj = discussion.toObject();
      
      // Get participant count
      const participantCount = await DiscussionParticipant.countDocuments({ 
        discussion: discussion._id 
      });
      
      // Get message count
      const messageCount = await DiscussionMessage.countDocuments({ 
        discussion: discussion._id,
        isDeleted: { $ne: true }
      });
      
      // Get last message
      const lastMessage = await DiscussionMessage.findOne({ 
        discussion: discussion._id,
        isDeleted: { $ne: true }
      })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email');
      
      return {
        ...discussionObj,
        participantCount,
        messageCount,
        lastMessage: lastMessage ? {
          _id: lastMessage._id,
          content: lastMessage.content,
          sender: lastMessage.sender,
          createdAt: lastMessage.createdAt
        } : null,
        unreadCount: 0 // You can implement unread count logic here
      };
    }));

    res.json(enhancedDiscussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Error fetching discussions' });
  }
};

// Get messages for a specific discussion
export const getDiscussionMessages = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is a participant
    const isParticipant = await DiscussionParticipant.findOne({
      discussion: id,
      user: req.user._id
    });

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this discussion' });
    }

    // Get participant count
    const participantCount = await DiscussionParticipant.countDocuments({
      discussion: id
    });

    const messages = await DiscussionMessage.find({ discussion: id })
      .populate('sender', 'name email')
      .populate('replyTo')
      .sort({ createdAt: 1 });

    // Return messages along with metadata
    res.json({
      messages,
      metadata: {
        participantCount,
        messageCount: messages.filter(msg => !msg.isDeleted).length
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Send a message in a discussion
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, replyTo } = req.body;

    // Check if user is a participant
    const isParticipant = await DiscussionParticipant.findOne({
      discussion: id,
      user: req.user._id
    });

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this discussion' });
    }

    const message = new DiscussionMessage({
      discussion: id,
      sender: req.user._id,
      content,
      replyTo
    });

    await message.save();

    // Update discussion's last activity
    await Discussion.findByIdAndUpdate(id, {
      lastActivity: new Date()
    });

    const populatedMessage = await DiscussionMessage.findById(message._id)
      .populate('sender', 'name email')
      .populate('replyTo');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;

    const message = await DiscussionMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender or has admin rights
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await DiscussionMessage.findByIdAndUpdate(messageId, {
      isDeleted: true,
      content: 'This message has been deleted'
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
}; 