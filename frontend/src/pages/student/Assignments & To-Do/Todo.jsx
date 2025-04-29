import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaSyncAlt, FaSearch } from 'react-icons/fa';
import {
  TrashIcon,
  PencilSquareIcon,
  PlusIcon,
  CheckIcon,
  ArrowPathIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
// Material UI imports
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { baseUrl } from '../../../config.js';

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const Todo = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Initialize state
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    relatedCourse: '',
    relatedQuiz: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('');

  // Fetch todos
  const { data: todos = [], isLoading: isLoadingTodos, error: todosError, refetch: refetchTodos } = useQuery({
    queryKey: ['student-todos'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        try {
          const response = await axios.get(
            `${baseUrl}/api/student/todos`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response format from todos API');
          }
          
          return response.data;
        } catch (apiError) {
          console.error('API error fetching todos:', apiError);
          
          if (apiError.response?.status === 404) {
            console.log('Todos endpoint not available yet, using fallback data');
            // Fallback data for todos
            return [
              {
                _id: 'todo001',
                title: 'Complete JavaScript Exercise',
                description: 'Finish the array manipulation exercises for JavaScript fundamentals.',
                dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
                priority: 'high',
                completed: false,
                relatedCourse: { _id: 'course001', title: 'JavaScript Fundamentals' },
                createdAt: new Date(Date.now() - 86400000).toISOString()
              },
              {
                _id: 'todo002',
                title: 'Read Chapter 5',
                description: 'Read about database normalization principles in the textbook.',
                dueDate: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days from now
                priority: 'medium',
                completed: false,
                relatedCourse: { _id: 'course002', title: 'Database Systems' },
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
              },
              {
                _id: 'todo003',
                title: 'Review Quiz Material',
                description: 'Go through the notes and practice questions for the upcoming UI/UX design quiz.',
                dueDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
                priority: 'high',
                completed: true,
                completedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                relatedCourse: { _id: 'course003', title: 'UX/UI Design Principles' },
                relatedQuiz: { _id: 'quiz003', title: 'UI/UX Design Quiz' },
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
              }
            ];
          }
          
          throw apiError;
        }
      } catch (error) {
        console.error('Failed to fetch todos:', error);
        if (error.response?.status !== 404) {
          toast.error('Failed to load todos: ' + (error.response?.data?.message || error.message));
        }
        throw error;
      }
    },
    retry: 1,
  });

  // Fetch courses
  const coursesQuery = useQuery({
    queryKey: ["studentCourses"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication required");
        }
        
        // Try to use the new detailed enrolled courses endpoint
        const response = await axios.get(
          `${baseUrl}/api/student/courses/enrolled`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log("Student enrolled courses:", response.data);
        
        // Ensure we have data and return it properly formatted
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        
        // If response is empty or not an array, return empty array
        console.log("No courses data found or invalid format, returning empty array");
        return [];
      } catch (error) {
        console.error("Error fetching student courses:", error);
        // Return empty array on error instead of throwing
        return [];
      }
    },
    enabled: !!user,
  });

  // Courses loading and error handling
  const isCoursesLoading = coursesQuery.isLoading;
  const coursesError = coursesQuery.error;
  const courses = coursesQuery.data || [];

  // Add console logging for debugging
  useEffect(() => {
    if (isCoursesLoading) {
      console.log("Loading courses...");
    }
    
    if (coursesError) {
      console.error("Error loading courses:", coursesError);
    }
    
    if (courses && courses.length > 0) {
      console.log("Courses loaded successfully:", courses);
    } else if (courses && courses.length === 0 && !isCoursesLoading) {
      console.log("No courses found for this student");
    }
  }, [isCoursesLoading, coursesError, courses]);

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: async (todoData) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      setIsSubmitting(true);
      toast.loading('Creating todo...');
      
      const response = await axios.post(
        `${baseUrl}/api/student/todos`,
        todoData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-todos'] });
      setIsSubmitting(false);
      toast.dismiss();
      toast.success('Todo created successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error creating todo:', error);
      setIsSubmitting(false);
      toast.dismiss();
      
      let errorMessage = 'Failed to create todo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Toggle complete todo mutation
  const toggleCompleteTodoMutation = useMutation({
    mutationFn: async ({ id, completed }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.patch(
        `${baseUrl}/api/student/todos/${id}/complete`,
        { completed },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-todos'] });
      toast.success('Todo updated successfully');
    },
    onError: (error) => {
      console.error('Error updating todo:', error);
      
      let errorMessage = 'Failed to update todo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.delete(`${baseUrl}/api/student/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-todos'] });
      toast.success('Todo deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting todo:', error);
      
      let errorMessage = 'Failed to delete todo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTodoMutation.mutate(newTodo);
  };

  const handleToggleComplete = (id, currentStatus) => {
    toggleCompleteTodoMutation.mutate({ id, completed: !currentStatus });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      deleteTodoMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTodo({
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      relatedCourse: '',
      relatedQuiz: '',
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Otherwise, format the date
    return date.toLocaleDateString();
  };

  // Sort todos by completion status and due date
  const sortedTodos = [...todos].sort((a, b) => {
    // First sort by completion status (incomplete first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then sort by due date (earliest first)
    const aDate = new Date(a.dueDate);
    const bDate = new Date(b.dueDate);
    return aDate - bDate;
  });

  // Calculate statistics
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const incompleteTodos = totalTodos - completedTodos;
  const highPriorityTodos = todos.filter(todo => todo.priority === 'high' && !todo.completed).length;
  
  // Calculate upcoming due dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueTodayCount = todos.filter(todo => {
    const dueDate = new Date(todo.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return !todo.completed && dueDate.getTime() === today.getTime();
  }).length;

  // Handle refresh
  const handleRefresh = () => {
    refetchTodos();
    coursesQuery.refetch();
    toast.success('Refreshed todo list');
  };

  // Display loading state
  if (isCoursesLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <CircularProgress />
      </div>
    );
  }

  // Display error state
  if (coursesError) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-4">
        <Alert severity="error" className="mb-4">
          <AlertTitle>Error loading courses</AlertTitle>
          {coursesError.message || "Please try again later."}
        </Alert>
        <Button 
          startIcon={<FaSyncAlt />} 
          variant="contained" 
          color="primary" 
          onClick={() => coursesQuery.refetch()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Display empty state
  if (!courses || courses.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-4">
        <Alert severity="info" className="mb-4">
          <AlertTitle>No Courses Found</AlertTitle>
          You are not currently enrolled in any courses.
        </Alert>
        <Button
          startIcon={<FaSearch />}
          variant="contained"
          color="primary"
          component={Link}
          to="/student/courses"
        >
          Browse Courses
        </Button>
      </div>
    );
  }

  if (isLoadingTodos) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (todosError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
        <p className="font-bold">Error loading to-do items</p>
        <p>{todosError.message || 'Failed to load to-do items. Please try again later.'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with stats and add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">My To-Do List</h2>
          <p className="text-gray-500 text-sm">
            {incompleteTodos} incomplete, {dueTodayCount} due today
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-blue-500 text-lg font-bold">{totalTodos}</div>
          <div className="text-gray-600 text-sm">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-green-500 text-lg font-bold">{completedTodos}</div>
          <div className="text-gray-600 text-sm">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-yellow-500 text-lg font-bold">{incompleteTodos}</div>
          <div className="text-gray-600 text-sm">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-red-500 text-lg font-bold">{highPriorityTodos}</div>
          <div className="text-gray-600 text-sm">High Priority</div>
        </div>
      </div>

      {/* Todo list */}
      {sortedTodos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500">
            Create your first to-do item to stay organized and track your progress.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTodos.map((todo) => (
            <div 
              key={todo._id} 
              className={`bg-white rounded-lg shadow-sm overflow-hidden border ${
                todo.completed ? 'border-gray-200 opacity-70' : 'border-gray-200'
              }`}
            >
              <div className="p-4 flex items-start">
                {/* Checkbox */}
                <div className="mr-4 mt-1">
                  <button
                    onClick={() => handleToggleComplete(todo._id, todo.completed)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      todo.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : `border-gray-300 bg-white hover:border-blue-500`
                    }`}
                  >
                    {todo.completed && <CheckIcon className="w-4 h-4" />}
                  </button>
                </div>

                {/* Todo content */}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.title}
                    </h3>
                    
                    {/* Priority badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[todo.priority]}`}>
                      {priorityLabels[todo.priority]}
                    </span>
                  </div>
                  
                  <p className={`text-sm mt-1 ${todo.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                    {todo.description || 'No description provided'}
                  </p>
                  
                  {/* Meta information */}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <div className={`flex items-center ${todo.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                      <ClockIcon className="w-4 h-4 mr-1" />
                      Due: {formatDate(todo.dueDate)}
                    </div>
                    
                    <div className={`flex items-center ${todo.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                      <BookOpenIcon className="w-4 h-4 mr-1" />
                      {todo.relatedCourse && (typeof todo.relatedCourse === 'object' 
                        ? todo.relatedCourse.title 
                        : 'Course')}
                    </div>
                    
                    {todo.relatedQuiz && (
                      <div className={`flex items-center ${todo.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                        <AcademicCapIcon className="w-4 h-4 mr-1" />
                        {typeof todo.relatedQuiz === 'object' 
                          ? todo.relatedQuiz.title 
                          : 'Quiz'}
                      </div>
                    )}
                    
                    {todo.completed && todo.completedAt && (
                      <div className="flex items-center text-green-500">
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Completed on {new Date(todo.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="ml-4 flex">
                  <button
                    onClick={() => handleDelete(todo._id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Todo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Task</h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newTodo.description}
                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="dueDate"
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={newTodo.priority}
                      onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="relatedCourse" className="block text-sm font-medium text-gray-700">
                    Related Course
                  </label>
                  <select
                    id="relatedCourse"
                    value={newTodo.relatedCourse}
                    onChange={(e) => setNewTodo({ ...newTodo, relatedCourse: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    )}
                    Add Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Todo; 