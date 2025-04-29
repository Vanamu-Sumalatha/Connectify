const mongoose = require('mongoose');

const studentSettingsSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true,
        unique: true
    },
    profile: {
        visibility: {
            type: String,
            enum: ['public', 'private', 'connections-only'],
            default: 'public'
        },
        showEmail: {
            type: Boolean,
            default: false
        },
        showPhone: {
            type: Boolean,
            default: false
        },
        showSocialMedia: {
            type: Boolean,
            default: true
        }
    },
    notifications: {
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
            }
        },
        frequency: {
            type: String,
            enum: ['immediate', 'daily', 'weekly'],
            default: 'immediate'
        }
    },
    display: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'light'
        },
        fontSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium'
        },
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    privacy: {
        showOnlineStatus: {
            type: Boolean,
            default: true
        },
        showLastSeen: {
            type: Boolean,
            default: true
        },
        showActivityStatus: {
            type: Boolean,
            default: true
        },
        allowFriendRequests: {
            type: Boolean,
            default: true
        },
        allowMessages: {
            type: Boolean,
            default: true
        }
    },
    security: {
        twoFactorAuth: {
            type: Boolean,
            default: false
        },
        loginAlerts: {
            type: Boolean,
            default: true
        },
        sessionTimeout: {
            type: Number,
            default: 30 // in minutes
        }
    },
    studyPreferences: {
        preferredTime: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'night'],
            default: 'evening'
        },
        preferredDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }],
        studyReminders: {
            type: Boolean,
            default: true
        },
        breakReminders: {
            type: Boolean,
            default: true
        }
    },
    data: {
        autoBackup: {
            type: Boolean,
            default: true
        },
        backupFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'weekly'
        },
        deleteAccountAfter: {
            type: Number,
            default: 30 // in days
        }
    }
}, {
    timestamps: true
});

// Method to update profile settings
studentSettingsSchema.methods.updateProfileSettings = async function(profileSettings) {
    this.profile = {
        ...this.profile,
        ...profileSettings
    };
    await this.save();
    return this.profile;
};

// Method to update notification settings
studentSettingsSchema.methods.updateNotificationSettings = async function(notificationSettings) {
    this.notifications = {
        ...this.notifications,
        ...notificationSettings
    };
    await this.save();
    return this.notifications;
};

// Method to update display settings
studentSettingsSchema.methods.updateDisplaySettings = async function(displaySettings) {
    this.display = {
        ...this.display,
        ...displaySettings
    };
    await this.save();
    return this.display;
};

// Method to update privacy settings
studentSettingsSchema.methods.updatePrivacySettings = async function(privacySettings) {
    this.privacy = {
        ...this.privacy,
        ...privacySettings
    };
    await this.save();
    return this.privacy;
};

// Method to update security settings
studentSettingsSchema.methods.updateSecuritySettings = async function(securitySettings) {
    this.security = {
        ...this.security,
        ...securitySettings
    };
    await this.save();
    return this.security;
};

// Method to update study preferences
studentSettingsSchema.methods.updateStudyPreferences = async function(studyPreferences) {
    this.studyPreferences = {
        ...this.studyPreferences,
        ...studyPreferences
    };
    await this.save();
    return this.studyPreferences;
};

// Method to update data settings
studentSettingsSchema.methods.updateDataSettings = async function(dataSettings) {
    this.data = {
        ...this.data,
        ...dataSettings
    };
    await this.save();
    return this.data;
};

// Static method to get settings for a student
studentSettingsSchema.statics.getStudentSettings = async function(studentId) {
    return await this.findOne({ studentId });
};

const StudentSettings = mongoose.model('StudentSettings', studentSettingsSchema);

module.exports = StudentSettings; 