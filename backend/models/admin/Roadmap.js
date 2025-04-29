const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['programming', 'design', 'business', 'language', 'other']
    },
    level: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    duration: {
        type: Number, // in weeks
        required: true
    },
    milestones: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        order: {
            type: Number,
            required: true
        },
        estimatedTime: {
            type: Number, // in hours
            required: true
        },
        resources: [{
            type: {
                type: String,
                enum: ['course', 'article', 'video', 'book', 'project'],
                required: true
            },
            title: String,
            url: String,
            description: String
        }],
        prerequisites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Milestone'
        }],
        skills: [{
            type: String,
            required: true
        }],
        projects: [{
            title: String,
            description: String,
            requirements: [String],
            difficulty: {
                type: String,
                enum: ['easy', 'medium', 'hard']
            }
        }],
        assessments: [{
            type: {
                type: String,
                enum: ['quiz', 'project', 'assignment'],
                required: true
            },
            title: String,
            description: String,
            passingScore: Number
        }]
    }],
    prerequisites: [{
        type: String,
        required: true
    }],
    targetAudience: [{
        type: String,
        required: true
    }],
    learningOutcomes: [{
        type: String,
        required: true
    }],
    tags: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
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
roadmapSchema.index({ title: 'text', description: 'text' });
roadmapSchema.index({ category: 1, level: 1 });
roadmapSchema.index({ createdBy: 1 });

// Methods
roadmapSchema.methods.addMilestone = async function(milestone) {
    this.milestones.push(milestone);
    return this.save();
};

roadmapSchema.methods.updateMilestone = async function(milestoneId, update) {
    const milestoneIndex = this.milestones.findIndex(m => m._id.equals(milestoneId));
    if (milestoneIndex !== -1) {
        this.milestones[milestoneIndex] = { ...this.milestones[milestoneIndex], ...update };
        return this.save();
    }
    return this;
};

roadmapSchema.methods.reorderMilestones = async function(newOrder) {
    this.milestones = newOrder.map(id => this.milestones.find(m => m._id.equals(id)));
    return this.save();
};

// Static Methods
roadmapSchema.statics.getRoadmapsByCategory = async function(category) {
    return this.find({ category, status: 'published' })
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 });
};

roadmapSchema.statics.getRoadmapsByLevel = async function(level) {
    return this.find({ level, status: 'published' })
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 });
};

roadmapSchema.statics.searchRoadmaps = async function(query) {
    return this.find({
        $text: { $search: query },
        status: 'published'
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ score: { $meta: 'textScore' } });
};

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap; 