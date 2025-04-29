import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'wishlist'],
      default: 'not-started'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    completedLessons: [{
      type: String
    }],
    lastAccessDate: {
      type: Date,
      default: Date.now
    },
    completionDate: Date
  }],
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
  }]
}, { timestamps: true });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

export default StudentProfile; 