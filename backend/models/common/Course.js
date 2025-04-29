import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['programming', 'design', 'data science', 'business', 'marketing', 'cloud', 'personal development', 'other']
    },
    level: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    duration: {
        type: Number, // in hours
        required: true,
        min: 0
    },
    thumbnail: {
        type: String,
        required: true
    },
    requirements: [{
        type: String,
        trim: true
    }],
    objectives: [{
        type: String,
        trim: true
    }],
    learningOutcomes: [{
        type: String,
        required: true,
        trim: true
    }],
    lessons: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        videoUrl: {
            type: String,
            trim: true
        },
        duration: {
            type: Number,
            default: 0
        },
        description: {
            type: String,
            trim: true
        },
        materials: [{
            title: {
                type: String,
                required: true,
                trim: true
            },
            type: {
                type: String,
                enum: ['document', 'video', 'roadmap'],
                required: true
            },
            url: {
                type: String,
                trim: true
            },
            description: {
                type: String,
                trim: true
            }
        }]
    }],
    materials: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['document', 'video', 'roadmap'],
            required: true
        },
        documentUrl: {
            type: String,
            trim: true
        },
        videoUrl: {
            type: String,
            trim: true
        },
        roadmapContent: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        }
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    enrollmentCount: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    reviews: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    tags: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor: 1, status: 1 });

// Methods
courseSchema.methods.addReview = async function(review) {
    this.reviews.push(review);
    this.averageRating = this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length;
    return this.save();
};

courseSchema.methods.updateEnrollmentCount = async function(increment = true) {
    this.enrollmentCount += increment ? 1 : -1;
    return this.save();
};

// Static Methods
courseSchema.statics.getPublishedCourses = async function() {
    return this.find({ status: 'published' })
        .sort({ createdAt: -1 });
};

courseSchema.statics.searchCourses = async function(query) {
    return this.find({
        $text: { $search: query },
        status: 'published'
    })
    .sort({ score: { $meta: 'textScore' } });
};

const Course = mongoose.model('Course', courseSchema);
export default Course; 