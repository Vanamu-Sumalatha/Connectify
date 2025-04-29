import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['course', 'support', 'announcement', 'private', 'study-group', 'discussions'],
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
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'participants.userType'
        },
        userType: {
            type: String,
            required: true,
            enum: ['StudentUser', 'AdminUser']
        },
        role: {
            type: String,
            enum: ['admin', 'moderator', 'member', 'support'],
            default: 'member'
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
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'messages.senderType'
        },
        senderType: {
            type: String,
            required: true,
            enum: ['StudentUser', 'AdminUser']
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['text', 'file', 'link', 'announcement'],
            default: 'text'
        },
        fileUrl: String,
        metadata: {
            fileName: String,
            fileSize: Number,
            fileType: String
        },
        isPinned: {
            type: Boolean,
            default: false
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
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
        messageRetention: {
            type: String,
            enum: ['forever', '30days', '7days', '24hours'],
            default: 'forever'
        },
        allowedRoles: [{
            type: String,
            enum: ['admin', 'moderator', 'member', 'support']
        }]
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

// Indexes
chatRoomSchema.index({ courseId: 1 });
chatRoomSchema.index({ studyGroupId: 1 });
chatRoomSchema.index({ 'participants.userId': 1 });
chatRoomSchema.index({ lastActivity: -1 });

// Methods
chatRoomSchema.methods.addParticipant = async function(userId, userType, role = 'member') {
    if (!this.participants.some(p => p.userId.equals(userId))) {
        this.participants.push({
            userId,
            userType,
            role,
            joinedAt: Date.now(),
            lastSeen: Date.now()
        });
        return this.save();
    }
    return this;
};

chatRoomSchema.methods.removeParticipant = async function(userId) {
    this.participants = this.participants.filter(p => !p.userId.equals(userId));
    return this.save();
};

chatRoomSchema.methods.addMessage = async function(message) {
    this.messages.push(message);
    this.lastActivity = Date.now();
    return this.save();
};

chatRoomSchema.methods.pinMessage = async function(messageId) {
    const message = this.messages.id(messageId);
    if (message) {
        message.isPinned = true;
        return this.save();
    }
    return this;
};

chatRoomSchema.methods.unpinMessage = async function(messageId) {
    const message = this.messages.id(messageId);
    if (message) {
        message.isPinned = false;
        return this.save();
    }
    return this;
};

// Static Methods
chatRoomSchema.statics.getUserChatRooms = async function(userId, userType) {
    return this.find({
        'participants.userId': userId,
        'participants.userType': userType,
        status: 'active'
    })
    .populate('participants.userId', 'firstName lastName avatar')
    .populate('courseId', 'title code')
    .populate('studyGroupId', 'name')
    .sort({ lastActivity: -1 });
};

chatRoomSchema.statics.getChatRoomById = async function(roomId, userId, userType) {
    return this.findOne({
        _id: roomId,
        'participants.userId': userId,
        'participants.userType': userType,
        status: 'active'
    })
    .populate('participants.userId', 'firstName lastName avatar')
    .populate('courseId', 'title code')
    .populate('studyGroupId', 'name')
    .populate('messages.senderId', 'firstName lastName avatar');
};

chatRoomSchema.statics.createDefaultRooms = async function() {
    const defaultRooms = [
        {
            name: 'General Discussion',
            description: 'A place for general discussions and announcements',
            type: 'support',
            settings: {
                isPrivate: false,
                allowFileSharing: true,
                messageRetention: 'forever',
                allowedRoles: ['admin', 'moderator', 'member', 'support']
            }
        },
        {
            name: 'Technical Support',
            description: 'Get help with technical issues and questions',
            type: 'support',
            settings: {
                isPrivate: false,
                allowFileSharing: true,
                messageRetention: 'forever',
                allowedRoles: ['admin', 'moderator', 'member', 'support']
            }
        }
    ];

    for (const room of defaultRooms) {
        const existingRoom = await this.findOne({ name: room.name });
        if (!existingRoom) {
            await this.create(room);
        }
    }
};

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom; 