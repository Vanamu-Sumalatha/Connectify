const mongoose = require('mongoose');

const studentDashboardSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    recentCourses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        progress: {
            type: Number,
            default: 0
        },
        lastAccessed: {
            type: Date,
            default: Date.now
        }
    }],
    upcomingAssignments: [{
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment'
        },
        dueDate: Date,
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed'],
            default: 'pending'
        }
    }],
    recentActivities: [{
        type: {
            type: String,
            enum: ['course', 'assignment', 'quiz', 'chat', 'study-group'],
            required: true
        },
        activityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        description: String
    }],
    performanceMetrics: {
        overallProgress: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        completedCourses: {
            type: Number,
            default: 0
        },
        activeCourses: {
            type: Number,
            default: 0
        }
    },
    notifications: [{
        type: {
            type: String,
            enum: ['assignment', 'quiz', 'announcement', 'message'],
            required: true
        },
        message: String,
        isRead: {
            type: Boolean,
            default: false
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Static method to get dashboard by student ID
studentDashboardSchema.statics.getDashboardByStudentId = async function(studentId) {
    return await this.findOne({ studentId })
        .populate('recentCourses.courseId')
        .populate('upcomingAssignments.assignmentId');
};

// Method to update recent activities
studentDashboardSchema.methods.addActivity = async function(activity) {
    this.recentActivities.unshift(activity);
    if (this.recentActivities.length > 10) {
        this.recentActivities.pop();
    }
    await this.save();
};

// Method to update performance metrics
studentDashboardSchema.methods.updateMetrics = async function() {
    const completedCourses = this.recentCourses.filter(course => course.progress === 100).length;
    const activeCourses = this.recentCourses.length;
    const totalProgress = this.recentCourses.reduce((sum, course) => sum + course.progress, 0);
    
    this.performanceMetrics = {
        overallProgress: activeCourses > 0 ? totalProgress / activeCourses : 0,
        completedCourses,
        activeCourses
    };
    
    await this.save();
};

const StudentDashboard = mongoose.model('StudentDashboard', studentDashboardSchema);

module.exports = StudentDashboard; 