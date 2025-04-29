import mongoose from 'mongoose';

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
        default: 'practice'
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },
    passingScore: {
        type: Number,
        default: 70,
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
            default: 'multiple-choice'
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
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'attempts.userType'
        },
        userType: {
            type: String,
            required: true,
            enum: ['StudentUser', 'AdminUser']
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
        default: 'published'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: false
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
quizSchema.index({ 'attempts.userId': 1 });
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

// Add a pre-save middleware to ensure createdBy is set
quizSchema.pre('save', function(next) {
    // If createdBy is not set and we have a user in the request context
    if (!this.createdBy && this._user) {
        this.createdBy = this._user._id;
    }
    next();
});

// Add a static method to find quizzes with proper population (SIMPLIFIED FOR DEBUGGING)
quizSchema.statics.findWithPopulatedFields = async function(query = {}) {
    console.log("[Quiz.findWithPopulatedFields] Finding quizzes with query:", query);
    try {
        // SIMPLIFIED: Only populate courseId for now
        const quizzes = await this.find(query)
            .populate('courseId', 'title') 
            // .populate('createdBy', adminUserFields) // Temporarily removed for debugging
            .sort({ createdAt: -1 })
            .lean(); // Use lean for potentially better performance/simpler objects
            
        console.log(`[Quiz.findWithPopulatedFields] Found ${quizzes.length} quizzes.`);
        return quizzes;
    } catch (error) {
        console.error("[Quiz.findWithPopulatedFields] Error during find/populate:", error);
        throw error; // Re-throw the error to be caught by the route handler
    }
};

// Add a static method to find a quiz by ID with proper population (SIMPLIFIED FOR DEBUGGING)
quizSchema.statics.findByIdWithPopulatedFields = async function(id) {
    console.log(`[Quiz.findByIdWithPopulatedFields] Finding quiz by ID: ${id}`);
    try {
        // SIMPLIFIED: Only populate courseId for now
        const quiz = await this.findById(id)
            .populate('courseId', 'title')
            // .populate('createdBy', adminUserFields); // Temporarily removed for debugging
            .lean(); 

        if (quiz) {
            console.log(`[Quiz.findByIdWithPopulatedFields] Found quiz: ${quiz.title}`);
        } else {
            console.log(`[Quiz.findByIdWithPopulatedFields] Quiz with ID ${id} not found.`);
        }
        return quiz;
    } catch (error) {
        console.error(`[Quiz.findByIdWithPopulatedFields] Error finding quiz by ID ${id}:`, error);
        throw error; // Re-throw the error
    }
};

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz; 