import express from 'express';
import { studentCheck } from '../../middleware/authMiddleware.js';
import Course from '../../models/admin/Course.js';
import StudentUser from '../../models/student/StudentUser.js';

const router = express.Router();

// Get completed courses for a student
router.get('/completed', studentCheck, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Find the student and populate their completed courses
    const student = await StudentUser.findById(studentId)
      .populate({
        path: 'completedCourses',
        select: '_id title code description'
      });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student.completedCourses);
  } catch (error) {
    console.error('Error fetching completed courses:', error);
    res.status(500).json({ message: 'Failed to fetch completed courses' });
  }
});

export default router;
