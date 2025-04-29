import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
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
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  testAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt'
  },
  title: {
    type: String,
    required: true
  },
  certificateId: {
    type: String,
    unique: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  totalAttempts: {
    type: Number,
    default: 1
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  templateUsed: {
    type: String,
    default: 'default'
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  }
}, { timestamps: true });

// Virtual fields
certificateSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

certificateSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const diffTime = this.expiryDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Create a unique certificate ID before saving
certificateSchema.pre('save', function(next) {
  if (!this.certificateId) {
    // Generate a unique certificate ID based on timestamp and random characters
    const timestamp = new Date().getTime().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.certificateId = `CERT-${timestamp}-${random}`;
  }

  // Update status if expired
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'expired';
  }

  next();
});

// Static methods
certificateSchema.statics.findByStudent = async function(studentId) {
  try {
    // First verify the student exists
    if (!studentId) {
      console.error('No studentId provided to findByStudent');
      return [];
    }

    // Use lean() for better performance and less memory usage
    return await this.find({ 
      student: studentId, 
      status: { $ne: 'revoked' } 
    })
      .populate({
        path: 'course',
        select: 'title code imageUrl',
        options: { 
          strictPopulate: false,
          // Don't fail if course doesn't exist
          match: { _id: { $exists: true } }
        }
      })
      .populate({
        path: 'test',
        select: 'title description',
        options: { 
          strictPopulate: false,
          // Don't fail if test doesn't exist
          match: { _id: { $exists: true } }
        }
      })
      .populate({
        path: 'student',
        select: 'firstName lastName email',
        options: { 
          strictPopulate: false,
          // Don't fail if student doesn't exist
          match: { _id: { $exists: true } }
        }
      })
      .sort({ issueDate: -1 })
      .lean();
  } catch (error) {
    console.error('Error in findByStudent:', error);
    // Return empty array instead of throwing
    return [];
  }
};

certificateSchema.statics.findActiveCertificates = function(studentId) {
  return this.find({ 
    student: studentId,
    status: 'active'
  })
  .populate('course', 'title code')
  .populate('test', 'title')
  .sort({ issueDate: -1 });
};

certificateSchema.statics.incrementDownloadCount = async function(certificateId) {
  return this.findByIdAndUpdate(
    certificateId, 
    { 
      $inc: { downloadCount: 1 },
      lastDownloaded: new Date()
    },
    { new: true }
  );
};

// Indexes
certificateSchema.index({ student: 1 });
certificateSchema.index({ course: 1 });
certificateSchema.index({ certificateId: 1 }, { unique: true });
certificateSchema.index({ status: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate; 