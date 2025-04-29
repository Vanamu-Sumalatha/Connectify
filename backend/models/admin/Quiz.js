const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
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
        enum: ['practice', 'assessment', 'certification'],
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
        explanation: String,
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        tags: [String]
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
        },
        shuffleQuestions: {
            type: Boolean,
            default: true
        },
        shuffleOptions: {
            type: Boolean,
            default: true
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
    analytics: {
        totalAttempts: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        },
        questionStats: [{
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            correctCount: {
                type: Number,
                default: 0
            },
            incorrectCount: {
                type: Number,
                default: 0
            },
            averageTime: {
                type: Number,
                default: 0
            }
        }]
    },
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
quizSchema.index({ courseId: 1 });
quizSchema.index({ 'attempts.studentId': 1 });
quizSchema.index({ createdBy: 1 });

// Methods
quizSchema.methods.addQuestion = async function(question) {
    this.questions.push(question);
    return this.save();
};

quizSchema.methods.updateQuestion = async function(questionId, update) {
    const questionIndex = this.questions.findIndex(q => q._id.equals(questionId));
    if (questionIndex !== -1) {
        this.questions[questionIndex] = { ...this.questions[questionIndex], ...update };
        return this.save();
    }
    return this;
};

quizSchema.methods.addAttempt = async function(attempt) {
    this.attempts.push(attempt);
    this.analytics.totalAttempts += 1;
    
    // Update question statistics
    attempt.answers.forEach(answer => {
        const questionStat = this.analytics.questionStats.find(q => q.questionId.equals(answer.questionId));
        if (questionStat) {
            if (answer.isCorrect) {
                questionStat.correctCount += 1;
            } else {
                questionStat.incorrectCount += 1;
            }
        }
    });

    // Update average score
    this.analytics.averageScore = 
        (this.analytics.averageScore * (this.analytics.totalAttempts - 1) + attempt.score) / 
        this.analytics.totalAttempts;

    return this.save();
};

// Static Methods
quizSchema.statics.getQuizzesByCourse = async function(courseId) {
    return this.find({ courseId })
        .populate('courseId', 'title code')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 });
};

quizSchema.statics.getStudentAttempts = async function(studentId) {
    return this.find({ 'attempts.studentId': studentId })
        .select('attempts')
        .populate('attempts.studentId', 'firstName lastName')
        .sort({ 'attempts.startTime': -1 });
};

quizSchema.statics.getQuizAnalytics = async function(quizId) {
    return this.findById(quizId)
        .select('analytics')
        .populate('questions');
};

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz; 