import Course from '../../models/Course.js';
import ChatRoom from '../../models/ChatRoom.js';

// Add a new course
export const createCourse = async (req, res) => {
  try {
    const courseData = req.body;
    
    // Create the course
    const course = new Course(courseData);
    await course.save();
    
    // Create a chat room for this course
    const chatRoom = new ChatRoom({
      name: `${course.title} Chat`,
      description: `Chat room for ${course.title} (${course.code})`,
      type: 'course',
      courseId: course._id,
      isActive: true,
      createdBy: req.user._id
    });
    
    await chatRoom.save();
    
    console.log(`Created course chat room for ${course.title}`);
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
}; 