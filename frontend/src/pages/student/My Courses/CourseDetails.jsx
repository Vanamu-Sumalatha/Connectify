import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentIcon,
  LinkIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import ProgressBar from '../../../components/ui/ProgressBar';
import Confetti from '../../../components/ui/Confetti';

const CourseDetails = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeLesson, setActiveLesson] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const baseUrl = 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  // Check if course data was passed via location state
  const courseFromState = location.state?.course;
  
  // When course data is passed in location state, store it in localStorage 
  // to be able to show something even if API fails
  useEffect(() => {
    if (courseFromState) {
      localStorage.setItem(`course_${courseId}`, JSON.stringify(courseFromState));
    }
  }, [courseFromState, courseId]);

  // Load saved tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem(`course_tasks_${courseId}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Default tasks if none exist
      const defaultTasks = [
        { id: '1', text: 'Review course materials', completed: false },
        { id: '2', text: 'Complete first assignment', completed: false },
        { id: '3', text: 'Prepare questions for discussion', completed: false }
      ];
      setTasks(defaultTasks);
      localStorage.setItem(`course_tasks_${courseId}`, JSON.stringify(defaultTasks));
    }
  }, [courseId]);

  // Fetch enrolled course details
  const {
    data: course,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['enrolledCourse', courseId],
    queryFn: async () => {
      try {
      const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        try {
          console.log("Fetching course details for ID:", courseId);
          const response = await axios.get(`${baseUrl}/api/student/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
      });
          console.log("Course API response:", response.data);
          console.log("Course status:", response.data.status);
          console.log("Course progress:", response.data.progress);
          console.log("Completed lessons:", response.data.completedLessons);
          console.log("Total lessons:", response.data.totalLessons);
          return response.data;
        } catch (apiError) {
          console.error('API error:', apiError);
          
          // Try to use course from state if available
          if (courseFromState) {
            return courseFromState;
          }
          
          // Or try to retrieve from localStorage
          const savedCourse = localStorage.getItem(`course_${courseId}`);
          if (savedCourse) {
            return JSON.parse(savedCourse);
          }
          
          // Fallback data for demo purposes
          return {
            _id: courseId,
            title: 'Advanced JavaScript Programming',
            description: 'Master advanced JavaScript concepts including closures, prototypes, async/await, and modern ES6+ features.',
            thumbnail: '/assets/course-javascript.jpg',
            instructor: 'Course Instructor',
            progress: 35,
            status: 'in-progress',
            lastAccessed: new Date().toISOString(),
            materials: [
              { _id: 'm1', title: 'Course Syllabus', type: 'pdf', url: '#' },
              { _id: 'm2', title: 'JavaScript Cheat Sheet', type: 'pdf', url: '#' },
              { _id: 'm3', title: 'Code Repository', type: 'link', url: 'https://github.com/example/js-course' }
            ],
            lessons: []
          };
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
        toast.error('Failed to load course details');
        throw error;
      }
    },
    enabled: !!courseId, // Only run query if courseId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // --- NEW: Mutation hook for marking lesson complete ---
  const markLessonCompleteMutation = useMutation({
    mutationFn: async (lessonId) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.put(
        `${baseUrl}/api/student/courses/${courseId}/lessons/${lessonId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // Check for non-OK status if backend doesn't throw error on failure
      if (response.status !== 200 && response.status !== 204) {
        throw new Error(response.data?.message || `API request failed with status ${response.status}`);
      }
      return response.data; // Return data if backend sends any
    },
    onMutate: async (lessonId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['enrolledCourse', courseId] });

      // Snapshot the previous value
      const previousCourseData = queryClient.getQueryData(['enrolledCourse', courseId]);

      // Optimistically update to the new value
      if (previousCourseData) {
        const updatedLessons = previousCourseData.lessons.map(lesson =>
          lesson._id === lessonId
            ? { ...lesson, completed: true }
            : lesson
        );
        const completedLessons = updatedLessons.filter(lesson => lesson.completed).length;
        const totalLessons = updatedLessons.length;
        const newProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        let newStatus = previousCourseData.status;
        if (newProgress === 100) {
          newStatus = 'completed';
        } else if (newProgress > 0 && previousCourseData.status !== 'completed') {
          newStatus = 'in-progress';
        }

        queryClient.setQueryData(['enrolledCourse', courseId], {
          ...previousCourseData,
          lessons: updatedLessons,
          progress: newProgress,
          status: newStatus,
          // Update derived fields if backend doesn't return them
          completedLessons: completedLessons,
          totalLessons: totalLessons
        });
      } 
      // Return a context object with the snapshotted value
      return { previousCourseData };
    },
    onError: (err, lessonId, context) => {
      // Rollback on error
      if (context?.previousCourseData) {
        queryClient.setQueryData(['enrolledCourse', courseId], context.previousCourseData);
      }
      toast.error(err.message || 'Failed to mark lesson as complete');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['enrolledCourse', courseId] });
    },
    onSuccess: (data, lessonId, context) => {
       // Optionally use data returned from backend if needed
       toast.success('Lesson marked as complete!');
       
       // Check if course is now complete based on optimistic update (or returned data)
       const currentCourseData = queryClient.getQueryData(['enrolledCourse', courseId]);
       if (currentCourseData?.progress === 100 && context?.previousCourseData?.status !== 'completed') {
          toast.success('Congratulations! You have completed this course! 🎉', {
            duration: 5000,
            icon: '🎓'
          });
          setShowConfetti(true); // Trigger confetti
       }
    }
  });
  // --- END: Mutation hook ---

  const handleLessonClick = (lesson) => {
    setActiveLesson(lesson);
    setActiveTab('content');
  };

  // NEW handleMarkLessonComplete using the mutation hook
  const handleMarkLessonComplete = (lessonId) => {
     if (!lessonId) {
         console.error("Mark as Complete: Invalid lessonId provided.");
         toast.error("Cannot mark lesson complete: Invalid ID.");
         return;
     }
     // Trigger the mutation
     markLessonCompleteMutation.mutate(lessonId);
  };

  // OLD handleMarkLessonComplete function is effectively replaced above
  /*
  const handleMarkLessonComplete = async (lessonId) => { ... }; 
  */

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing course details...');
  };

  // Add handleAddTask, handleToggleTask, and handleDeleteTask functions
  const handleAddTask = () => {
    if (newTask.trim() !== '') {
      const updatedTasks = [
        ...tasks,
        { id: Date.now().toString(), text: newTask, completed: false }
      ];
      setTasks(updatedTasks);
      localStorage.setItem(`course_tasks_${courseId}`, JSON.stringify(updatedTasks));
      setNewTask('');
    }
  };

  const handleToggleTask = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem(`course_tasks_${courseId}`, JSON.stringify(updatedTasks));
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem(`course_tasks_${courseId}`, JSON.stringify(updatedTasks));
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />
            <div>
              <p className="text-red-700 font-medium">Error loading course details</p>
              <p className="text-red-600">{error.message || 'An error occurred while loading the course details.'}</p>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            className="mt-2 flex items-center text-red-600 hover:text-red-800"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Try Again
          </button>
        </div>
        <Link
          to="/student/courses"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add Confetti component */}
      <Confetti show={showConfetti} duration={6000} />
      
      {/* Navigation */}
      <div className="mb-6">
        <Link
          to="/student/courses"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to My Courses
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Course Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-40">
                <img
                  src={course?.thumbnail || '/assets/course-placeholder.jpg'}
                  alt={course?.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/assets/course-placeholder.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <h1 className="text-xl font-bold text-white text-center px-4">{course?.title}</h1>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <ProgressBar 
                    progress={course?.progress || 0} 
                    status={course?.status || 'not-started'}
                    completedCount={course?.lessons?.filter(lesson => lesson.completed).length || 0}
                    totalCount={course?.lessons?.length || 0}
                    showDetails={true}
                    size="md"
                    label="Your Progress"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <AcademicCapIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{course?.instructor}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpenIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{course?.lessons?.length || 0} lessons</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>
                      {course?.lessons?.reduce((total, lesson) => total + (lesson.duration || 0), 0) || 0} minutes
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleRefresh}
                    className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                  >
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Refresh Course
                    </div>
                  </button>
              </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                </button>
                <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'content'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('content')}
                  >
                    Course Content
                </button>
                <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'tasks'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('tasks')}
                  >
                    Tasks
                </button>
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'materials'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('materials')}
                  >
                    Materials
                  </button>
                </nav>
            </div>
        </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Course Overview</h2>
                <p className="text-gray-700 mb-6">{course?.description}</p>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Course Status</h3>
                  <div className="flex items-center">
                    <span 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        course?.progress >= 100 && course?.completedLessons >= course?.totalLessons ? 'bg-green-100 text-green-800' : 
                        course?.completedLessons > 0 || course?.progress > 0 ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {course?.progress >= 100 && course?.completedLessons >= course?.totalLessons ? 'Completed' : 
                       course?.completedLessons > 0 || course?.progress > 0 ? 'In Progress' : 
                       'Not Started'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Your Progress</h3>
                  <ProgressBar 
                    progress={course?.progress || 0} 
                    status={course?.progress >= 100 && course?.completedLessons >= course?.totalLessons ? 'completed' : 
                           course?.completedLessons > 0 || course?.progress > 0 ? 'in-progress' : 'not-started'}
                    completedCount={course?.completedLessons || 0}
                    totalCount={course?.totalLessons || 0}
                    showDetails={true}
                    size="lg"
                    label="Course Progress"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Last Accessed</h3>
                  <p className="text-gray-700">
                    {course?.lastAccessed ? new Date(course.lastAccessed).toLocaleString() : 'Never'}
                  </p>
            </div>
          </div>
            )}

            {activeTab === 'content' && !activeLesson && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Course Content</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {course?.completedLessons || 0} of {course?.totalLessons || 0} lessons completed • {Math.round(course?.progress || 0)}% complete
                </p>
                
                {course?.lessons && course.lessons.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    {course.lessons.map((lesson, index) => (
                      <div 
                        key={lesson._id} 
                        className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } ${lesson.completed ? 'border-l-4 border-green-500' : ''}`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                            lesson.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {lesson.completed ? (
                              <CheckCircleIcon className="h-5 w-5" />
                            ) : (
                              lesson.lessonNumber || index + 1
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <div className="flex items-center">
                              <p className="text-sm text-gray-500 mr-2">{lesson.duration} minutes</p>
                              {lesson.completed && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {lesson.completed ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <PlayIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-gray-500">No lessons available for this course yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Please check back later for updates.</p>
                  </div>
                )}
                
                {/* Progress Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Course Progress</h3>
                  <ProgressBar 
                    progress={course?.progress || 0} 
                    status={course?.progress >= 100 && course?.completedLessons >= course?.totalLessons ? 'completed' : 
                           course?.completedLessons > 0 || course?.progress > 0 ? 'in-progress' : 'not-started'}
                    completedCount={course?.completedLessons || 0}
                    totalCount={course?.totalLessons || 0}
                    showDetails={true}
                    size="lg"
                  />
                  
                  <div className="mt-3 flex justify-between items-center">
                    <p className="text-sm text-blue-700">
                      {course?.progress >= 100 && course?.completedLessons >= course?.totalLessons 
                        ? 'You have completed this course!' 
                        : `Complete ${(course?.totalLessons || 0) - (course?.completedLessons || 0)} more lessons to finish this course.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && activeLesson && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">{activeLesson.title}</h2>
                  <button
                    onClick={() => setActiveLesson(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
          </div>

                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={activeLesson.videoUrl}
                    title={activeLesson.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-gray-700">{activeLesson.duration} minutes</span>
                    </div>
                    
                    <button
                      onClick={() => handleMarkLessonComplete(activeLesson._id)}
                      disabled={activeLesson.completed || markLessonCompleteMutation.isPending}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                        activeLesson.completed
                          ? 'bg-green-100 text-green-800 cursor-default'
                          : markLessonCompleteMutation.isPending 
                            ? 'bg-gray-400 text-gray-700 cursor-wait'
                            : 'text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all transform hover:scale-105 animate-pulse'
                      }`}
                    >
                      {markLessonCompleteMutation.isPending ? (
                         <>
                           <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                           Updating...
                         </>
                      ) : activeLesson?.completed ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </button>
                  </div>

                  {!activeLesson.completed && (
                    <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded">
                      <div className="flex">
                        <div className="py-1">
                          <svg className="h-6 w-6 text-yellow-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold">Important</p>
                          <p className="text-sm">Make sure to watch the entire video before marking this lesson as complete to track your progress accurately.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-gray-700 mb-4">
                    This lesson covers {activeLesson.title.split(': ')[1] || 'important concepts'} in detail.
                  </p>
                  
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={() => {
                        const currentIndex = course.lessons.findIndex(l => l._id === activeLesson._id);
                        if (currentIndex > 0) {
                          setActiveLesson(course.lessons[currentIndex - 1]);
                        }
                      }}
                      disabled={course.lessons.findIndex(l => l._id === activeLesson._id) === 0}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous Lesson
                    </button>
                    
                    <button
                      onClick={() => {
                        const currentIndex = course.lessons.findIndex(l => l._id === activeLesson._id);
                        if (currentIndex < course.lessons.length - 1) {
                          setActiveLesson(course.lessons[currentIndex + 1]);
                        }
                      }}
                      disabled={course.lessons.findIndex(l => l._id === activeLesson._id) === course.lessons.length - 1}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next Lesson
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Course Tasks</h2>
                <p className="text-sm text-gray-500 mb-4">Keep track of your to-do items for this course</p>
                
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Add a new task..."
                      className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <button
                      onClick={handleAddTask}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No tasks added yet</div>
                  ) : (
                    tasks.map((task) => (
                      <div 
                        key={task.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span 
                            className={`ml-3 ${
                              task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                            }`}
                          >
                            {task.text}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                {tasks.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500">
                    {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
                  </div>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Course Materials</h2>
                
                {!course.materials || course.materials.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <p>No materials available for this course yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Documents Section */}
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-medium mb-3 border-b pb-2">Documents</h3>
                      <div className="space-y-3 mb-6">
                        {course.materials.filter(m => m.type === 'document').length === 0 ? (
                          <p className="text-sm text-gray-500">No documents available</p>
                        ) : (
                          course.materials
                            .filter(m => m.type === 'document')
                            .map((material, index) => (
                              <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{material.title}</h4>
                                  {material.description && (
                                    <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                  )}
                                  <div className="mt-2">
                                    <a 
                                      href={material.documentUrl || material.url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                    >
                                      <span>View Document</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Videos Section */}
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-medium mb-3 border-b pb-2">Video References</h3>
                      <div className="space-y-3 mb-6">
                        {course.materials.filter(m => m.type === 'video').length === 0 ? (
                          <p className="text-sm text-gray-500">No video references available</p>
                        ) : (
                          course.materials
                            .filter(m => m.type === 'video')
                            .map((material, index) => (
                              <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="bg-red-100 text-red-600 p-2 rounded-lg mr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{material.title}</h4>
                                  {material.description && (
                                    <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                  )}
                                  <div className="mt-2">
                                    <a 
                                      href={material.videoUrl || material.url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
                                    >
                                      <span>Watch Video</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Roadmap Section */}
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-medium mb-3 border-b pb-2">Learning Roadmap</h3>
                      <div className="space-y-3">
                        {course.materials.filter(m => m.type === 'roadmap').length === 0 ? (
                          <p className="text-sm text-gray-500">No roadmap content available</p>
                        ) : (
                          course.materials
                            .filter(m => m.type === 'roadmap')
                            .map((material, index) => (
                              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">{material.title}</h4>
                                {material.description && (
                                  <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                                )}
                                <div className="prose prose-sm max-w-none">
                                  <div className="whitespace-pre-line">
                                    {material.roadmapContent || material.url}
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails; 