import express from 'express';
import auth from '../middleware/auth.js';
import Todo from '../models/Todo.js';

const router = express.Router();

// Get all todos for the current student
router.get('/todos', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ student: req.user._id })
      .populate('relatedCourse', 'title thumbnail')
      .populate('relatedQuiz', 'title')
      .sort({ dueDate: 1, priority: -1 });

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Error fetching todos', error: error.message });
  }
});

// Get a specific todo by ID
router.get('/todos/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id,
      student: req.user._id
    })
      .populate('relatedCourse', 'title thumbnail')
      .populate('relatedQuiz', 'title');

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ message: 'Error fetching todo', error: error.message });
  }
});

// Create a new todo
router.post('/todos', auth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, relatedCourse, relatedQuiz } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newTodo = new Todo({
      title,
      description,
      student: req.user._id,
      dueDate,
      priority: priority || 'medium',
      relatedCourse,
      relatedQuiz
    });

    const savedTodo = await newTodo.save();
    
    res.status(201).json(savedTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Error creating todo', error: error.message });
  }
});

// Update a todo
router.put('/todos/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    const todo = await Todo.findOne({ 
      _id: req.params.id,
      student: req.user._id
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Update fields
    Object.keys(updates).forEach(field => {
      todo[field] = updates[field];
    });

    // If completed status changed to true, set completedAt date
    if (updates.completed === true && !todo.completedAt) {
      todo.completedAt = new Date();
    } else if (updates.completed === false) {
      todo.completedAt = null;
    }

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Error updating todo', error: error.message });
  }
});

// Delete a todo
router.delete('/todos/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id,
      student: req.user._id
    });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    await todo.remove();
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Error deleting todo', error: error.message });
  }
});

// Mark a todo as completed or uncompleted
router.patch('/todos/:id/toggle-status', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id,
      student: req.user._id
    });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.completed = !todo.completed;
    
    if (todo.completed) {
      todo.completedAt = new Date();
    } else {
      todo.completedAt = null;
    }

    await todo.save();
    
    res.json({ 
      message: `Todo marked as ${todo.completed ? 'completed' : 'uncompleted'}`,
      todo
    });
  } catch (error) {
    console.error('Error toggling todo status:', error);
    res.status(500).json({ message: 'Error toggling todo status', error: error.message });
  }
});

// Get todo statistics 
router.get('/todos/statistics', auth, async (req, res) => {
  try {
    const totalTodos = await Todo.countDocuments({ student: req.user._id });
    const completedTodos = await Todo.countDocuments({ 
      student: req.user._id,
      completed: true
    });
    const pendingTodos = await Todo.countDocuments({ 
      student: req.user._id,
      completed: false
    });
    
    // Priority breakdown
    const highPriority = await Todo.countDocuments({ 
      student: req.user._id,
      priority: 'high',
      completed: false
    });
    const mediumPriority = await Todo.countDocuments({ 
      student: req.user._id,
      priority: 'medium',
      completed: false
    });
    const lowPriority = await Todo.countDocuments({ 
      student: req.user._id,
      priority: 'low',
      completed: false
    });

    // Due date breakdown
    const now = new Date();
    const overdue = await Todo.countDocuments({ 
      student: req.user._id,
      dueDate: { $lt: now },
      completed: false
    });
    
    // Due today
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dueToday = await Todo.countDocuments({ 
      student: req.user._id,
      dueDate: { 
        $gte: now,
        $lte: today
      },
      completed: false
    });

    // Due this week
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    const dueThisWeek = await Todo.countDocuments({ 
      student: req.user._id,
      dueDate: { 
        $gt: today,
        $lte: endOfWeek
      },
      completed: false
    });

    res.json({
      total: totalTodos,
      completed: completedTodos,
      pending: pendingTodos,
      completionRate: totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0,
      priority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      },
      dueDate: {
        overdue,
        dueToday,
        dueThisWeek,
        later: pendingTodos - overdue - dueToday - dueThisWeek
      }
    });
  } catch (error) {
    console.error('Error fetching todo statistics:', error);
    res.status(500).json({ message: 'Error fetching todo statistics', error: error.message });
  }
});

export default router; 