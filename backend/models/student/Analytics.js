const mongoose = require('mongoose');

const studentAnalyticsSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentUser',
        required: true
    },
    courseAnalytics: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        timeSpent: {
            type: Number,
            default: 0 // in minutes
        },
        lastAccessed: Date,
        completionStatus: {
            type: String,
            enum: ['not-started', 'in-progress', 'completed'],
            default: 'not-started'
        },
        performance: {
            averageScore: {
                type: Number,
                default: 0
            },
            assignmentsCompleted: {
                type: Number,
                default: 0
            },
            quizzesCompleted: {
                type: Number,
                default: 0
            },
            totalScore: {
                type: Number,
                default: 0
            },
            maxScore: {
                type: Number,
                default: 0
            }
        },
        engagement: {
            loginFrequency: {
                type: Number,
                default: 0
            },
            discussionParticipation: {
                type: Number,
                default: 0
            },
            resourceAccess: {
                type: Number,
                default: 0
            }
        }
    }],
    overallPerformance: {
        coursesEnrolled: {
            type: Number,
            default: 0
        },
        coursesCompleted: {
            type: Number,
            default: 0
        },
        averageGrade: {
            type: Number,
            default: 0
        },
        totalTimeSpent: {
            type: Number,
            default: 0 // in minutes
        },
        certificatesEarned: {
            type: Number,
            default: 0
        }
    },
    learningPatterns: {
        preferredTime: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'night'],
            default: 'evening'
        },
        averageSessionDuration: {
            type: Number,
            default: 0 // in minutes
        },
        preferredDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }]
    },
    skillDevelopment: [{
        skill: {
            type: String,
            required: true
        },
        level: {
            type: Number,
            min: 1,
            max: 5,
            default: 1
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }],
    recommendations: [{
        type: {
            type: String,
            enum: ['course', 'resource', 'study-group'],
            required: true
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        reason: String,
        priority: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        suggestedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Method to update course analytics
studentAnalyticsSchema.methods.updateCourseAnalytics = async function(courseId, analyticsData) {
    const courseIndex = this.courseAnalytics.findIndex(course => course.courseId.toString() === courseId.toString());
    
    if (courseIndex === -1) {
        this.courseAnalytics.push({
            courseId,
            ...analyticsData
        });
    } else {
        this.courseAnalytics[courseIndex] = {
            ...this.courseAnalytics[courseIndex],
            ...analyticsData
        };
    }
    
    await this.save();
    return this.courseAnalytics[courseIndex === -1 ? this.courseAnalytics.length - 1 : courseIndex];
};

// Method to update overall performance
studentAnalyticsSchema.methods.updateOverallPerformance = async function() {
    const completedCourses = this.courseAnalytics.filter(course => course.completionStatus === 'completed').length;
    const totalCourses = this.courseAnalytics.length;
    const totalTime = this.courseAnalytics.reduce((sum, course) => sum + course.timeSpent, 0);
    const averageGrade = this.courseAnalytics.reduce((sum, course) => sum + course.performance.averageScore, 0) / totalCourses;
    
    this.overallPerformance = {
        coursesEnrolled: totalCourses,
        coursesCompleted: completedCourses,
        averageGrade,
        totalTimeSpent: totalTime
    };
    
    await this.save();
    return this.overallPerformance;
};

// Method to add skill
studentAnalyticsSchema.methods.addSkill = async function(skillData) {
    this.skillDevelopment.push(skillData);
    await this.save();
    return this.skillDevelopment[this.skillDevelopment.length - 1];
};

// Method to update skill
studentAnalyticsSchema.methods.updateSkill = async function(skillName, updateData) {
    const skillIndex = this.skillDevelopment.findIndex(skill => skill.skill === skillName);
    if (skillIndex !== -1) {
        this.skillDevelopment[skillIndex] = {
            ...this.skillDevelopment[skillIndex],
            ...updateData,
            lastUpdated: new Date()
        };
        await this.save();
    }
    return this.skillDevelopment[skillIndex];
};

// Method to add recommendation
studentAnalyticsSchema.methods.addRecommendation = async function(recommendationData) {
    this.recommendations.push(recommendationData);
    await this.save();
    return this.recommendations[this.recommendations.length - 1];
};

// Static method to get analytics for a student
studentAnalyticsSchema.statics.getStudentAnalytics = async function(studentId) {
    return await this.findOne({ studentId })
        .populate('courseAnalytics.courseId')
        .populate('recommendations.itemId');
};

const StudentAnalytics = mongoose.model('StudentAnalytics', studentAnalyticsSchema);

module.exports = StudentAnalytics; 