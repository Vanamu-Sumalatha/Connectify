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

  // Fetch completed courses and their certification tests
  const { data: coursesWithTests = [], isLoading } = useQuery({
    queryKey: ['student-completed-course-tests'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      try {
        // First, get the student's completed courses
        const completedCoursesResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/courses/completed`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Then, get the certification tests for those courses
        const testsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/tests`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Filter tests to only include those from completed courses
        const completedCourseIds = completedCoursesResponse.data.map(course => course._id);
        const filteredTests = testsResponse.data.filter(test => 
          completedCourseIds.includes(test.courseId)
        );

        return filteredTests;
      } catch (error) {
        console.error('Error fetching completed course tests:', error);
        toast.error('Failed to fetch certification tests');
        return [];
      }
    }
  });

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
        `${import.meta.env.VITE_API_URL}/api/student/tests/${selectedTest._id}/submit`,
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
      queryClient.invalidateQueries(['student-course-tests']);
      
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

  const handleStartTest = (test) => {
    setSelectedTest(test);
    setCurrentQuestion(0);
    setAnswers({});
    startTestMutation.mutate(test._id);
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
      
      {coursesWithTests.length === 0 ? (
        <div className="text-center py-8">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">TNo Certification Tests Available</h3>
          <p className="text-gray-600">
            Complete your enrolled courses to unlock their certification tests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesWithTests.map((test) => (
            <div
              key={test._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium">{test.title}</h3>
              </div>
              <div className="mb-4">
                <p className="text-gray-600">{test.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  <span>Course Completed</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {test.questions.length} questions
                  </span>
                  <span className="text-sm text-gray-500">{test.duration} min</span>
                </div>
                {test.status === 'passed' ? (
                  <div className="flex flex-col items-end">
                    <span className="flex items-center text-green-600">
                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                      Passed
                    </span>
                    <button
                      onClick={() => navigate(`/student/certificates/${test._id}`)}
                      className="text-blue-600 text-sm hover:underline mt-1"
                    >
                      View Certificate
                    </button>
                  </div>
                ) : test.status === 'failed' ? (
                  <span className="flex items-center text-red-600">
                    <ExclamationCircleIcon className="h-5 w-5 mr-1" />
                    Failed
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartTest(test)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Test
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Taking Interface */}
      {selectedTest && (
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
