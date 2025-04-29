import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import ChatRoom from '../models/ChatRoom.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Student username to check
const STUDENT_USERNAME = 'ravi416'; // Change this to your actual username

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connectify')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // 1. Find the student
      const student = await User.findOne({ username: STUDENT_USERNAME });
      if (!student) {
        console.error(`Student ${STUDENT_USERNAME} not found`);
        process.exit(1);
      }
      
      console.log(`=========== STUDENT INFO ===========`);
      console.log(`Username: ${student.username}`);
      console.log(`ID: ${student._id}`);
      console.log(`Role: ${student.role}`);
      console.log(`\n`);
      
      // 2. Find all courses
      const courses = await Course.find({});
      console.log(`=========== COURSES (${courses.length}) ===========`);
      courses.forEach((course, index) => {
        console.log(`${index+1}. ${course.title} (${course.code || 'No code'})`);
        console.log(`   ID: ${course._id}`);
      });
      console.log(`\n`);
      
      // 3. Find all enrollments for this student
      const enrollments = await Enrollment.find({ student: student._id });
      console.log(`=========== ENROLLMENTS (${enrollments.length}) ===========`);
      
      if (enrollments.length === 0) {
        console.log(`No enrollments found for this student`);
      } else {
        for (const enrollment of enrollments) {
          const course = await Course.findById(enrollment.course);
          console.log(`- ${course?.title || 'Unknown Course'} (${course?.code || 'No code'})`);
          console.log(`  Status: ${enrollment.status}`);
          console.log(`  Progress: ${enrollment.progress}%`);
          console.log(`  Enrollment Date: ${enrollment.enrollmentDate}`);
          console.log(`  ID: ${enrollment._id}`);
          console.log(`  Course ID: ${enrollment.course}`);
        }
      }
      console.log(`\n`);
      
      // 4. Find all chat rooms
      const chatRooms = await ChatRoom.find({});
      console.log(`=========== CHAT ROOMS (${chatRooms.length}) ===========`);
      
      for (const room of chatRooms) {
        let courseInfo = '';
        if (room.courseId) {
          const course = await Course.findById(room.courseId);
          courseInfo = course ? ` - Course: ${course.title}` : ` - Unknown Course`;
        }
        
        console.log(`- ${room.name}${courseInfo}`);
        console.log(`  Type: ${room.type}`);
        console.log(`  ID: ${room._id}`);
        console.log(`  Course ID: ${room.courseId || 'N/A'}`);
        console.log(`  Active: ${room.isActive ? 'Yes' : 'No'}`);
        console.log(`  Participants: ${room.participants?.length || 0}`);
        
        // Check if student is a participant
        const isParticipant = room.participants?.some(p => 
          p.userId.toString() === student._id.toString()
        );
        console.log(`  Student is participant: ${isParticipant ? 'Yes' : 'No'}`);
      }
      
      console.log(`\n`);
      console.log(`=========== DEBUG SUMMARY ===========`);
      
      // Find course chat rooms
      const courseChatRooms = chatRooms.filter(r => r.type === 'course');
      console.log(`Course chat rooms: ${courseChatRooms.length}`);
      
      // Check if student is enrolled in course but missing from chat room
      const missingFromChatRooms = [];
      for (const enrollment of enrollments) {
        const chatRoom = chatRooms.find(r => 
          r.courseId && r.courseId.toString() === enrollment.course.toString()
        );
        
        if (chatRoom) {
          const isParticipant = chatRoom.participants?.some(p => 
            p.userId.toString() === student._id.toString()
          );
          
          if (!isParticipant) {
            const course = await Course.findById(enrollment.course);
            missingFromChatRooms.push({
              course: course?.title || 'Unknown Course',
              courseId: enrollment.course,
              chatRoomId: chatRoom._id
            });
          }
        }
      }
      
      if (missingFromChatRooms.length > 0) {
        console.log(`Student is missing from ${missingFromChatRooms.length} chat rooms:`);
        missingFromChatRooms.forEach(item => {
          console.log(`- ${item.course} (Chat Room: ${item.chatRoomId})`);
        });
      } else {
        console.log(`Student is correctly added to all relevant chat rooms`);
      }
      
      // Checking courses without chat rooms
      const coursesWithoutChatRooms = [];
      for (const course of courses) {
        const chatRoom = chatRooms.find(r => 
          r.courseId && r.courseId.toString() === course._id.toString()
        );
        
        if (!chatRoom) {
          coursesWithoutChatRooms.push({
            title: course.title,
            code: course.code,
            id: course._id
          });
        }
      }
      
      if (coursesWithoutChatRooms.length > 0) {
        console.log(`\n${coursesWithoutChatRooms.length} courses don't have chat rooms:`);
        coursesWithoutChatRooms.forEach(course => {
          console.log(`- ${course.title} (${course.code || 'No code'})`);
        });
      } else {
        console.log(`\nAll courses have chat rooms`);
      }
      
      console.log(`\nDone!`);
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