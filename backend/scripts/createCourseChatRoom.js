import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import ChatRoom from '../models/ChatRoom.js';
import Enrollment from '../models/Enrollment.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connectify')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // 1. Get all courses
      const courses = await Course.find({});
      console.log(`Found ${courses.length} courses`);
      
      // 2. For each course, check if it has a chat room
      for (const course of courses) {
        const existingChatRoom = await ChatRoom.findOne({ 
          courseId: course._id,
          type: 'course' 
        });
        
        if (!existingChatRoom) {
          console.log(`Creating chat room for course: ${course.title} (${course._id})`);
          
          // Create a new chat room for this course
          const chatRoom = new ChatRoom({
            name: `${course.title} Chat`,
            description: `Chat room for ${course.title} (${course.code || 'Course'})`,
            type: 'course',
            courseId: course._id,
            isActive: true,
            createdAt: new Date()
          });
          
          await chatRoom.save();
          console.log(`Created chat room: ${chatRoom._id}`);
          
          // Find all students enrolled in this course
          const enrollments = await Enrollment.find({ course: course._id });
          console.log(`Found ${enrollments.length} enrollments for this course`);
          
          // Add enrolled students to chat room participants
          if (enrollments.length > 0) {
            for (const enrollment of enrollments) {
              console.log(`Adding student ${enrollment.student} to chat room`);
              
              // Add student to participants if not already present
              const isAlreadyParticipant = chatRoom.participants.some(
                p => p.userId.toString() === enrollment.student.toString() && p.userType === 'StudentUser'
              );
              
              if (!isAlreadyParticipant) {
                chatRoom.participants.push({
                  userId: enrollment.student,
                  userType: 'StudentUser',
                  role: 'member',
                  joinedAt: new Date()
                });
              }
            }
            
            await chatRoom.save();
            console.log(`Added ${enrollments.length} students to chat room`);
          }
        } else {
          console.log(`Chat room already exists for course: ${course.title}`);
        }
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