const mongoose = require('mongoose');

const studentNotificationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true
    },
    notifications: [{
        type: {
            type: String,
            enum: [
                'assignment',
                'quiz',
                'announcement',
                'message',
                'course',
                'study-group',
                'achievement',
                'system'
            ],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        data: {
            itemId: {
                type: mongoose.Schema.Types.ObjectId
            },
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            },
            assignmentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Assignment'
            },
            quizId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Quiz'
            },
            studyGroupId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'StudyGroup'
            }
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: Date,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        },
        types: {
            assignment: {
                type: Boolean,
                default: true
            },
            quiz: {
                type: Boolean,
                default: true
            },
            announcement: {
                type: Boolean,
                default: true
            },
            message: {
                type: Boolean,
                default: true
            },
            course: {
                type: Boolean,
                default: true
            },
            studyGroup: {
                type: Boolean,
                default: true
            },
            achievement: {
                type: Boolean,
                default: true
            },
            system: {
                type: Boolean,
                default: true
            }
        }
    },
    unreadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Method to add notification
studentNotificationSchema.methods.addNotification = async function(notificationData) {
    this.notifications.unshift(notificationData);
    if (this.notifications.length > 100) {
        this.notifications.pop();
    }
    this.unreadCount += 1;
    await this.save();
    return this.notifications[0];
};

// Method to mark notification as read
studentNotificationSchema.methods.markAsRead = async function(notificationId) {
    const notification = this.notifications.id(notificationId);
    if (notification && !notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        await this.save();
    }
    return notification;
};

// Method to mark all notifications as read
studentNotificationSchema.methods.markAllAsRead = async function() {
    this.notifications.forEach(notification => {
        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
        }
    });
    this.unreadCount = 0;
    await this.save();
    return this.notifications;
};

// Method to delete notification
studentNotificationSchema.methods.deleteNotification = async function(notificationId) {
    const notification = this.notifications.id(notificationId);
    if (notification) {
        if (!notification.isRead) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        notification.remove();
        await this.save();
    }
    return notification;
};

// Method to update notification settings
studentNotificationSchema.methods.updateSettings = async function(settings) {
    this.settings = {
        ...this.settings,
        ...settings
    };
    await this.save();
    return this.settings;
};

// Static method to get notifications for a student
studentNotificationSchema.statics.getStudentNotifications = async function(studentId) {
    return await this.findOne({ studentId })
        .populate('notifications.data.courseId')
        .populate('notifications.data.assignmentId')
        .populate('notifications.data.quizId')
        .populate('notifications.data.studyGroupId');
};

const StudentNotification = mongoose.model('StudentNotification', studentNotificationSchema);

module.exports = StudentNotification; 