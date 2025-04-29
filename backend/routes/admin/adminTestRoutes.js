import express from 'express';
import { protect, isAdmin, isAdminOrStudent } from '../../middleware/auth.js';
import Test from '../../models/Test.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// GET routes - allow both admin and student access
router.get('/', isAdminOrStudent, async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('courseId', 'title')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Error fetching tests', error: error.message });
  }
});

// GET a single test by ID - allow both admin and student access
router.get('/:id', isAdminOrStudent, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('createdBy', 'name email');
    
    if (!test) {
      console.log('test not found')
      return res.status(404).json({ message: 'Test not found' });
    }
    
    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Error fetching test', error: error.message });
  }
});

// Apply admin-only middleware for other operations
router.use(isAdmin);

// CREATE a new test
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      courseId, 
      passingScore,
      duration,
      totalPoints,
      dueDate,
      questions,
      isCertificateTest, 
      certificateTemplate,
      status 
    } = req.body;

    // Create a new test
    const newTest = new Test({
      title,
      description,
      courseId,
      passingScore: passingScore || 70,
      duration: duration || 60,
      totalPoints: totalPoints || 100,
      dueDate,
      questions,
      isCertificateTest: isCertificateTest !== undefined ? isCertificateTest : true,
      certificateTemplate: certificateTemplate || 'default',
      status: status || 'published',
      createdBy: req.user._id
    });

    // Save the test
    const savedTest = await newTest.save();
    
    res.status(201).json(savedTest);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Error creating test', error: error.message });
  }
});

// UPDATE a test
router.put('/:id', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      courseId, 
      passingScore,
      duration,
      totalPoints,
      dueDate,
      questions,
      isCertificateTest, 
      certificateTemplate,
      status 
    } = req.body;

    // Find the test to update
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Update test fields
    test.title = title || test.title;
    test.description = description || test.description;
    test.courseId = courseId || test.courseId;
    test.passingScore = passingScore || test.passingScore;
    test.duration = duration || test.duration;
    test.totalPoints = totalPoints || test.totalPoints;
    test.dueDate = dueDate || test.dueDate;
    test.questions = questions || test.questions;
    test.isCertificateTest = isCertificateTest !== undefined ? isCertificateTest : test.isCertificateTest;
    test.certificateTemplate = certificateTemplate || test.certificateTemplate;
    test.status = status || test.status;
    
    // Save the updated test
    const updatedTest = await test.save();
    
    res.json(updatedTest);
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ message: 'Error updating test', error: error.message });
  }
});

// DELETE a test
router.delete('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // await test.remove();
    // await Test.deleteOne(req.params.id);
    await Test.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ message: 'Error deleting test', error: error.message });
  }
});

export default router; 