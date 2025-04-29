const mongoose = require('mongoose');

const adminCourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxLength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['programming', 'mathematics', 'science', 'language', 'business', 'art', 'other']
  },
  subCategory: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  duration: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String,
    required: true
  },
  previewVideo: {
    url: String,
    duration: Number
  },
  syllabus: [{
    week: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    topics: [{
      type: String,
      required: true
    }],
    resources: [{
      type: {
        type: String,
        enum: ['video', 'document', 'link'],
        required: true
      },
      title: String,
      url: String,
      duration: Number,
      description: String
    }],
    assignments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    }],
    quizzes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    }]
  }],
  prerequisites: [{
    type: String,
    required: true
  }],
  learningOutcomes: [{
    type: String,
    required: true
  }],
  targetAudience: [{
    type: String,
    required: true
  }],
  features: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  language: {
    type: String,
    default: 'English'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'maintenance'],
    default: 'draft'
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  reviews: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentUser'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  analytics: {
    totalEnrollments: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
    }
  },
  settings: {
    allowPreview: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxStudents: {
      type: Number
    },
    certificateIssuance: {
      type: Boolean,
      default: true
    },
    discussionEnabled: {
      type: Boolean,
      default: true
    },
    liveSupport: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    seoTitle: String,
    seoDescription: String,
    keywords: [String],
    tags: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
adminCourseSchema.index({ title: 'text', description: 'text' });
adminCourseSchema.index({ category: 1 });
adminCourseSchema.index({ level: 1 });
adminCourseSchema.index({ status: 1 });
adminCourseSchema.index({ isPublished: 1 });

// Methods
adminCourseSchema.methods.updateEnrollmentCount = async function() {
  this.enrollmentCount = await this.model('Enrollment').countDocuments({ courseId: this._id });
  return this.save();
};

adminCourseSchema.methods.updateAverageRating = async function() {
  const reviews = this.reviews;
  if (reviews.length > 0) {
    this.averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
  }
  return this.save();
};

adminCourseSchema.methods.addReview = async function(review) {
  this.reviews.push(review);
  await this.updateAverageRating();
  return this.save();
};

// Static Methods
adminCourseSchema.statics.getPublishedCourses = function() {
  return this.find({ isPublished: true, status: 'published' })
    .sort({ createdAt: -1 });
};

adminCourseSchema.statics.getCoursesByCategory = function(category) {
  return this.find({ category, isPublished: true, status: 'published' })
    .sort({ createdAt: -1 });
};

const AdminCourse = mongoose.model('AdminCourse', adminCourseSchema);

module.exports = AdminCourse; 