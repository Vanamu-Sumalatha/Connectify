import Todo from '../models/Todo.js';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';

const studentController = {
  // Todo methods
  getTodos: async (req, res) => {
    try {
      const todos = await Todo.find({ student: req.user.id })
        .populate('relatedCourse', 'title')
        .populate('relatedQuiz', 'title')
        .sort({ completed: 1, dueDate: 1, priority: -1 });
      
      res.json(todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  createTodo: async (req, res) => {
    try {
      const { title, description, dueDate, priority, relatedCourse, relatedQuiz } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      
      // Validate relatedCourse if provided
      if (relatedCourse) {
        const course = await Course.findById(relatedCourse);
        if (!course) {
          return res.status(400).json({ message: 'Related course not found' });
        }
      }
      
      // Validate relatedQuiz if provided
      if (relatedQuiz) {
        const quiz = await Quiz.findById(relatedQuiz);
        if (!quiz) {
          return res.status(400).json({ message: 'Related quiz not found' });
        }
      }
      
      const todo = new Todo({
        title,
        description,
        dueDate,
        priority,
        student: req.user.id,
        relatedCourse: relatedCourse || null,
        relatedQuiz: relatedQuiz || null,
      });
      
      await todo.save();
      
      res.status(201).json(todo);
    } catch (error) {
      console.error('Error creating todo:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  updateTodo: async (req, res) => {
    try {
      const { id } = req.params;
      const { completed } = req.body;
      
      // Find the todo and check ownership
      const todo = await Todo.findById(id);
      
      if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
      }
      
      if (todo.student.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this todo' });
      }
      
      // Update the completed status
      todo.completed = completed;
      
      // If being marked as completed, set the completedAt date
      if (completed && !todo.completedAt) {
        todo.completedAt = new Date();
      } else if (!completed) {
        todo.completedAt = null;
      }
      
      await todo.save();
      
      res.json(todo);
    } catch (error) {
      console.error('Error updating todo:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  
  deleteTodo: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find the todo and check ownership
      const todo = await Todo.findById(id);
      
      if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
      }
      
      if (todo.student.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this todo' });
      }
      
      await Todo.findByIdAndDelete(id);
      
      res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
      console.error('Error deleting todo:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
};

export default studentController; 