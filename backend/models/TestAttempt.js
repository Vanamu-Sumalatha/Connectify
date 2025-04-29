import mongoose from 'mongoose';

// Define schema for answers to test questions
const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOptions: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  textAnswer: {
    type: String
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
}, { _id: true });

const TestAttemptSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  answers: {
    type: [answerSchema],
    default: []
  },
  score: {
    type: Number,
    default: 0
  },
  totalPossiblePoints: {
    type: Number,
    required: true
  },
  percentageScore: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: String
  },
  completionDate: {
    type: Date
  },
  securityViolations: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'timed-out', 'abandoned'],
    default: 'in-progress'
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

// Virtual field for passFail status
TestAttemptSchema.virtual('passFail').get(function() {
  return this.passed ? 'Pass' : 'Fail';
});

// Method to calculate the score based on the answers
TestAttemptSchema.methods.calculateScore = function() {
  if (!this.answers || this.answers.length === 0) {
    this.score = 0;
    this.percentageScore = 0;
    this.passed = false;
    return;
  }

  const totalPoints = this.totalPossiblePoints || 0;
  const pointsEarned = this.answers.reduce((sum, answer) => sum + (answer.pointsEarned || 0), 0);
  
  this.score = pointsEarned;
  this.percentageScore = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;
  
  // Check if test is passed based on the test's passing score
  this.passed = this.percentageScore >= (this.test.passingScore || 70);
};

// Static method to count total attempts by a student for a specific test
TestAttemptSchema.statics.countStudentAttempts = async function(testId, studentId) {
  return this.countDocuments({ test: testId, student: studentId });
};

// Static method to get the best attempt for a student on a test
TestAttemptSchema.statics.getBestAttempt = async function(testId, studentId) {
  return this.findOne({ 
    test: testId, 
    student: studentId,
    completed: true 
  }).sort({ percentageScore: -1 });
};

// Static method to get all attempts with certificate eligibility
TestAttemptSchema.statics.getPassedAttempts = async function(studentId) {
  return this.find({
    student: studentId,
    passed: true,
    completed: true
  }).populate('test course');
};

// Static method to check if a certificate should be issued
TestAttemptSchema.statics.shouldIssueCertificate = async function(testId, studentId) {
  const attempts = await this.find({
    test: testId,
    student: studentId,
    passed: true,
    completed: true
  });
  
  return attempts.length > 0 && !attempts.some(a => a.certificateIssued);
};

// Update timestamp on document update
TestAttemptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // If completing the test, set the completion time
  if (this.status === 'completed' && !this.endTime) {
    this.endTime = new Date();
    this.completed = true;
    
    // Calculate time spent if not already set
    if (!this.timeSpent && this.startTime) {
      this.timeSpent = Math.round((this.endTime - this.startTime) / 1000);
    }
  }
  
  // If the attempt is completed and passed but certificate not issued, mark for certificate issuance
  if (this.completed && this.passed && !this.certificateIssued) {
    // Set the completion date for the certificate
    this.completionDate = new Date();
  }
  
  next();
});

// Indexes for faster queries
TestAttemptSchema.index({ test: 1, student: 1 });
TestAttemptSchema.index({ student: 1 });
TestAttemptSchema.index({ passed: 1, certificateIssued: 1 });

const TestAttempt = mongoose.model('TestAttempt', TestAttemptSchema);

export default TestAttempt; 