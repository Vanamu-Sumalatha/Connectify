import mongoose from 'mongoose';

const studentChatRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        enum: ['course', 'study-group', 'general'],
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    studyGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyGroup'
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'moderator', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    messages: [{
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true
        },
        attachments: [{
            type: {
                type: String,
                enum: ['file', 'image', 'link'],
                required: true
            },
            url: String,
            name: String,
            size: Number
        }],
        reactions: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            type: {
                type: String,
                enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
                required: true
            }
        }],
        isEdited: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        isPrivate: {
            type: Boolean,
            default: false
        },
        allowFileSharing: {
            type: Boolean,
            default: true
        },
        maxFileSize: {
            type: Number,
            default: 10 // in MB
        },
        allowedFileTypes: [String]
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Method to add member
studentChatRoomSchema.methods.addMember = async function(userId, role = 'member') {
    if (!this.members.some(member => member.userId.toString() === userId.toString())) {
        this.members.push({ userId, role });
        await this.save();
    }
    return this.members;
};

// Method to remove member
studentChatRoomSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(member => member.userId.toString() !== userId.toString());
    await this.save();
    return this.members;
};

// Method to add message
studentChatRoomSchema.methods.addMessage = async function(messageData) {
    this.messages.push(messageData);
    this.lastActivity = new Date();
    await this.save();
    return this.messages[this.messages.length - 1];
};

// Method to edit message
studentChatRoomSchema.methods.editMessage = async function(messageId, newContent) {
    const message = this.messages.id(messageId);
    if (message) {
        message.content = newContent;
        message.isEdited = true;
        await this.save();
    }
    return message;
};

// Method to delete message
studentChatRoomSchema.methods.deleteMessage = async function(messageId) {
    const message = this.messages.id(messageId);
    if (message) {
        message.isDeleted = true;
        await this.save();
    }
    return message;
};

// Static method to get chat rooms for a user
studentChatRoomSchema.statics.getUserChatRooms = async function(userId) {
    return await this.find({
        'members.userId': userId,
        status: 'active'
    })
    .populate('members.userId')
    .sort({ lastActivity: -1 });
};

// Static method to get chat room by ID
studentChatRoomSchema.statics.getChatRoomById = async function(roomId) {
    return await this.findById(roomId)
        .populate('members.userId')
        .populate('messages.senderId');
};

const ChatRoom = mongoose.model('ChatRoom', studentChatRoomSchema);

export default ChatRoom; 