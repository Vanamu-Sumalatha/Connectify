import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';

// Load environment variables
dotenv.config();

// Student username to check (change this to the student you want to check)
const STUDENT_USERNAME = 'ravi416'; // Replace with your actual username
const COURSE_CODE = 'JAVA101'; // Replace with your Java course code

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connectify')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find the student by username
      const student = await User.findOne({ username: STUDENT_USERNAME });
      if (!student) {
        console.error(`Student ${STUDENT_USERNAME} not found`);
        process.exit(1);
      }
      
      console.log(`Found student: ${student.username} (${student._id})`);
      
      // Find the course by code
      const course = await Course.findOne({ code: COURSE_CODE });
      if (!course) {
        // Try by name if code doesn't exist
        const javaCourse = await Course.findOne({ 
          title: { $regex: 'java', $options: 'i' } 
        });
        
        if (!javaCourse) {
          console.error(`Course with code ${COURSE_CODE} or title containing 'java' not found`);
          
          // List all available courses
          const allCourses = await Course.find({}, 'title code _id');
          console.log('Available courses:');
          allCourses.forEach(c => console.log(`- ${c.title} (${c.code || 'No code'}) - ID: ${c._id}`));
          
          process.exit(1);
        } else {
          console.log(`Found Java course by title: ${javaCourse.title} (${javaCourse._id})`);
          course = javaCourse;
        }
      } else {
        console.log(`Found course: ${course.title} (${course._id})`);
      }
      
      // Check if student is already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: student._id,
        course: course._id
      });
      
      if (existingEnrollment) {
        console.log(`Student is already enrolled in this course with status: ${existingEnrollment.status}`);
        
        // Update enrollment status if it's in wishlist
        if (existingEnrollment.status === 'wishlist') {
          existingEnrollment.status = 'not-started';
          await existingEnrollment.save();
          console.log(`Updated enrollment status from wishlist to not-started`);
        }
      } else {
        console.log(`Enrolling student in the course...`);
        
        // Create enrollment
        const enrollment = new Enrollment({
          student: student._id,
          course: course._id,
          enrollmentDate: new Date(),
          status: 'not-started',
          progress: 0
        });
        
        await enrollment.save();
        console.log(`Student enrolled successfully. Enrollment ID: ${enrollment._id}`);
      }
      
      // Find or create the chat room for this course
      let chatRoom = await ChatRoom.findOne({
        courseId: course._id,
        type: 'course'
      });
      
      if (!chatRoom) {
        console.log(`Creating chat room for course: ${course.title}`);
        
        // Create chat room
        chatRoom = new ChatRoom({
          name: `${course.title} Chat`,
          description: `Chat room for ${course.title} (${course.code || 'Course'})`,
          type: 'course',
          courseId: course._id,
          isActive: true,
          createdAt: new Date()
        });
        
        await chatRoom.save();
        console.log(`Chat room created. ID: ${chatRoom._id}`);
      } else {
        console.log(`Found existing chat room: ${chatRoom._id}`);
      }
      
      // Add student to chat room participants if not already present
      const isAlreadyParticipant = chatRoom.participants && chatRoom.participants.some(
        p => p.userId.toString() === student._id.toString() && p.userType === 'StudentUser'
      );
      
      if (!isAlreadyParticipant) {
        // Initialize participants array if needed
        if (!chatRoom.participants || !Array.isArray(chatRoom.participants)) {
          chatRoom.participants = [];
        }
        
        chatRoom.participants.push({
          userId: student._id,
          userType: 'StudentUser',
          role: 'member',
          joinedAt: new Date()
        });
        
        await chatRoom.save();
        console.log(`Added student to chat room participants`);
      } else {
        console.log(`Student is already a participant in the chat room`);
      }
      
      console.log('Done!');
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 