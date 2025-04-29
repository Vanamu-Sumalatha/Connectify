const mongoose = require('mongoose');

const studentStudyGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser',
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
    schedule: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        },
        location: String,
        isOnline: {
            type: Boolean,
            default: false
        },
        meetingLink: String
    }],
    resources: [{
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['document', 'link', 'file'],
            required: true
        },
        url: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        tags: [String]
    }],
    discussions: [{
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser',
            required: true
        },
        comments: [{
            content: String,
            authorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'StudentUser'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
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
        maxMembers: {
            type: Number,
            default: 10
        },
        allowMemberInvites: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: false
        }
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to add member
studentStudyGroupSchema.methods.addMember = async function(userId, role = 'member') {
    if (this.members.length >= this.settings.maxMembers) {
        throw new Error('Group is full');
    }
    if (!this.members.some(member => member.userId.toString() === userId.toString())) {
        this.members.push({ userId, role });
        await this.save();
    }
    return this.members;
};

// Method to remove member
studentStudyGroupSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(member => member.userId.toString() !== userId.toString());
    await this.save();
    return this.members;
};

// Method to add resource
studentStudyGroupSchema.methods.addResource = async function(resourceData) {
    this.resources.push(resourceData);
    this.lastActivity = new Date();
    await this.save();
    return this.resources[this.resources.length - 1];
};

// Method to add discussion
studentStudyGroupSchema.methods.addDiscussion = async function(discussionData) {
    this.discussions.push(discussionData);
    this.lastActivity = new Date();
    await this.save();
    return this.discussions[this.discussions.length - 1];
};

// Method to add comment to discussion
studentStudyGroupSchema.methods.addComment = async function(discussionId, commentData) {
    const discussion = this.discussions.id(discussionId);
    if (discussion) {
        discussion.comments.push(commentData);
        this.lastActivity = new Date();
        await this.save();
    }
    return discussion;
};

// Static method to get study groups for a user
studentStudyGroupSchema.statics.getUserStudyGroups = async function(userId) {
    return await this.find({
        'members.userId': userId,
        status: 'active'
    })
    .populate('members.userId')
    .sort({ lastActivity: -1 });
};

// Static method to get study group by ID
studentStudyGroupSchema.statics.getStudyGroupById = async function(groupId) {
    return await this.findById(groupId)
        .populate('members.userId')
        .populate('discussions.authorId')
        .populate('discussions.comments.authorId');
};

const StudentStudyGroup = mongoose.model('StudentStudyGroup', studentStudyGroupSchema);

module.exports = StudentStudyGroup; 