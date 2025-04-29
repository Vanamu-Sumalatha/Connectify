import mongoose from 'mongoose';

// Define schema for test options
const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Define schema for test questions
const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false'],
    default: 'multiple-choice'
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function(options) {
        // Ensure at least one option is marked as correct
        return options.some(option => option.isCorrect);
      },
      message: 'At least one option must be marked as correct'
    },
    required: true
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: true });

// Validate that at least one question is required
const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  duration: {
    type: Number, // minutes
    default: 60,
    min: 5
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 1
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxAttempts: {
    type: Number,
    default: 5,
    min: 1
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(questions) {
        return questions.length > 0;
      },
      message: 'At least one question is required'
    }
  },
  isCertificateTest: {
    type: Boolean,
    default: true
  },
  certificateTemplate: {
    type: String,
    default: 'default'
  },
  certificateExpiryDays: {
    type: Number,
    default: null, // null means no expiry
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on document update
TestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find tests by course
TestSchema.statics.findByCourse = function(courseId) {
  return this.find({ courseId, status: 'published' });
};

// Static method to find certificate tests
TestSchema.statics.findCertificateTests = function() {
  return this.find({ isCertificateTest: true, status: 'published' });
};

// Indexes for faster queries
TestSchema.index({ courseId: 1 });
TestSchema.index({ status: 1 });
TestSchema.index({ isCertificateTest: 1, status: 1 });

const Test = mongoose.model('Test', TestSchema);

export default Test; 