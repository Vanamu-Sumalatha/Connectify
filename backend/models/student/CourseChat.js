import mongoose from 'mongoose';
const { Schema } = mongoose;

const CourseChatSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  name: {
    type: String,
    default: 'Course Chat'
  },
  description: {
    type: String,
    default: 'Chat room for course discussions'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for performance
CourseChatSchema.index({ courseId: 1 });
CourseChatSchema.index({ 'participants.userId': 1 });
CourseChatSchema.index({ 'messages.senderId': 1 });

// Automatically create a course chat when a new course is created
CourseChatSchema.statics.createForCourse = async function(courseId, courseName, createdBy) {
  const existingChat = await this.findOne({ courseId });
  
  if (existingChat) {
    return existingChat;
  }
  
  return this.create({
    courseId,
    name: `${courseName} Chat`,
    description: `Discussion group for students enrolled in ${courseName}`,
    createdBy
  });
};

// Find course chats for a specific student
CourseChatSchema.statics.findForStudent = async function(studentId) {
  return this.find({
    'participants.userId': studentId,
    isActive: true
  })
  .populate('courseId', 'name code image')
  .populate({
    path: 'messages',
    options: { 
      sort: { createdAt: -1 },
      limit: 1
    },
    populate: {
      path: 'senderId',
      select: 'name'
    }
  })
  .sort({ lastActivity: -1 });
};

const CourseChat = mongoose.model('CourseChat', CourseChatSchema);

export default CourseChat; 