import mongoose from 'mongoose';

const studentCourseSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed', 'dropped'],
        default: 'not-started'
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    // New fields for tracking
    startDate: {
        type: Date
    },
    estimatedCompletionDate: {
        type: Date
    },
    actualCompletionDate: {
        type: Date
    },
    timeSpent: {
        type: Number,
        default: 0 // in minutes
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    // Existing fields
    grades: [{
        assessmentType: {
            type: String,
            enum: ['assignment', 'quiz', 'exam', 'project'],
            required: true
        },
        assessmentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        maxScore: {
            type: Number,
            required: true
        },
        feedback: String,
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: [{
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        tags: [String]
    }],
    bookmarks: [{
        type: {
            type: String,
            enum: ['lecture', 'resource', 'assignment'],
            required: true
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    completionDate: Date,
    certificates: [{
        certificateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Certificate'
        },
        issueDate: Date,
        expiryDate: Date
    }]
}, {
    timestamps: true
});

// Method to update progress
studentCourseSchema.methods.updateProgress = async function(newProgress) {
    this.progress = Math.min(100, Math.max(0, newProgress));
    this.lastActivity = new Date();
    
    // Update status based on progress
    if (this.progress === 0) {
        this.status = 'not-started';
    } else if (this.progress === 100) {
        this.status = 'completed';
        this.actualCompletionDate = new Date();
    } else {
        this.status = 'in-progress';
    }
    
    await this.save();
};

// Method to start course
studentCourseSchema.methods.startCourse = async function() {
    if (this.status === 'not-started') {
        this.status = 'in-progress';
        this.startDate = new Date();
        await this.save();
    }
};

// Method to update time spent
studentCourseSchema.methods.updateTimeSpent = async function(minutes) {
    this.timeSpent += minutes;
    this.lastActivity = new Date();
    await this.save();
};

// Method to add grade
studentCourseSchema.methods.addGrade = async function(gradeData) {
    this.grades.push(gradeData);
    await this.save();
    return this.grades;
};

// Method to add note
studentCourseSchema.methods.addNote = async function(noteData) {
    this.notes.push(noteData);
    await this.save();
    return this.notes;
};

// Method to add bookmark
studentCourseSchema.methods.addBookmark = async function(bookmarkData) {
    this.bookmarks.push(bookmarkData);
    await this.save();
    return this.bookmarks;
};

// Static method to get all courses for a student
studentCourseSchema.statics.getStudentCourses = async function(studentId) {
    return await this.find({ studentId })
        .populate('courseId')
        .sort({ lastAccessed: -1 });
};

// Static method to get course progress
studentCourseSchema.statics.getCourseProgress = async function(studentId, courseId) {
    const course = await this.findOne({ studentId, courseId });
    return course ? course.progress : 0;
};

// Create compound index for studentId and courseId
studentCourseSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const StudentCourse = mongoose.model('StudentCourse', studentCourseSchema);
export default StudentCourse; 