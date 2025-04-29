const mongoose = require('mongoose');

const studentAssignmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true
    },
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'submitted', 'graded', 'late'],
        default: 'not-started'
    },
    submission: {
        content: String,
        attachments: [{
            type: {
                type: String,
                enum: ['file', 'link', 'image'],
                required: true
            },
            url: String,
            name: String,
            size: Number
        }],
        submittedAt: Date,
        lastModified: Date
    },
    grade: {
        score: {
            type: Number,
            min: 0
        },
        maxScore: {
            type: Number,
            required: true
        },
        feedback: String,
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        gradedAt: Date
    },
    attempts: [{
        content: String,
        attachments: [{
            type: {
                type: String,
                enum: ['file', 'link', 'image'],
                required: true
            },
            url: String,
            name: String,
            size: Number
        }],
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }],
    dueDate: {
        type: Date,
        required: true
    },
    extension: {
        requested: {
            type: Boolean,
            default: false
        },
        approved: {
            type: Boolean,
            default: false
        },
        newDueDate: Date,
        reason: String
    },
    notes: [{
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    plagiarismCheck: {
        score: Number,
        report: String,
        checkedAt: Date
    },
    peerReview: [{
        reviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentUser'
        },
        score: Number,
        feedback: String,
        submittedAt: Date
    }]
}, {
    timestamps: true
});

// Method to submit assignment
studentAssignmentSchema.methods.submit = async function(submissionData) {
    this.submission = {
        ...submissionData,
        submittedAt: new Date(),
        lastModified: new Date()
    };
    this.status = 'submitted';
    this.attempts.push({
        content: submissionData.content,
        attachments: submissionData.attachments,
        submittedAt: new Date()
    });
    await this.save();
    return this.submission;
};

// Method to request extension
studentAssignmentSchema.methods.requestExtension = async function(extensionData) {
    this.extension = {
        ...extensionData,
        requested: true,
        approved: false
    };
    await this.save();
    return this.extension;
};

// Method to add note
studentAssignmentSchema.methods.addNote = async function(noteContent) {
    this.notes.push({
        content: noteContent,
        createdAt: new Date()
    });
    await this.save();
    return this.notes[this.notes.length - 1];
};

// Method to update status
studentAssignmentSchema.methods.updateStatus = async function(newStatus) {
    this.status = newStatus;
    await this.save();
    return this.status;
};

// Static method to get assignments for a student
studentAssignmentSchema.statics.getStudentAssignments = async function(studentId) {
    return await this.find({ studentId })
        .populate('assignmentId')
        .populate('courseId')
        .sort({ dueDate: 1 });
};

// Static method to get assignment by ID
studentAssignmentSchema.statics.getAssignmentById = async function(assignmentId) {
    return await this.findById(assignmentId)
        .populate('assignmentId')
        .populate('courseId')
        .populate('grade.gradedBy')
        .populate('peerReview.reviewerId');
};

const StudentAssignment = mongoose.model('StudentAssignment', studentAssignmentSchema);

module.exports = StudentAssignment; 