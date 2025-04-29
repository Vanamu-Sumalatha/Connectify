import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { baseUrl } from '../../../config.js';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  TrophyIcon,
  ArrowRightIcon,
  QuestionMarkCircleIcon,
  ListBulletIcon,
  BookOpenIcon,
  InformationCircleIcon,
  PlayIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Todo from './Todo';
import QuizForm from './QuizForm';
import QuizResults from './QuizResults';

const Assignments = () => {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'todo'
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'quiz':
        return <AssignmentsTab />;
      case 'todo':
        return <Todo />;
      default:
        return <AssignmentsTab />;
    }
  };

  // Function to handle quiz completion
  const handleQuizComplete = (updatedQuiz) => {
    // Update the quiz in the courseQuizzes state
    setCourseQuizzes((prevState) => {
      const newState = { ...prevState };
      const courseId = updatedQuiz.courseId;
      
      if (newState[courseId]) {
        newState[courseId] = newState[courseId].map((quiz) =>
          quiz._id === updatedQuiz._id ? updatedQuiz : quiz
        );
      }
      
      return newState;
    });
    
    // Close the quiz form and show results
    setShowQuizForm(false);
    setSelectedQuiz(updatedQuiz);
    setShowQuizResults(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Academic Management</h1>
      </div>

      {/* Tab navigation */}
      <div className="flex space-x-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-2 flex items-center transition-all duration-300 ${
            activeTab === 'quiz'
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <DocumentTextIcon className="w-5 h-5 mr-2" />
          Quiz
        </button>
        <button
          onClick={() => setActiveTab('todo')}
          className={`px-4 py-2 flex items-center transition-all duration-300 ${
            activeTab === 'todo'
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListBulletIcon className="w-5 h-5 mr-2" />
          To-Do
        </button>
      </div>

      {/* Tab content */}
      {renderTabContent()}

      {/* Quiz Form Modal */}
      {showQuizForm && selectedQuiz && (
        <QuizForm
          quiz={selectedQuiz}
          onClose={() => {
            setShowQuizForm(false);
            setSelectedQuiz(null);
          }}
          onComplete={handleQuizComplete}
        />
      )}
      
      {/* Quiz Results Modal */}
      {showQuizResults && selectedQuiz && (
        <QuizResults
          quiz={selectedQuiz}
          onClose={() => {
            setShowQuizResults(false);
            setSelectedQuiz(null);
          }}
        />
      )}
    </div>
  );
};

// AssignmentsTab component containing the old assignments functionality
const AssignmentsTab = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseQuizzes, setCourseQuizzes] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const [usingStaticData, setUsingStaticData] = useState(false);
  const navigate = useNavigate(); // Hook for SPA navigation

  // Fetch enrolled courses with filter options
  const { 
    data: enrolledDetailedCourses = [], 
    isLoading: isLoadingEnrolledDetailedCourses,
    error: enrolledDetailedCoursesError,
    refetch: refetchEnrolledDetailedCourses
  } = useQuery({
    queryKey: ['enrolled-detailed-courses'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

          const response = await axios.get(
          `${baseUrl}/api/student/courses/enrolled`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.data) {
          console.warn('No data returned from enrolled detailed courses API');
          return [];
        }
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch enrolled detailed courses:', error);
        throw error;
      }
    },
    retry: 1,
  });

  // Fetch all quizzes
  const { 
    data: quizzes = [], 
    isLoading: isLoadingQuizzes,
    error: quizzesError,
    refetch: refetchQuizzes
  } = useQuery({
    queryKey: ['all-admin-quizzes-for-student-view'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Fetching quizzes from the ADMIN endpoint as requested
        const response = await axios.get(
            `${baseUrl}/api/admin/quizzes`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        
        console.log("Admin quizzes API response (for student view):", response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          console.warn('No quizzes returned from admin API or invalid format');
          return []; // Return empty array if data is not as expected
        }
        
        // No need to filter for type if fetching directly from admin quiz endpoint
        const adminQuizzes = response.data;
        
        // Transform the data to normalize structure 
        const transformedQuizzes = adminQuizzes.map(quiz => {
          const courseIdObj = quiz.courseId || {};
          const courseId = typeof courseIdObj === 'object' ? courseIdObj._id : courseIdObj;
          
          return {
            _id: quiz._id,
            title: quiz.title,
            course: quiz.course || quiz.courseId, // Keep original reference if needed
            courseId: courseId || quiz.courseId, // Use extracted ID
            courseTitle: courseIdObj.title || quiz.courseTitle || 'Unknown Course',
            courseCode: courseIdObj.code || quiz.courseCode,
            timeLimit: quiz.timeLimit || quiz.duration || 30,
            totalPoints: quiz.totalPoints || quiz.points || 100,
            dueDate: quiz.dueDate || quiz.deadline,
            // Determine status/completed based on student-specific data if available elsewhere
            // For now, assume pending unless backend provides student-specific status
            status: quiz.status || 'pending', 
            completed: quiz.completed || false, // This likely needs student-specific data
            questions: quiz.questions || [],
            questionCount: quiz.questions?.length || quiz.questionCount || 0, 
            createdAt: quiz.createdAt,
            // Assuming admin quizzes might not have student-specific fields like certificateAvailable readily
            certificateAvailable: quiz.certificateAvailable || false,
            type: 'quiz' // Ensure type is set
          };
        });
        
        console.log("Transformed admin quizzes:", transformedQuizzes);
        return transformedQuizzes;
      } catch (error) {
        console.error('Failed to fetch admin quizzes for student view:', error);
        // Handle specific errors like 403 Forbidden
        if (error.response?.status === 403) {
           console.error('ACCESS DENIED: Student role cannot fetch /api/admin/quizzes.');
           toast.error("You don't have permission to view all quizzes.");
           return []; // Return empty on permission error
        } else if (error.response?.status === 404) {
           console.warn('/api/admin/quizzes endpoint not found.');
           return [];
        }
        // For other errors, return empty array
        return [];
      }
    },
    retry: 1, // Maybe set retry to 0 or 1 for permission errors
  });

  // Filter courses by completion status
  const completedCourses = enrolledDetailedCourses.filter(course => course.status === 'completed');
  const inProgressCourses = enrolledDetailedCourses.filter(course => course.status === 'in-progress');
  const notStartedCourses = enrolledDetailedCourses.filter(course => course.status === 'not-started');
  
  // All courses for reference
  const allCourses = enrolledDetailedCourses;

  // Check if any quizzes exist without course association
  const hasUnassociatedQuizzes = quizzes.some(quiz => {
    // If the quiz has no course or its course doesn't exist in enrolledDetailedCourses
    const quizCourseId = typeof quiz.course === 'object' ? quiz.course?._id : quiz.course;
    if (!quizCourseId) return true;
    
    return !enrolledDetailedCourses.some(course => course._id === quizCourseId);
  });

  // Count quizzes without proper course association
  const unassociatedQuizzesCount = quizzes.filter(quiz => {
    const quizCourseId = typeof quiz.course === 'object' ? quiz.course?._id : quiz.course;
    if (!quizCourseId) return true;
    
    return !enrolledDetailedCourses.some(course => course._id === quizCourseId);
  }).length;

  // Handle refresh
  const handleRefresh = () => {
    refetchEnrolledDetailedCourses();
    refetchQuizzes();
    toast.success('Refreshed quizzes and courses');
  };

  // Simplified check if a course has quizzes
  const courseHasQuizzes = (courseId) => {
    if (!courseId || !quizzes || quizzes.length === 0) return false;
    // Check if any quiz in the fetched list matches the courseId
    return quizzes.some(quiz => {
      const quizCourseId = typeof quiz.course === 'object' ? quiz.course?._id : quiz.courseId;
      return quizCourseId === courseId;
    });
  };

  // Simplified function to get quizzes for a specific course
  const getQuizzesForCourse = (courseId) => {
    if (!courseId || !quizzes || quizzes.length === 0) return [];
    // Filter quizzes from the fetched list that match the courseId
    return quizzes.filter(quiz => {
      const quizCourseId = typeof quiz.course === 'object' ? quiz.course?._id : quiz.courseId;
      return quizCourseId === courseId;
    });
  };

  // --- ADD BACK isQuizCompleted function ---
  const isQuizCompleted = (quizId) => {
    // Find the quiz in the main list fetched from the API
    const quiz = quizzes.find(q => q._id === quizId);
    // Check the status based on the fetched data.
    // WARNING: This status comes from /api/admin/quizzes and may NOT reflect 
    // the current student's completion status accurately.
    // It likely defaults to false based on the current data transformation.
    return quiz?.status === 'completed' || quiz?.completed === true; 
  };
  // --- END Add back --- 

  // Handle taking a specific quiz
  const handleTakeQuiz = (quizId) => {
    if (quizId) {
      console.log("Navigating to quiz:", quizId);
      // Update the path to point to the QuizAttempt component in the Assignments & To-Do folder
      navigate(`/student/assignments/quiz/${quizId}`); 
    } else {
      toast.error('Quiz not found or invalid ID');
    }
  };

  // Re-add toggle function
  const toggleCourseQuizzes = (courseId) => {
    setExpandedCourse(prev => (prev === courseId ? null : courseId));
  };

  // Format due date helper function
  const formatDueDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate.getTime() === today.getTime()) {
      return 'Due Today';
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return 'Due Tomorrow';
    } else if (dueDate < today) {
      return 'Overdue';
    } else {
      return `Due ${date.toLocaleDateString()}`;
    }
  };

  // Format created date
  const formatCreatedDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    
    try {
      const date = new Date(dateStr);
      return `Created ${date.toLocaleDateString()}`;
    } catch (error) {
      return 'Recent';
    }
  };

  // Debugging useEffect - simplified to show counts based on filtered data
  useEffect(() => {
    enrolledDetailedCourses.forEach(course => {
      const courseId = course._id;
      const relevantQuizzes = getQuizzesForCourse(courseId);
      const quizCount = relevantQuizzes.length;
      // Use the simplified courseHasQuizzes check
      const hasQuizzes = courseHasQuizzes(courseId);
      console.log(`Course "${course.title}" (${courseId}): ${quizCount} quizzes found via courseId match, hasQuizzes check: ${hasQuizzes}`);
    });
  // Update dependencies if necessary, courseQuizzes state might be removed later if not needed elsewhere
  }, [quizzes, enrolledDetailedCourses]);

  // Loading state
  if (isLoadingEnrolledDetailedCourses || isLoadingQuizzes) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (enrolledDetailedCoursesError || quizzesError) {
  return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
        <div className="flex">
          <div className="py-1">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-4" />
        </div>
          <div>
            <p className="font-bold">Unable to load data</p>
            <p className="text-sm">
              {enrolledDetailedCoursesError ? enrolledDetailedCoursesError.message : quizzesError ? quizzesError.message : 'Unknown error occurred'}
            </p>
            <div className="mt-3 flex space-x-3">
          <button
            onClick={handleRefresh}
                className="bg-red-700 hover:bg-red-800 text-white py-1 px-3 rounded text-sm"
          >
                Try Again
          </button>
            <button
              onClick={() => {
                  // Navigate back to dashboard or previous page
                  window.history.back();
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded text-sm"
              >
                Back to Dashboard
            </button>
        </div>
      </div>
        </div>
      </div>
    );
  }

  // No courses state
  if (allCourses.length === 0) {
    return (
      <div>
        {/* Header with refresh button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Quiz Assignments</h2>
            <p className="text-gray-500 text-sm">
              Quizzes from your enrolled courses
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md transition-colors"
            title="Refresh data"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpenIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Courses Found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You're not currently enrolled in any courses. Once you enroll in courses, their quizzes will appear here.
          </p>
          <Link to="/student/courses" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Browse Available Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Quiz Assignments</h2>
          <p className="text-gray-500 text-sm">
            Quizzes from your enrolled courses
          </p>
        </div>
        <div className="flex gap-2">
          {hasUnassociatedQuizzes && (
          <button
              onClick={() => setShowAllQuizzes(!showAllQuizzes)}
              className="flex items-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md transition-colors"
              title={showAllQuizzes ? "Show by courses" : "Show all quizzes"}
            >
              <DocumentTextIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">{showAllQuizzes ? "Group by Course" : "Show All Quizzes"}</span>
          </button>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md transition-colors"
            title="Refresh data"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Courses progress summary */}
      {allCourses.length > 0 && !showAllQuizzes && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <AcademicCapIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Your Learning Journey</h3>
                  <p className="text-gray-600">
                    {completedCourses.length > 0 
                      ? `You've completed ${completedCourses.length} ${completedCourses.length === 1 ? 'course' : 'courses'}`
                      : 'Start completing courses to track your progress'}
                    {inProgressCourses.length > 0 && ` and have ${inProgressCourses.length} in progress`}
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-0 flex items-center">
                  <div className="w-full max-w-[150px] bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(completedCourses.length / Math.max(allCourses.length, 1)) * 100}%` }}
                    ></div>
                </div>
                  <span className="text-sm text-gray-600">
                    {Math.round((completedCourses.length / Math.max(allCourses.length, 1)) * 100)}%
                  </span>
                  </div>
                  </div>
            </div>
          </div>
        </div>
      )}

      {/* Show All Quizzes Table View */}
      {showAllQuizzes && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-8">
          <div className="flex items-center bg-gray-50 p-4 border-b border-gray-200">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">All Available Quizzes</h3>
            {unassociatedQuizzesCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {unassociatedQuizzesCount} quizzes
                      </span>
                    )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quizzes.map((quiz) => {
                  const completed = isQuizCompleted(quiz._id);
                  
                  return (
                    <tr key={quiz._id} className={completed ? "bg-green-50" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                          <div className="text-xs text-gray-500">{formatCreatedDate(quiz.createdAt)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{quiz.courseTitle || "Unknown"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {quiz.type || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDueDate(quiz.dueDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-xs text-gray-600">
                          <div>{quiz.questionCount || quiz.questions?.length || 1} questions</div>
                          <div>{quiz.totalPoints || quiz.points || 100} points total</div>
                          <div>{quiz.timeLimit || quiz.duration || 30} minutes</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleTakeQuiz(quiz._id)}
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            completed 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {completed ? 'Review' : 'Take Quiz'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
                  </div>
                </div>
      )}

      {!showAllQuizzes && (
        <>
          {/* Show unassociated quizzes at the top if they exist */}
          {hasUnassociatedQuizzes && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-6 w-6 text-purple-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">All Available Quizzes</h3>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {unassociatedQuizzesCount} quizzes
                </span>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100 overflow-hidden shadow-sm">
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-4">
                    You have quizzes available that aren't associated with specific courses. Click below to view all your available quizzes.
                  </p>
                  <button
                    onClick={() => setShowAllQuizzes(true)}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium"
                  >
                    View All Quizzes in Table Format
                  </button>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quizzes.slice(0, 3).map((quiz, index) => {
                      const completed = isQuizCompleted(quiz._id);
                      return (
                        <div 
                          key={quiz._id} 
                          className={`bg-white rounded-lg border ${completed ? 'border-green-200' : 'border-gray-200'} p-3 flex flex-col`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-800">{quiz.title}</h4>
                            {completed && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            )}
                    </div>
                          <div className="text-xs text-gray-500 mb-2">Course: {quiz.courseTitle || "Unknown"}</div>
                          <div className="text-xs text-gray-500 mb-auto">
                            {quiz.questionCount || quiz.questions?.length || 1} questions • {quiz.totalPoints || 100} points • {quiz.timeLimit || 30} min
                          </div>
                          <button
                            onClick={() => handleTakeQuiz(quiz._id)}
                            className={`mt-2 w-full py-1.5 px-3 rounded text-xs font-medium ${
                              completed 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {completed ? 'Review Quiz' : 'Take Quiz'}
                          </button>
                        </div>
                      );
                    })}
                    {quizzes.length > 3 && (
                      <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col justify-center items-center">
                        <span className="text-sm text-gray-500 mb-2">+{quizzes.length - 3} more quizzes</span>
                        <button
                          onClick={() => setShowAllQuizzes(true)}
                          className="text-sm text-purple-600 hover:text-purple-800"
                        >
                          View All
                        </button>
                  </div>
                )}
              </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Completed Courses Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Completed Courses</h3>
        </div>
            
            {completedCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedCourses.map(course => {
                  const courseId = course._id;
                  const courseQuizzes = getQuizzesForCourse(courseId);
                  const hasQuizzes = courseHasQuizzes(courseId);
                  const allQuizzesCompleted = hasQuizzes && courseQuizzes.every(q => isQuizCompleted(q._id));
                  
                  console.log(`Rendering completed course ${course.title}: hasQuizzes=${hasQuizzes}, quizCount=${courseQuizzes.length}`);
                  
                  return (
                    <div key={course._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      {/* Course Image */}
                      <div className="relative h-40 w-full bg-gray-200"> 
                        <img
                          src={course.thumbnail || '/assets/course-placeholder.jpg'} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/assets/course-placeholder.jpg'; }}
                        />
                      </div>
                      
                      {/* Course Content Area */}
                      <div className="p-4 flex-grow">
                        {/* Title Below Image */}
                        <h4 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2" title={course.title}>{course.title}</h4>
                        
                        {/* Status Badge - Updated */}
                        <div className="mb-3">
                            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Completed
                            </span>
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-1.5 text-sm text-gray-600">
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>Level: {course.level || 'Beginner'}</span>
                          </div>
                          <div className="flex items-center">
                            <BookOpenIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>{course.completedLessons || course.totalLessons || 0}/{course.totalLessons || 0} Lessons</span>
                          </div>
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>{courseQuizzes.length} {courseQuizzes.length === 1 ? 'Quiz' : 'Quizzes'} Available</span>
                          </div>
                          </div>
                        </div>
                        
                      {/* Footer Button/Popover Area */}
                      <div className="p-3 border-t border-gray-100 bg-gray-50 relative"> 
                          {hasQuizzes ? (
                    <button
                              onClick={() => toggleCourseQuizzes(course._id)}
                             className={`w-full py-1.5 px-3 rounded text-white font-medium text-xs transition-colors ${allQuizzesCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}
                             aria-expanded={expandedCourse === course._id}
                             aria-controls={`quiz-popover-${courseId}`}
                          >
                             {expandedCourse === course._id ? 'Hide Quizzes' : 'Review Quizzes'}
                    </button>
                          ) : (
                           <button disabled className="w-full py-1.5 px-3 rounded text-gray-400 font-medium text-xs bg-gray-200 cursor-not-allowed">
                              No Quizzes Found
                    </button>
                          )}
                        {/* Quiz Popover (remains the same) */}
                        {expandedCourse === course._id && hasQuizzes && (
                           <div 
                             id={`quiz-popover-${courseId}`} 
                             className="absolute bottom-full left-0 mb-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-72 flex flex-col"
                           >
                              {/* Popover Header */} 
                              <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                                <h5 className="text-sm font-medium text-gray-700">Quizzes for this Course</h5>
                  </div>
                        
                              {/* Quiz List Area */} 
                              <div className="overflow-y-auto flex-grow">
                                {courseQuizzes.length > 0 ? (
                                  <ul className="divide-y divide-gray-100">
                                     {courseQuizzes.map((quiz) => {
                                const completed = isQuizCompleted(quiz._id);
                                return (
                                           <li key={quiz._id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                              <div className="flex justify-between items-center space-x-2">
                                                 {/* Left Side: Icon + Info */}
                                                 <div className="flex items-center space-x-2 min-w-0">
                                                    <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                       <DocumentTextIcon className="h-5 w-5"/>
                </div>
                                                    <div className="flex-1 min-w-0">
                                                       <p className="text-sm font-medium text-gray-900 truncate" title={quiz.title}>{quiz.title}</p>
                                                       <p className="text-xs text-gray-500">
                                                          {quiz.questionCount || '?'} Qs • {quiz.timeLimit || '?'} min 
                                                          {completed && <span className="ml-2 text-green-600 font-medium">✓ Completed</span>}
                                                       </p>
                  </div>
                                            </div>
                                                 {/* Right Side: Button */}
                                      <button 
                                        onClick={() => handleTakeQuiz(quiz._id)}
                                                    className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded transition-colors ${completed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                                 >
                                                    Review
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                                ) : (
                                  <p className="text-sm text-gray-500 text-center px-4 py-6">No quizzes found.</p>
                                )}
                              </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-gray-500">You haven't completed any courses yet.</p>
              </div>
            )}
          </div>
          
          {/* In Progress Courses Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-6 w-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">In Progress Courses</h3>
            </div>
            
            {inProgressCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressCourses.map(course => {
                  const courseId = course._id;
                  const courseQuizzes = getQuizzesForCourse(courseId);
                  const hasQuizzes = courseHasQuizzes(courseId);
                  const completedQuizzes = courseQuizzes.filter(q => isQuizCompleted(q._id)).length;
                  
                  console.log(`Rendering in-progress course ${course.title}: hasQuizzes=${hasQuizzes}, quizCount=${courseQuizzes.length}`);
                  
                  return (
                    <div key={course._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      {/* Course Image */}
                      <div className="relative h-40 w-full bg-gray-200"> 
                        <img
                          src={course.thumbnail || '/assets/course-placeholder.jpg'}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/assets/course-placeholder.jpg'; }}
                        />
                      </div>
                      
                      {/* Course Content Area */}
                      <div className="p-4 flex-grow">
                        {/* Title Below Image */}
                        <h4 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2" title={course.title}>{course.title}</h4>
                        
                        {/* Status Badge - Updated */}
                        <div className="mb-1">
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                             <ClockIcon className="h-4 w-4 mr-1" />
                              In Progress
                  </span>
                </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                           <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${course.progress || 0}%` }}></div>
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-1.5 text-sm text-gray-600">
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>Level: {course.level || 'Beginner'}</span>
                          </div>
                          <div className="flex items-center">
                            <BookOpenIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>{course.completedLessons || 0}/{course.totalLessons || 0} Lessons</span>
                          </div>
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>
                              {courseQuizzes.length} {courseQuizzes.length === 1 ? 'Quiz' : 'Quizzes'} Available
                              {hasQuizzes && completedQuizzes > 0 && ` (${completedQuizzes} completed)`}
                            </span>
                          </div>
                          </div>
                        </div>
                        
                      {/* Footer Button/Popover Area */}
                      <div className="p-3 border-t border-gray-100 bg-gray-50 relative">
                          {hasQuizzes ? (
                            <button
                              onClick={() => toggleCourseQuizzes(course._id)}
                              className="w-full py-1.5 px-3 rounded text-white font-medium text-xs bg-blue-600 hover:bg-blue-700 transition-colors"
                              aria-expanded={expandedCourse === course._id}
                              aria-controls={`quiz-popover-${courseId}`}
                            >
                              {expandedCourse === course._id ? 'Hide Quizzes' : 'View Course Quizzes'}
                            </button>
                          ) : (
                            <button disabled className="w-full py-1.5 px-3 rounded text-gray-400 font-medium text-xs bg-gray-200 cursor-not-allowed">
                              No Quizzes Available
                </button>
                          )}
                         {/* Quiz Popover (remains the same) */}
                         {expandedCourse === course._id && hasQuizzes && (
                            <div 
                              id={`quiz-popover-${courseId}`} 
                              className="absolute bottom-full left-0 mb-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-72 flex flex-col"
                            >
                              {/* Popover Header */} 
                              <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                                 <h5 className="text-sm font-medium text-gray-700">Quizzes for this Course</h5>
              </div>
                        
                              {/* Quiz List Area */} 
                              <div className="overflow-y-auto flex-grow">
                                {courseQuizzes.length > 0 ? (
                                  <ul className="divide-y divide-gray-100">
                                     {courseQuizzes.map((quiz) => {
                                const completed = isQuizCompleted(quiz._id);
                                return (
                                           <li key={quiz._id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                              <div className="flex justify-between items-center space-x-2">
                                                 {/* Left Side: Icon + Info */}
                                                 <div className="flex items-center space-x-2 min-w-0">
                                                    <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                       <DocumentTextIcon className="h-5 w-5"/>
                                        </div>
                                                    <div className="flex-1 min-w-0">
                                                       <p className="text-sm font-medium text-gray-900 truncate" title={quiz.title}>{quiz.title}</p>
                                                       <p className="text-xs text-gray-500">
                                                          {quiz.questionCount || '?'} Qs • {quiz.timeLimit || '?'} min 
                                                          {completed && <span className="ml-2 text-green-600 font-medium">✓ Completed</span>}
                                                       </p>
                                          </div>
            </div>
                                                 {/* Right Side: Button */}
                                      <button 
                                        onClick={() => handleTakeQuiz(quiz._id)}
                                                    className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded transition-colors ${completed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                                 >
                                                    Review
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                                ) : (
                                  <p className="text-sm text-gray-500 text-center px-4 py-6">No quizzes found.</p>
                                )}
                              </div>
        </div>
      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-gray-500">You don't have any courses in progress.</p>
              </div>
            )}
          </div>
          
          {/* Not Started Courses Section */}
          {notStartedCourses.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <BookOpenIcon className="h-6 w-6 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Not Started Courses</h3>
                </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {notStartedCourses.map(course => {
                  const courseId = course._id;
                  const courseQuizzes = getQuizzesForCourse(courseId);
                  const hasQuizzes = courseHasQuizzes(courseId);
                  const quizCount = courseQuizzes.length;
                  
                  console.log(`Rendering not-started course ${course.title}: hasQuizzes=${hasQuizzes}, quizCount=${quizCount}`);
                  
                  return (
                    <div key={course._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      {/* Course Image */}
                      <div className="relative h-40 w-full bg-gray-200"> 
                        <img
                          src={course.thumbnail || '/assets/course-placeholder.jpg'}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/assets/course-placeholder.jpg'; }}
                        />
                      </div>
                      
                      {/* Course Content Area */}
                      <div className="p-4 flex-grow">
                        {/* Title Below Image */}
                        <h4 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2" title={course.title}>{course.title}</h4>
                        
                        {/* Status Badge - Updated */}
                        <div className="mb-3">
                          <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                             <BookOpenIcon className="h-4 w-4 mr-1 text-gray-500" />
                              Not Started
                            </span>
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-1.5 text-sm text-gray-600">
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>Level: {course.level || 'Beginner'}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>~{course.duration || 'N/A'} min</span> 
                          </div>
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>{quizCount} {quizCount === 1 ? 'Quiz' : 'Quizzes'} Available</span>
                          </div>
                          </div>
                        </div>
                        
                      {/* Footer Button/Popover Area */}
                      <div className="p-3 border-t border-gray-100 bg-gray-50 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 relative">
                        <Link
                           to={`/student/courses/${course._id}`}
                           className="w-full sm:flex-grow py-1.5 px-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium text-center transition-colors"
                          >
                            Start Course
                        </Link>
                          
                          {hasQuizzes ? (
                  <button
                              onClick={() => toggleCourseQuizzes(course._id)}
                              className="w-full sm:flex-none py-1.5 px-3 rounded text-white font-medium text-xs bg-yellow-500 hover:bg-yellow-600 transition-colors"
                              aria-expanded={expandedCourse === course._id}
                              aria-controls={`quiz-popover-${courseId}`}
                  >
                              {expandedCourse === course._id ? 'Hide' : 'Quizzes'} 
                  </button>
                          ) : (
                  <button
                              disabled 
                              className="w-full sm:flex-none py-1.5 px-3 rounded text-gray-400 font-medium text-xs bg-gray-200 cursor-not-allowed"
                            >
                              No Quizzes
                  </button>
                          )}
                        {/* Quiz Popover (Positioning remains the same relative to this container) */}
                        {expandedCourse === course._id && hasQuizzes && (
                           <div 
                              id={`quiz-popover-${courseId}`} 
                              className="absolute bottom-full right-0 mb-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-72 flex flex-col"
                           >
                              {/* Popover Header */} 
                              <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                                 <h5 className="text-sm font-medium text-gray-700">Quizzes for this Course</h5>
                </div>
                        
                              {/* Quiz List Area */} 
                              <div className="overflow-y-auto flex-grow">
                                {courseQuizzes.length > 0 ? (
                                  <ul className="divide-y divide-gray-100">
                                     {courseQuizzes.map((quiz) => {
                                        // Cannot be completed if course not started
                                        const completed = false; 
                                        return (
                                           <li key={quiz._id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                              <div className="flex justify-between items-center space-x-2"> 
                                                 {/* Left Side: Icon + Info */}
                                                 <div className="flex items-center space-x-2 min-w-0">
                                                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                                       <DocumentTextIcon className="h-5 w-5"/>
            </div>
                                                    <div className="flex-1 min-w-0">
                                                       <p className="text-sm font-medium text-gray-900 truncate" title={quiz.title}>{quiz.title}</p>
                                                       <p className="text-xs text-gray-500">
                                                          {quiz.questionCount || '?'} Qs • {quiz.timeLimit || '?'} min
                                                       </p>
          </div>
                                          </div>
                                                 {/* Right Side: Button */}
                                    <button 
                                      onClick={() => handleTakeQuiz(quiz._id)}
                                                    className="flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                    >
                                                    Take Quiz
                                    </button>
                                  </div>
                                </li>
                                        );
                                     })}
                            </ul>
                                ) : (
                                  <p className="text-sm text-gray-500 text-center px-4 py-6">No quizzes found.</p>
                                )}
                              </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state if no courses in any section and no unassociated quizzes */}
      {allCourses.length === 0 && quizzes.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpenIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Courses Found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You're not currently enrolled in any courses. Once you enroll in courses, their quizzes will appear here.
          </p>
          <Link to="/student/courses" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Browse Available Courses
          </Link>
        </div>
      )}

      {/* Show a message if there are quizzes but no courses */}
      {allCourses.length === 0 && quizzes.length > 0 && !showAllQuizzes && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <DocumentTextIcon className="h-10 w-10 text-indigo-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">You Have Quizzes Available</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You have {quizzes.length} quizzes available but they're not associated with your enrolled courses.
          </p>
          <button
            onClick={() => setShowAllQuizzes(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View All Quizzes
          </button>
        </div>
      )}
    </div>
  );
};

export default Assignments; 