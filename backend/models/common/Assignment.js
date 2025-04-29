import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    type: {
        type: String,
        enum: ['assignment', 'project', 'quiz', 'essay', 'presentation'],
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    points: {
        type: Number,
        required: true,
        default: 100
    },
    instructions: {
        type: String,
        required: true
    },
    resources: [{
        type: {
            type: String,
            enum: ['file', 'link', 'video'],
            required: true
        },
        title: String,
        url: String,
        description: String
    }],
    submissionFormat: {
        type: String,
        enum: ['text', 'file', 'both'],
        required: true
    },
    allowedFileTypes: [String],
    maxFileSize: {
        type: Number, // in MB
        default: 10
    },
    gradingCriteria: [{
        criterion: {
            type: String,
            required: true
        },
        points: {
            type: Number,
            required: true
        },
        description: String
    }],
    submissions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'submissions.userType'
        },
        userType: {
            type: String,
            required: true,
            enum: ['StudentUser', 'AdminUser']
        },
        content: String,
        files: [{
            name: String,
            url: String,
            size: Number,
            type: String
        }],
        submittedAt: {
            type: Date,
            default: Date.now
        },
        grade: {
            score: Number,
            feedback: String,
            gradedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AdminUser'
            },
            gradedAt: Date
        },
        status: {
            type: String,
            enum: ['submitted', 'graded', 'late', 'missing'],
            default: 'submitted'
        }
    }],
    settings: {
        allowLateSubmissions: {
            type: Boolean,
            default: false
        },
        latePenalty: {
            type: Number,
            default: 0
        },
        requirePlagiarismCheck: {
            type: Boolean,
            default: false
        },
        allowResubmission: {
            type: Boolean,
            default: false
        },
        maxResubmissions: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'grading', 'completed'],
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
assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ 'submissions.userId': 1 });
assignmentSchema.index({ createdBy: 1 });

// Methods
assignmentSchema.methods.addSubmission = async function(submission) {
    this.submissions.push(submission);
    return this.save();
};

assignmentSchema.methods.gradeSubmission = async function(submissionId, grade) {
    const submission = this.submissions.id(submissionId);
    if (submission) {
        submission.grade = grade;
        submission.status = 'graded';
        return this.save();
    }
    return this;
};

assignmentSchema.methods.updateSettings = async function(settings) {
    this.settings = { ...this.settings, ...settings };
    return this.save();
};

// Static Methods
assignmentSchema.statics.getAssignmentsByCourse = async function(courseId) {
    return this.find({ courseId })
        .populate('courseId', 'title code')
        .populate('createdBy', 'firstName lastName')
        .sort({ dueDate: 1 });
};

assignmentSchema.statics.getUserSubmissions = async function(userId, userType) {
    return this.find({ 'submissions.userId': userId, 'submissions.userType': userType })
        .select('submissions')
        .populate('submissions.userId', 'firstName lastName')
        .populate('submissions.grade.gradedBy', 'firstName lastName');
};

assignmentSchema.statics.getGradingQueue = async function() {
    return this.find({
        status: 'published',
        'submissions.status': 'submitted'
    })
    .populate('submissions.userId', 'firstName lastName')
    .sort({ dueDate: 1 });
};

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment; 