import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const StudentTests = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  // Fetch available tests
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['student-tests'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/tests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
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
      startTimer();
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
      if (data.passed) {
        toast.success('Congratulations! You passed the test!');
      } else {
        toast.error('Test submitted, but you did not pass. Try again!');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit test');
    }
  });

  // Timer function
  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTestMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTest = (test) => {
    setSelectedTest(test);
    setAnswers({});
    setCurrentQuestion(0);
    startTestMutation.mutate(test._id);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < selectedTest.questions.length) {
      if (!confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }
    submitTestMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!selectedTest ? (
        <div>
          <h1 className="text-3xl font-bold mb-8">Available Tests</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">{test.title}</h2>
                <p className="text-gray-600 mb-4">{test.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>{test.duration} minutes</span>
                  </div>
                  <div className="flex items-center">
                    <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                    <span>{test.questions.length} questions</span>
                  </div>
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    <span>Pass: {test.passingScore}%</span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartTest(test)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Start Test
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{selectedTest.title}</h1>
              <div className="text-xl font-mono bg-blue-100 text-blue-800 px-4 py-2 rounded">
                Time: {formatTime(timeLeft)}
              </div>
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
                          onChange={() => handleAnswer(selectedTest.questions[currentQuestion]._id, option.text)}
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
                      onClick={handleSubmit}
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
      )}
    </div>
  );
};

export default StudentTests;
