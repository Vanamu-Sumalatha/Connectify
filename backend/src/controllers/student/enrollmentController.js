import Course from '../../../models/Course.js';
import Enrollment from '../../../models/Enrollment.js';
import ChatRoom from '../../../models/ChatRoom.js';

// Enroll in a course
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ 
      student: studentId, 
      course: courseId,
      status: { $ne: 'wishlist' }
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      enrollmentDate: new Date(),
      status: 'not-started',
      progress: 0
    });
    
    await enrollment.save();
    
    // Add student to course chat room
    await addStudentToChatRoom(studentId, courseId);
    
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Error enrolling in course', error: error.message });
  }
};

// Helper function to add student to course chat room
const addStudentToChatRoom = async (studentId, courseId) => {
  try {
    // Find the chat room for this course
    const chatRoom = await ChatRoom.findOne({ 
      courseId,
      type: 'course',
      isActive: true
    });
    
    if (!chatRoom) {
      console.log(`No chat room found for course ${courseId}`);
      return;
    }
    
    // Add student to participants if not already present
    const isAlreadyParticipant = chatRoom.participants.some(
      p => p.userId.toString() === studentId.toString() && p.userType === 'StudentUser'
    );
    
    if (!isAlreadyParticipant) {
      chatRoom.participants.push({
        userId: studentId,
        userType: 'StudentUser',
        role: 'member',
        joinedAt: new Date()
      });
      
      await chatRoom.save();
      console.log(`Added student ${studentId} to chat room for course ${courseId}`);
    }
  } catch (error) {
    console.error('Error adding student to course chat room:', error);
    // Don't throw error, just log it - we don't want enrollment to fail just because chat room update failed
  }
}; 