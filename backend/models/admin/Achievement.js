const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['course', 'skill', 'milestone', 'community', 'special'],
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['academic', 'technical', 'social', 'leadership', 'other']
    },
    icon: {
        type: String,
        required: true
    },
    criteria: {
        type: {
            type: String,
            enum: ['completion', 'score', 'participation', 'time', 'custom'],
            required: true
        },
        target: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: ['percentage', 'points', 'hours', 'days', 'count'],
            required: true
        }
    },
    rewards: {
        points: {
            type: Number,
            default: 0
        },
        badge: {
            type: String,
            required: true
        },
        certificate: {
            type: Boolean,
            default: false
        },
        specialPrivileges: [{
            type: String,
            enum: ['early-access', 'exclusive-content', 'mentorship', 'recognition']
        }]
    },
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement'
    }],
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
    },
    earnedBy: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser',
            required: true
        },
        earnedAt: {
            type: Date,
            default: Date.now
        },
        progress: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['in-progress', 'completed'],
            default: 'in-progress'
        }
    }],
    visibility: {
        type: String,
        enum: ['public', 'private', 'course-specific'],
        default: 'public'
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
achievementSchema.index({ title: 'text', description: 'text' });
achievementSchema.index({ type: 1, category: 1 });
achievementSchema.index({ 'earnedBy.studentId': 1 });
achievementSchema.index({ createdBy: 1 });

// Methods
achievementSchema.methods.addEarner = async function(studentId) {
    if (!this.earnedBy.some(e => e.studentId.equals(studentId))) {
        this.earnedBy.push({
            studentId,
            earnedAt: Date.now(),
            status: 'completed'
        });
        return this.save();
    }
    return this;
};

achievementSchema.methods.updateProgress = async function(studentId, progress) {
    const earnerIndex = this.earnedBy.findIndex(e => e.studentId.equals(studentId));
    if (earnerIndex !== -1) {
        this.earnedBy[earnerIndex].progress = progress;
        if (progress >= this.criteria.target) {
            this.earnedBy[earnerIndex].status = 'completed';
        }
        return this.save();
    }
    return this;
};

// Static Methods
achievementSchema.statics.getAchievementsByType = async function(type) {
    return this.find({ type, status: 'active' })
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 });
};

achievementSchema.statics.getStudentAchievements = async function(studentId) {
    return this.find({ 'earnedBy.studentId': studentId })
        .populate('earnedBy.studentId', 'firstName lastName')
        .sort({ 'earnedBy.earnedAt': -1 });
};

achievementSchema.statics.getCourseAchievements = async function(courseId) {
    return this.find({ courseId, status: 'active' })
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 });
};

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement; 