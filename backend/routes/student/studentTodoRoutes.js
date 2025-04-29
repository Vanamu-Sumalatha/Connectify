import express from 'express';
import mongoose from 'mongoose';
import { protect, isStudent } from '../../middleware/auth.js';
import Todo from '../../models/Todo.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(isStudent);

/**
 * @route   GET /api/student/todos
 * @desc    Get all todos for the authenticated student
 * @access  Private (Student)
 */
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ student: req.user._id })
      .populate('relatedCourse', 'title code')
      .populate('relatedQuiz', 'title');

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/student/todos/:id
 * @desc    Get a specific todo by ID
 * @access  Private (Student)
 */
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id)
      .populate('relatedCourse', 'title code')
      .populate('relatedQuiz', 'title');

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Check if the todo belongs to the authenticated user
    if (todo.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this todo' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/student/todos
 * @desc    Create a new todo
 * @access  Private (Student)
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, dueDate, priority, relatedCourse, relatedQuiz } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const todoData = {
      student: req.user._id,
      title,
      description,
      dueDate,
      priority: priority || 'medium',
      completed: false
    };

    if (relatedCourse) {
      todoData.relatedCourse = relatedCourse;
    }

    if (relatedQuiz) {
      todoData.relatedQuiz = relatedQuiz;
    }

    const newTodo = new Todo(todoData);
    const savedTodo = await newTodo.save();

    // Populate references before returning
    const populatedTodo = await Todo.findById(savedTodo._id)
      .populate('relatedCourse', 'title code')
      .populate('relatedQuiz', 'title');

    res.status(201).json(populatedTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/student/todos/:id
 * @desc    Update a todo
 * @access  Private (Student)
 */
router.patch('/:id', async (req, res) => {
  try {
    const todoId = req.params.id;
    const updates = req.body;

    // Find the todo first to check ownership
    const todo = await Todo.findById(todoId);

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Check if the todo belongs to the authenticated user
    if (todo.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this todo' });
    }

    // If the todo is being marked as completed, set the completedAt date
    if (!todo.completed && updates.completed === true) {
      updates.completedAt = new Date();
    }
    
    // If the todo is being marked as not completed, remove the completedAt date
    if (todo.completed && updates.completed === false) {
      updates.completedAt = null;
    }

    // Update the todo
    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('relatedCourse', 'title code')
      .populate('relatedQuiz', 'title');

    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/student/todos/:id
 * @desc    Delete a todo
 * @access  Private (Student)
 */
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Check if the todo belongs to the authenticated user
    if (todo.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this todo' });
    }

    await todo.deleteOne();
    res.json({ message: 'Todo removed' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 