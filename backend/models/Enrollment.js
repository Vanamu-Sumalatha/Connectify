import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
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
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'not-started', 'wishlist'],
    default: 'not-started'
  },
  isWishlisted: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  completionDate: {
    type: Date,
    default: null
  },
  lastAccessDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Create a compound index to ensure a student can only enroll in a course once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Method to mark enrollment as completed
enrollmentSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.progress = 100;
  this.completionDate = new Date();
  return this.save();
};

// Method to calculate progress from completed lessons
enrollmentSchema.methods.calculateProgress = async function() {
  try {
    // Populate the course to get the lessons
    await this.populate('course', 'lessons');
    
    if (!this.course || !this.course.lessons || this.course.lessons.length === 0) {
      return 0;
    }
    
    const totalLessons = this.course.lessons.length;
    const completedCount = this.completedLessons.length;
    
    // Calculate percentage
    return Math.round((completedCount / totalLessons) * 100);
  } catch (error) {
    console.error('Error calculating progress:', error);
    return this.progress; // Return current progress in case of error
  }
};

// Enhanced method to update progress
enrollmentSchema.methods.updateProgress = async function(manualProgress = null) {
  // If a manual progress value is provided, use it
  if (manualProgress !== null) {
    this.progress = Math.min(Math.max(0, manualProgress), 100);
  } else {
    // Otherwise calculate based on completed lessons
    this.progress = await this.calculateProgress();
  }
  
  this.lastAccessDate = new Date();
  
  // Update status based on progress
  if (this.progress === 0) {
    this.status = 'not-started';
  } else if (this.progress < 100) {
    this.status = 'in-progress';
  } else {
    this.status = 'completed';
    this.completionDate = new Date();
  }
  
  return this.save();
};

// Static method to get enrollments for a student
enrollmentSchema.statics.getEnrollmentsForStudent = function(studentId) {
  return this.find({ student: studentId })
    .populate('course')
    .sort({ enrollmentDate: -1 });
};

// Static method to get wishlist for a student
enrollmentSchema.statics.getWishlistForStudent = function(studentId) {
  return this.find({ 
    student: studentId,
    isWishlisted: true
  })
  .populate('course')
  .sort({ updatedAt: -1 });
};

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment; 