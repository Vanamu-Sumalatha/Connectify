const mongoose = require('mongoose');

const certificationTestSchema = new mongoose.Schema({
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
    duration: {
        type: Number, // in minutes
        required: true
    },
    passingScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    questions: [{
        type: {
            type: String,
            enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
            required: true
        },
        question: {
            type: String,
            required: true
        },
        options: [{
            text: String,
            isCorrect: Boolean
        }],
        correctAnswer: String,
        points: {
            type: Number,
            default: 1
        },
        explanation: String
    }],
    settings: {
        isRandomized: {
            type: Boolean,
            default: true
        },
        showResults: {
            type: Boolean,
            default: true
        },
        allowReview: {
            type: Boolean,
            default: true
        },
        timeLimit: {
            type: Boolean,
            default: true
        },
        requireProctoring: {
            type: Boolean,
            default: false
        }
    },
    attempts: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser',
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        answers: [{
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            answer: String,
            isCorrect: Boolean,
            pointsEarned: Number
        }],
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['in-progress', 'completed', 'abandoned'],
            required: true
        }
    }],
    certificates: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser',
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        issueDate: {
            type: Date,
            default: Date.now
        },
        expiryDate: Date,
        certificateId: {
            type: String,
            required: true,
            unique: true
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'revoked'],
            default: 'active'
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
certificationTestSchema.index({ courseId: 1 });
certificationTestSchema.index({ 'attempts.studentId': 1 });
certificationTestSchema.index({ 'certificates.studentId': 1 });

// Methods
certificationTestSchema.methods.addQuestion = async function(question) {
    this.questions.push(question);
    return this.save();
};

certificationTestSchema.methods.updateQuestion = async function(questionId, update) {
    const questionIndex = this.questions.findIndex(q => q._id.equals(questionId));
    if (questionIndex !== -1) {
        this.questions[questionIndex] = { ...this.questions[questionIndex], ...update };
        return this.save();
    }
    return this;
};

certificationTestSchema.methods.addAttempt = async function(attempt) {
    this.attempts.push(attempt);
    return this.save();
};

certificationTestSchema.methods.issueCertificate = async function(certificate) {
    this.certificates.push(certificate);
    return this.save();
};

// Static Methods
certificationTestSchema.statics.getTestByCourse = async function(courseId) {
    return this.find({ courseId, status: 'published' })
        .populate('courseId', 'title code');
};

certificationTestSchema.statics.getStudentAttempts = async function(studentId) {
    return this.find({ 'attempts.studentId': studentId })
        .select('attempts')
        .populate('attempts.studentId', 'firstName lastName');
};

certificationTestSchema.statics.getStudentCertificates = async function(studentId) {
    return this.find({ 'certificates.studentId': studentId })
        .select('certificates')
        .populate('certificates.studentId', 'firstName lastName');
};

const CertificationTest = mongoose.model('CertificationTest', certificationTestSchema);

module.exports = CertificationTest; 