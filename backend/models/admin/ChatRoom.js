const mongoose = require('mongoose');

const adminChatRoomSchema = new mongoose.Schema({
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
        enum: ['course', 'support', 'announcement', 'private'],
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    participants: [{
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AdminUser',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'moderator', 'support'],
            default: 'admin'
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
            ref: 'AdminUser',
            required: true
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
            enum: ['admin', 'moderator', 'support']
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
adminChatRoomSchema.index({ courseId: 1 });
adminChatRoomSchema.index({ 'participants.adminId': 1 });
adminChatRoomSchema.index({ lastActivity: -1 });

// Methods
adminChatRoomSchema.methods.addParticipant = async function(adminId, role = 'admin') {
    if (!this.participants.some(p => p.adminId.equals(adminId))) {
        this.participants.push({
            adminId,
            role,
            joinedAt: Date.now(),
            lastSeen: Date.now()
        });
        return this.save();
    }
    return this;
};

adminChatRoomSchema.methods.removeParticipant = async function(adminId) {
    this.participants = this.participants.filter(p => !p.adminId.equals(adminId));
    return this.save();
};

adminChatRoomSchema.methods.addMessage = async function(message) {
    this.messages.push(message);
    this.lastActivity = Date.now();
    return this.save();
};

adminChatRoomSchema.methods.pinMessage = async function(messageId) {
    const message = this.messages.id(messageId);
    if (message) {
        message.isPinned = true;
        return this.save();
    }
    return this;
};

adminChatRoomSchema.methods.unpinMessage = async function(messageId) {
    const message = this.messages.id(messageId);
    if (message) {
        message.isPinned = false;
        return this.save();
    }
    return this;
};

// Static Methods
adminChatRoomSchema.statics.getAdminChatRooms = async function(adminId) {
    return this.find({
        'participants.adminId': adminId,
        status: 'active'
    })
    .populate('participants.adminId', 'firstName lastName avatar')
    .populate('courseId', 'title code')
    .sort({ lastActivity: -1 });
};

adminChatRoomSchema.statics.getChatRoomById = async function(roomId, adminId) {
    return this.findOne({
        _id: roomId,
        'participants.adminId': adminId,
        status: 'active'
    })
    .populate('participants.adminId', 'firstName lastName avatar')
    .populate('courseId', 'title code')
    .populate('messages.senderId', 'firstName lastName avatar');
};

const AdminChatRoom = mongoose.model('AdminChatRoom', adminChatRoomSchema);

module.exports = AdminChatRoom; 