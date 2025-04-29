import mongoose from 'mongoose';

const studentQuizSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed', 'expired'],
        default: 'not-started'
    },
    startTime: Date,
    endTime: Date,
    timeSpent: {
        type: Number,
        default: 0 // in seconds
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        selectedOptions: [String],
        textAnswer: String,
        isCorrect: Boolean,
        pointsEarned: Number
    }],
    score: {
        total: {
            type: Number,
            default: 0
        },
        maxScore: {
            type: Number,
            required: true
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    attempts: [{
        answers: [{
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            selectedOptions: [String],
            textAnswer: String,
            isCorrect: Boolean,
            pointsEarned: Number
        }],
        score: {
            total: Number,
            maxScore: Number,
            percentage: Number
        },
        startTime: Date,
        endTime: Date,
        timeSpent: Number
    }],
    feedback: {
        general: String,
        questionFeedback: [{
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            feedback: String
        }]
    },
    settings: {
        allowReview: {
            type: Boolean,
            default: true
        },
        showCorrectAnswers: {
            type: Boolean,
            default: true
        },
        timeLimit: {
            type: Number, // in minutes
            required: true
        },
        maxAttempts: {
            type: Number,
            default: 1
        }
    },
    isPassed: {
        type: Boolean,
        default: false
    },
    passThreshold: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Method to start quiz
studentQuizSchema.methods.startQuiz = async function() {
    if (this.status !== 'not-started') {
        throw new Error('Quiz already started or completed');
    }
    this.status = 'in-progress';
    this.startTime = new Date();
    await this.save();
    return this;
};

// Method to submit answer
studentQuizSchema.methods.submitAnswer = async function(answerData) {
    if (this.status !== 'in-progress') {
        throw new Error('Quiz is not in progress');
    }
    this.answers.push(answerData);
    await this.save();
    return this.answers[this.answers.length - 1];
};

// Method to complete quiz
studentQuizSchema.methods.completeQuiz = async function() {
    if (this.status !== 'in-progress') {
        throw new Error('Quiz is not in progress');
    }
    this.status = 'completed';
    this.endTime = new Date();
    this.timeSpent = Math.floor((this.endTime - this.startTime) / 1000);
    
    // Calculate score
    const totalScore = this.answers.reduce((sum, answer) => sum + (answer.pointsEarned || 0), 0);
    this.score = {
        total: totalScore,
        maxScore: this.score.maxScore,
        percentage: (totalScore / this.score.maxScore) * 100
    };
    
    this.isPassed = this.score.percentage >= this.passThreshold;
    
    // Save attempt
    this.attempts.push({
        answers: this.answers,
        score: this.score,
        startTime: this.startTime,
        endTime: this.endTime,
        timeSpent: this.timeSpent
    });
    
    await this.save();
    return this;
};

// Method to get current attempt
studentQuizSchema.methods.getCurrentAttempt = function() {
    return {
        answers: this.answers,
        startTime: this.startTime,
        timeSpent: this.timeSpent
    };
};

// Static method to get quizzes for a student
studentQuizSchema.statics.getStudentQuizzes = async function(studentId) {
    return await this.find({ studentId })
        .populate('quizId')
        .populate('courseId')
        .sort({ createdAt: -1 });
};

// Static method to get quiz by ID
studentQuizSchema.statics.getQuizById = async function(quizId) {
    return await this.findById(quizId)
        .populate('quizId')
        .populate('courseId');
};

const StudentQuiz = mongoose.model('StudentQuiz', studentQuizSchema);
export default StudentQuiz; 