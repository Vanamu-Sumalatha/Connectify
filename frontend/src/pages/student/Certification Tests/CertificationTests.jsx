import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  VideoCameraIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const CertificationTests = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [acceptedHonorCode, setAcceptedHonorCode] = useState(false);
  
  // Timer effect
  useEffect(() => {
    let timer;
    if (testStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  // Fetch enrolled courses with their completion status and the corresponding tests
  const { data: completedCourses = [], isLoading } = useQuery({
    queryKey: ['student-completed-courses-tests'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      try {
        console.log('Starting certification test data fetch...');
        
        // Get the student's enrolled courses
        const enrolledCoursesResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/courses/enrolled`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Filter only completed courses
        const completedCourses = enrolledCoursesResponse.data.filter(course => 
          course.progress === 100 || course.status === 'completed'
        );
        
        console.log(`Found ${completedCourses.length} completed courses`);
        if (completedCourses.length === 0) {
          return [];
        }

        // Check localStorage for completed tests (since server API is not working)
        const completedTests = JSON.parse(localStorage.getItem('completedTests') || '[]');
        console.log('Local completed tests:', completedTests);
        
        // Create a set of passed test IDs
        const passedTests = new Set();
        completedTests.forEach(test => {
          if (test.passed && test.testId) {
            passedTests.add(test.testId);
          }
        });
        
        // Fetch all tests using admin API
        const testsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/tests`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!testsResponse.data || !Array.isArray(testsResponse.data)) {
          throw new Error('Invalid response format from tests API');
        }

        // Filter tests that are certificate tests
        const certificateTests = testsResponse.data.filter(test => test.isCertificateTest);
        
        // Match tests with completed courses
        const completedCoursesWithTestData = completedCourses.map(course => {
          // Find test for this course
          const testForCourse = certificateTests.find(test => {
            // Check if courseId is an object with _id property or a string
            if (test.courseId && typeof test.courseId === 'object') {
              return test.courseId._id === course._id;
            } else {
              return test.courseId === course._id;
            }
          });

          if (testForCourse) {
            // Check if this test has been passed (from localStorage)
            const testStatus = passedTests.has(testForCourse._id) ? 'passed' : 'notStarted';
            
            return {
              ...course,
              test: {
                ...testForCourse,
                courseTitle: course.title,
                courseImage: course.thumbnailUrl || course.imageUrl,
                instructor: course.instructor?.name || 'Course Instructor',
                status: testStatus,
                hasTest: true
              }
            };
          }

          return {
            ...course,
            test: null
          };
        });

        return completedCoursesWithTestData;
      } catch (error) {
        console.error('Error in certification tests query:', error);
        toast.error('Failed to fetch certification tests');
        return [];
      }
    }
  });

  // Generate dummy questions for display purposes
  const generateDummyQuestions = (count) => {
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push({
        _id: `question_${i}`,
        question: `Sample Question ${i + 1}`,
        type: 'multiple-choice',
        options: [
          { text: 'Option A' },
          { text: 'Option B' },
          { text: 'Option C' },
          { text: 'Option D' }
        ],
        points: 1
      });
    }
    return questions;
  };

  // Start test mutation
  const startTestMutation = useMutation({
    mutationFn: async (testId) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/tests/${testId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setTimeLeft(data.duration * 60); // Convert minutes to seconds
      setTestStarted(true);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start test');
    }
  });

  // Submit test mutation
  const submitTestMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/tests/${selectedTest.testId}/submit`,
        {
          attemptId,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer
          }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setTestStarted(false);
      setSelectedTest(null);
      queryClient.invalidateQueries(['student-completed-courses-tests']);
      
      if (data.passed) {
        toast.success('Congratulations! You passed the test!');
        // Navigate to certificates page
        navigate('/student/certificates');
      } else {
        toast.error('You did not pass the test. Try again later.');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit test');
    }
  });

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTest = (course) => {
    console.log("Starting test for course:", course);
    
    // Make sure the course has a test
    if (!course.test || !course.test._id) {
      toast('No test available for this course yet.', {
        icon: '🕒',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      return;
    }
    
    // Set the selected test from the course.test property
    setSelectedTest({
      ...course.test,
      testId: course.test._id,
      hasTest: true
    });
    
    setShowInstructions(true);
  };

  const launchFullscreenTest = (testId) => {
    if (!acceptedHonorCode) {
      toast.error('Please accept the honor code before starting the test');
      return;
    }
    
    console.log("Launching fullscreen test with ID:", testId);
    
    // Open in a new tab instead of navigating in the same tab
    const testUrl = `/student/tests/${testId}`;
    window.open(testUrl, '_blank');
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = () => {
    if (Object.keys(answers).length < selectedTest.questions.length) {
      if (!window.confirm('You have not answered all questions. Are you sure you want to submit?')) {
        return;
      }
    }
    submitTestMutation.mutate();
  };

  const closeInstructions = () => {
    setShowInstructions(false);
    setSelectedTest(null);
    setAcceptedHonorCode(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Certification Tests</h1>
      
      {completedCourses.length === 0 ? (
        <div className="text-center py-8">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Completed Courses</h3>
          <p className="text-gray-600">
            Complete your enrolled courses to unlock their certification tests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Course thumbnail image */}
              <div className="h-40 bg-gray-200 overflow-hidden relative">
                {course.courseImage ? (
                  <img 
                    src={course.courseImage} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <AcademicCapIcon className="h-16 w-16 text-blue-300" />
                  </div>
                )}
                
                {/* Test status badge */}
                {course.test?.status === 'passed' && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                    <CheckCircleIcon className="h-3 w-3 mr-1 inline" />
                    Passed
                  </div>
                )}
                {course.test?.status === 'failed' && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                    <ExclamationCircleIcon className="h-3 w-3 mr-1 inline" />
                    Failed
                  </div>
                )}
              </div>
              
              <div className="p-5">
                {/* Course title */}
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-3">Instructor: {course.instructor}</p>
                
                {/* Test details - Debug info */}
                {console.log('Rendering course:', course)}
                {console.log('Course test data:', course.test)}
                
                {/* Test details */}
                {course.test && course.test._id ? (
                  <>
                    <div className="flex items-center space-x-4 text-sm mb-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-gray-500 mr-1" />
                        <span>{course.test.duration || 30} min</span>
                      </div>
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                        <span>{course.test.questions?.length || 0} questions</span>
                      </div>
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                        <span>Passing: {course.test.passingScore || 70}%</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Test Description:</p>
                      <p className="text-gray-600 text-sm">{course.test.description || 'No description available'}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Test Details:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Total Points: {course.test.totalPoints || 100}</li>
                        <li>• Due Date: {new Date(course.test.dueDate).toLocaleDateString()}</li>
                        <li>• Status: {course.test.status || 'Not Started'}</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">No test available for this course yet.</p>
                  </div>
                )}
                
                {/* Action buttons */}
                {course.test && course.test._id ? (
                  course.test.status === 'passed' ? (
                    <button
                      onClick={() => navigate(`/student/certificates/${course.test._id}`)}
                      className="w-full flex items-center justify-center text-white bg-green-600 hover:bg-green-700 py-2.5 px-4 rounded-lg transition-colors"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      View Certificate
                    </button>
                  ) : course.test.status === 'failed' ? (
                    <button
                      onClick={() => handleStartTest(course)}
                      className="w-full flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 py-2.5 px-4 rounded-lg transition-colors"
                    >
                      <BookOpenIcon className="h-5 w-5 mr-2" />
                      Retake Test
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTest(course)}
                      className="w-full flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 py-2.5 px-4 rounded-lg transition-colors"
                    >
                      <BookOpenIcon className="h-5 w-5 mr-2" />
                      Start Test
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => toast('No test available for this course yet.', {
                      icon: '🕒',
                      style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                      },
                    })}
                    className="w-full flex items-center justify-center text-gray-700 bg-gray-200 hover:bg-gray-300 py-2.5 px-4 rounded-lg transition-colors"
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Test Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Test Instructions</h2>
                <button 
                  onClick={closeInstructions} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedTest.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm mb-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-500 mr-1" />
                    <span>{selectedTest.duration} minutes</span>
                  </div>
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                    <span>{selectedTest.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                    <span>Passing score: {selectedTest.passingScore}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-blue-700">Secure Testing Environment</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <LockClosedIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">This is a closed-book examination. No external resources are allowed.</span>
                    </li>
                    <li className="flex items-start">
                      <ClipboardDocumentIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Copying, pasting, and keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+F) are disabled.</span>
                    </li>
                    <li className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Switching tabs or windows will trigger a warning. Repeated offenses may lock your test.</span>
                    </li>
                    <li className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">A timer will be displayed. The test will automatically submit when time expires.</span>
                    </li>
                    <li className="flex items-start">
                      <VideoCameraIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Webcam proctoring may be activated during the test (optional but recommended).</span>
                    </li>
                    <li className="flex items-start">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Your progress will be auto-saved regularly.</span>
                    </li>
                    <li className="flex items-start">
                      <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Results will be shown immediately upon completion.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">You will only receive a certificate if you pass the test and have completed all course content.</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="flex items-start space-x-2 mb-4">
                  <input 
                    type="checkbox" 
                    id="honorCode"
                    checked={acceptedHonorCode}
                    onChange={() => setAcceptedHonorCode(!acceptedHonorCode)}
                    className="mt-1"
                  />
                  <label htmlFor="honorCode" className="text-gray-700 text-sm">
                    <span className="font-semibold">Honor Code:</span> I understand and agree to abide by the rules of this examination. 
                    I will not use unauthorized resources, communicate with others, or employ any means to gain unfair advantage. 
                    I acknowledge that violation of these rules may result in disqualification and other penalties.
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeInstructions}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => launchFullscreenTest(selectedTest.testId)}
                  disabled={!acceptedHonorCode}
                  className={`px-6 py-2 rounded-lg text-white ${
                    acceptedHonorCode 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-300 cursor-not-allowed'
                  } flex items-center`}
                >
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Taking Interface - Keeping this for compatibility but it will be replaced by the new tab approach */}
      {testStarted && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{selectedTest.title}</h2>
                {testStarted && (
                  <div className="text-xl font-mono bg-blue-100 text-blue-800 px-4 py-2 rounded">
                    Time: {formatTime(timeLeft)}
                  </div>
                )}
              </div>

              {testStarted && selectedTest.questions[currentQuestion] && (
                <div>
                  <div className="mb-8">
                    <div className="text-sm text-gray-500 mb-2">
                      Question {currentQuestion + 1} of {selectedTest.questions.length}
                    </div>
                    <p className="text-lg font-medium mb-4">
                      {selectedTest.questions[currentQuestion].question}
                    </p>
                    <div className="space-y-3">
                      {selectedTest.questions[currentQuestion].options.map((option, index) => (
                        <label
                          key={index}
                          className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion}`}
                            value={option.text}
                            checked={answers[selectedTest.questions[currentQuestion]._id] === option.text}
                            onChange={() => handleAnswerSelect(selectedTest.questions[currentQuestion]._id, option.text)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-3">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestion === 0}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {currentQuestion < selectedTest.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestion(prev => prev + 1)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitTest}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Submit Test
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationTests;
