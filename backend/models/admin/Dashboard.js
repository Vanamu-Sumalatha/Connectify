const mongoose = require('mongoose');

const adminDashboardSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true
    },
    overview: {
        totalStudents: {
            type: Number,
            default: 0
        },
        totalCourses: {
            type: Number,
            default: 0
        },
        activeCourses: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        },
        pendingApprovals: {
            type: Number,
            default: 0
        }
    },
    recentActivities: [{
        type: {
            type: String,
            enum: ['course', 'student', 'payment', 'approval', 'certificate'],
            required: true
        },
        action: {
            type: String,
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
    courseAnalytics: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        enrollmentCount: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        revenue: {
            type: Number,
            default: 0
        }
    }],
    studentAnalytics: {
        newStudents: {
            type: Number,
            default: 0
        },
        activeStudents: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        },
        averageProgress: {
            type: Number,
            default: 0
        }
    },
    revenueAnalytics: {
        totalRevenue: {
            type: Number,
            default: 0
        },
        monthlyRevenue: [{
            month: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                default: 0
            }
        }],
        topCourses: [{
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            },
            revenue: {
                type: Number,
                default: 0
            }
        }]
    },
    pendingTasks: [{
        type: {
            type: String,
            enum: ['course', 'student', 'certificate', 'payment'],
            required: true
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        action: {
            type: String,
            required: true
        },
        priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
        },
        dueDate: Date
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Methods
adminDashboardSchema.methods.addActivity = async function(activity) {
    this.recentActivities.unshift(activity);
    if (this.recentActivities.length > 10) {
        this.recentActivities.pop();
    }
    return this.save();
};

adminDashboardSchema.methods.updateCourseAnalytics = async function(courseId, analytics) {
    const courseIndex = this.courseAnalytics.findIndex(ca => ca.courseId.equals(courseId));
    if (courseIndex !== -1) {
        this.courseAnalytics[courseIndex] = { ...this.courseAnalytics[courseIndex], ...analytics };
    } else {
        this.courseAnalytics.push({ courseId, ...analytics });
    }
    return this.save();
};

adminDashboardSchema.methods.addPendingTask = async function(task) {
    this.pendingTasks.push(task);
    return this.save();
};

adminDashboardSchema.methods.completeTask = async function(taskId) {
    this.pendingTasks = this.pendingTasks.filter(task => !task._id.equals(taskId));
    return this.save();
};

// Static Methods
adminDashboardSchema.statics.getAdminDashboard = async function(adminId) {
    return this.findOne({ adminId })
        .populate('recentActivities.itemId')
        .populate('courseAnalytics.courseId')
        .populate('revenueAnalytics.topCourses.courseId')
        .populate('pendingTasks.itemId');
};

const AdminDashboard = mongoose.model('AdminDashboard', adminDashboardSchema);

module.exports = AdminDashboard; 