import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    avatar: {
        type: String,
        default: '/images/default-group.png'
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'moderator', 'participant'],
            default: 'participant'
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
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        mediaType: {
            type: String,
            enum: ['none', 'image', 'video', 'audio', 'document'],
            default: 'none'
        },
        mediaUrl: String,
        mediaName: String,
        mediaSize: Number,
        isReply: {
            type: Boolean,
            default: false
        },
        replyTo: {
            messageId: mongoose.Schema.Types.ObjectId,
            content: String,
            senderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        },
        readBy: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }],
        reactions: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            emoji: String
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
        allowMedia: {
            type: Boolean,
            default: true
        },
        maxMediaSize: {
            type: Number,
            default: 10 // MB
        },
        onlyAdminsCanPost: {
            type: Boolean,
            default: false
        },
        mutedUntil: {
            type: Date,
            default: null
        }
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    messageCount: {
        type: Number,
        default: 0
    },
    participantCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
discussionSchema.index({ 'participants.userId': 1 });
discussionSchema.index({ courseId: 1 });
discussionSchema.index({ lastActivity: -1 });

// Virtual to get unread messages count
discussionSchema.virtual('unreadCount').get(function() {
    // This will be implemented in the controller
    return 0;
});

// Add a participant to the discussion
discussionSchema.methods.addParticipant = async function(userId, role = 'participant') {
    if (!this.participants.some(p => p.userId.toString() === userId.toString())) {
        this.participants.push({
            userId,
            role,
            joinedAt: new Date(),
            lastSeen: new Date()
        });
        this.participantCount = this.participants.length;
        await this.save();
    }
    return this;
};

// Remove a participant from the discussion
discussionSchema.methods.removeParticipant = async function(userId) {
    this.participants = this.participants.filter(p => p.userId.toString() !== userId.toString());
    this.participantCount = this.participants.length;
    await this.save();
    return this;
};

// Add a message to the discussion
discussionSchema.methods.addMessage = async function(messageData) {
    this.messages.push(messageData);
    this.lastActivity = new Date();
    this.messageCount = this.messages.length;
    await this.save();
    
    // Return the newly added message
    return this.messages[this.messages.length - 1];
};

// Mark message as read by a user
discussionSchema.methods.markAsRead = async function(messageId, userId) {
    const message = this.messages.id(messageId);
    if (message && !message.readBy.some(r => r.userId.toString() === userId.toString())) {
        message.readBy.push({
            userId,
            readAt: new Date()
        });
        await this.save();
    }
    return message;
};

// Get all discussions for a user
discussionSchema.statics.getForUser = async function(userId) {
    console.log(`Getting discussions for user ${userId}`);
    
    // Get discussions from the Discussion model
    const discussions = await this.find({
        'participants.userId': userId,
        isActive: true
    })
    .select('-messages')
    .sort({ lastActivity: -1 });
    
    console.log(`Found ${discussions.length} discussions in Discussion model`);
    
    // Try to get admin-created chat rooms from the ChatRoom model
    try {
        const ChatRoom = mongoose.model('ChatRoom');
        
        // Try with both 'support' type and any others that might be relevant
        const adminChatRooms = await ChatRoom.find({
            $or: [
                { type: 'support' },
                { type: 'announcement' }
            ],
            status: { $ne: 'deleted' },
            'participants.userId': userId
        })
        .select('-messages')
        .sort({ lastActivity: -1 });
        
        console.log(`Found ${adminChatRooms.length} admin chat rooms`);
        
        if (adminChatRooms.length > 0) {
            console.log('Admin room types:', adminChatRooms.map(r => r.type).join(', '));
            console.log('First admin room:', {
                id: adminChatRooms[0]._id,
                name: adminChatRooms[0].name,
                participants: adminChatRooms[0].participants.length
            });
        }
        
        // Convert ChatRoom format to Discussion format for compatibility
        const convertedRooms = adminChatRooms.map(room => {
            // Extract basic information
            const discussionData = {
                _id: room._id,
                name: room.name,
                description: room.description,
                courseId: room.courseId,
                avatar: room.avatar || '/images/default-group.png',
                participants: room.participants.map(p => ({
                    userId: p.userId,
                    role: p.role === 'admin' ? 'admin' : p.role === 'moderator' ? 'moderator' : 'participant',
                    joinedAt: p.joinedAt,
                    lastSeen: p.lastSeen
                })),
                participantCount: room.participants.length,
                messageCount: room.messages ? room.messages.length : 0,
                lastActivity: room.lastActivity || room.updatedAt,
                isActive: room.status === 'active',
                isAdminRoom: true  // Flag to identify admin-created rooms
            };
            
            return discussionData;
        });
        
        const combinedRooms = [...discussions, ...convertedRooms];
        console.log(`Returning ${combinedRooms.length} total discussion rooms`);
        
        // Combine both types of discussions and sort by last activity
        return combinedRooms.sort(
            (a, b) => new Date(b.lastActivity || Date.now()) - new Date(a.lastActivity || Date.now())
        );
    } catch (error) {
        console.error('Error fetching admin chat rooms:', error);
        // If there's an error, just return the regular discussions
        return discussions;
    }
};

// Get discussions by course
discussionSchema.statics.getByCourse = async function(courseId) {
    return this.find({
        courseId,
        isActive: true
    })
    .select('-messages')
    .sort({ lastActivity: -1 });
};

// Create or find a default "Discussions" group
discussionSchema.statics.createDefaultGroup = async function() {
    // This function has been deprecated. Default discussions are now managed by administrators.
    console.log('Default discussion group creation is disabled - administrators should create discussion rooms.');
    
    // Look for an existing discussion with name "Discussions"
    const existingGroup = await this.findOne({ name: "Discussions", courseId: null });
    if (existingGroup) {
        return existingGroup;
    }
    
    // If no existing group, return null - don't create anything
    return null;
};

const Discussion = mongoose.model('Discussion', discussionSchema);

export default Discussion; 