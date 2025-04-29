// Re-export the User model as Student
// This file ensures that imports like '../models/Student.js' work correctly

import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  progress: {
    type: Map,
    of: Number,
    default: {}
  },
  achievements: [{
    title: String,
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    icon: String
  }],
  learningStreak: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  totalLearningHours: {
    type: Number,
    default: 0
  },
  completedAssignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  quizScores: [{
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: Number,
    maxScore: Number,
    dateTaken: {
      type: Date,
      default: Date.now
    }
  }],
  averageQuizScore: {
    type: Number,
    default: 0
  },
  certificates: [{
    title: String,
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    certificateUrl: String
  }],
  notes: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    title: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, { timestamps: true });

const Student = mongoose.model('Student', StudentSchema);

export default Student; 