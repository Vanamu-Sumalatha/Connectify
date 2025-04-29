import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { baseUrl } from '../../../config';
import { ClockIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// --- Helper: Format Time (MM:SS) ---
const formatTime = (seconds) => {
  if (typeof seconds !== 'number' || seconds < 0) {
     return '00:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  // --- Fetch Quiz Data --- 
  const { data: quiz, isLoading, error, isError } = useQuery({
    queryKey: ['quizAttempt', quizId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required.');
      
      try {
        const response = await axios.get(`${baseUrl}/api/quiz/student/quizzes/${quizId}`, { 
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const durationMinutes = typeof response.data?.duration === 'number' ? response.data.duration : 30;
        setTimeLeft(durationMinutes * 60);
        return response.data;
      } catch (err) {
         console.error("Error fetching quiz data:", err);
         let errorMessage = 'Failed to load quiz details.';
         if (err.response?.status === 404) {
            errorMessage = 'Quiz not found.';
         } else if (err.response?.status === 403) {
            errorMessage = 'You do not have permission to access this quiz.';
         } else if (err.response?.data?.message) {
             errorMessage = err.response.data.message;
         }
         throw new Error(errorMessage);
      }
    },
    enabled: !!quizId,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // --- Start Quiz Attempt Mutation ---
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required.');

      try {
        console.log(`Attempting to start quiz with ID: ${quizId}`);
        const response = await axios.post(
          `${baseUrl}/api/quiz/student/quizzes/attempt`,
          { 
            quizId,
            // Added required fields for QuizAttempt model
            answers: {}, // Empty answers map initially
            timeSpent: 0, // Initial time spent
            score: 0, // Initial score
            // User ID will be extracted from token on the server
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Quiz attempt start successful:", response.data);
        return response.data;
      } catch (err) {
        console.error("Error starting quiz attempt:", err);
        if (err.response) {
          console.error("Response status:", err.response.status);
          console.error("Response data:", err.response.data);
        }
        throw new Error((err.response?.data?.message || 'Failed to start quiz attempt'));
      }
    },
    onSuccess: (data) => {
      // Handle different API response formats
      console.log("Success data:", data);
      const attemptIdValue = data.attemptId || data._id || data.id || (data.attempt && data.attempt._id);
      if (!attemptIdValue) {
        console.error("No attempt ID found in response:", data);
      }
      setAttemptId(attemptIdValue);
      toast.success('Quiz attempt started!');
    },
    onError: (error) => {
      console.error("Full error details:", error);
      toast.error(`Failed to start quiz: ${error.message}`);
      navigate('/student/assignments');
    }
  });

  // --- Submit Quiz Mutation --- 
  const submitQuizMutation = useMutation({
    mutationFn: async (submissionData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required.');

      if (!attemptId) {
        throw new Error('No active quiz attempt found');
      }

      try {
        console.log(`Submitting answers for quiz ${quizId}, attempt ${attemptId}`);
        const response = await axios.post(
          `${baseUrl}/api/quiz/student/quizzes/submit`,
          { 
            quizId,
            attemptId,
            answers: submissionData.answers,
            timeSpent: submissionData.timeSpent,
            score: submissionData.score
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Quiz submission successful:", response.data);
        return response.data;
      } catch (err) {
        console.error("Error submitting quiz:", err);
        if (err.response) {
          console.error("Response status:", err.response.status);
          console.error("Response data:", err.response.data);
        }
        throw new Error(err.response?.data?.message || 'Failed to submit quiz');
      }
    },
    onMutate: () => {
      setIsSubmitting(true);
      toast.loading('Submitting your answers...');
    },
    onSuccess: (data) => {
      toast.dismiss();
      toast.success('Quiz submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['student-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['all-admin-quizzes-for-student-view'] });
      queryClient.invalidateQueries({ queryKey: ['enrolled-detailed-courses'] });
      navigate('/student/assignments');
    },
    onError: (error) => {
      toast.dismiss();
      console.error("Quiz submission error:", error);
      const message = error.response?.data?.message || error.message || 'Failed to submit quiz. Please try again.';
      toast.error(message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // --- Timer Logic --- 
  const handleTimeUp = useCallback(() => {
     if (isSubmitting || submitQuizMutation.isPending) return;
     
     toast.error("Time's up! Submitting answers automatically.", { icon: '⏰' });
     
     // Calculate elapsed time (full duration since time is up)
     const elapsedTime = quiz.duration * 60;
     
     // Calculate score based on answered questions
     const answeredQuestions = Object.keys(answers).length;
     const scorePercentage = Math.round((answeredQuestions / quiz.questions.length) * 100);
     
     // Format answers based on what we've seen in the backend requirements
     const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({ 
         questionId,
         selectedOption: selectedOptionId,
         selectedOptions: [selectedOptionId]
     }));
     
     console.log("Auto-submitting answers due to time up:", formattedAnswers);
     submitQuizMutation.mutate({
       answers: formattedAnswers,
       timeSpent: elapsedTime,
       score: scorePercentage
     });
  }, [answers, submitQuizMutation, isSubmitting, quiz]);

  useEffect(() => {
    if (typeof timeLeft !== 'number' || timeLeft <= 0 || isSubmitting) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          handleTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitting, handleTimeUp]);

  // Start attempt when component mounts
  useEffect(() => {
    if (quiz && !attemptId && !isSubmitting) {
      startAttemptMutation.mutate();
    }
  }, [quiz, attemptId, isSubmitting]);

  // --- Event Handlers ---
  const handleAnswerSelect = (questionId, optionId) => {
    if (isSubmitting || timeLeft === 0 || !attemptId) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
     if (isSubmitting || timeLeft === 0 || !attemptId) return;
     if (window.confirm('Are you sure you want to submit your quiz?')) {
        // Calculate elapsed time
        const elapsedTime = quiz.duration * 60 - (timeLeft || 0);
        
        // Calculate score based on answered questions
        const answeredQuestions = Object.keys(answers).length;
        const scorePercentage = Math.round((answeredQuestions / quiz.questions.length) * 100);
        
        // Format answers
        const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({ 
            questionId, 
            selectedOption: selectedOptionId,
            selectedOptions: [selectedOptionId]
        }));
        
        console.log("Manually submitting answers:", formattedAnswers);
        submitQuizMutation.mutate({
          answers: formattedAnswers,
          timeSpent: elapsedTime,
          score: scorePercentage
        });
     }
  };

  // --- UI Rendering --- 
  if (isLoading || startAttemptMutation.isPending) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (isError || startAttemptMutation.isError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
           <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4"/>
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Quiz</h2>
          <p className="text-gray-600 mb-6">
            {error?.message || startAttemptMutation.error?.message || 'An unexpected error occurred.'}
          </p>
          <button 
             onClick={() => navigate('/student/assignments')} 
             className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
     return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
           <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4"/>
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">Quiz Not Found or Empty</h2>
          <p className="text-gray-600 mb-6">The requested quiz could not be found or contains no questions.</p>
          <button 
             onClick={() => navigate('/student/assignments')} 
             className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentQuestionIndex] || {};
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-8 flex flex-col">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col flex-grow">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-col sm:flex-row justify-between items-center flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0 truncate" title={quiz.title}>{quiz.title}</h1>
          <div className="flex items-center space-x-4 text-sm font-medium">
            <span className={`flex items-center p-1 px-2 rounded transition-colors duration-300 ${timeLeft !== null && timeLeft <= 60 && timeLeft > 0 ? 'bg-red-500 animate-pulse' : 'bg-black bg-opacity-20'}`}> 
              <ClockIcon className="h-5 w-5 mr-1.5 opacity-80" />
              Time Left: {timeLeft !== null ? formatTime(timeLeft) : 'N/A'}
            </span>
            <span className="p-1 px-2 rounded bg-black bg-opacity-20">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 flex-shrink-0">
           <div className="h-2 bg-blue-600 transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Question Area (Scrollable) */}
        <div className="p-6 sm:p-8 flex-grow overflow-y-auto">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Question {currentQuestionIndex + 1}</p>
            <p className="text-lg font-semibold text-gray-800">{currentQuestion.question || currentQuestion.text || 'Question text missing'}</p>
          </div>

          {/* Options Area */}
          <div className="space-y-3">
            {(currentQuestion.options && currentQuestion.options.length > 0) ? (
                currentQuestion.options.map((option, index) => {
                  if (!option || typeof option.text === 'undefined' || typeof option._id === 'undefined') {
                     console.warn(`Skipping invalid option at index ${index} for question ${currentQuestion._id}:`, option);
                     return null; 
                  }
                  const isSelected = answers[currentQuestion._id] === option._id;
                  return (
                    <button
                      key={option._id}
                      onClick={() => handleAnswerSelect(currentQuestion._id, option._id)}
                      disabled={isSubmitting || timeLeft === 0 || !attemptId}
                      className={`w-full text-left p-4 border rounded-lg transition-all duration-150 flex items-center space-x-3
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                        }
                        ${(isSubmitting || timeLeft === 0 || !attemptId) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                      `}
                    >
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}>
                         {isSelected && <CheckCircleIcon className="h-3 w-3 text-white" />} 
                      </span>
                      <span className="text-gray-700">{option.text}</span>
                    </button>
                  );
                })
             ) : (
                 <p className="text-gray-500">No options available for this question.</p>
             )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0 || isSubmitting || timeLeft === 0 || !attemptId}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </button>
          
          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || timeLeft === 0 || !attemptId}
              className={`px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center transition-colors
                ${(isSubmitting || timeLeft === 0 || !attemptId) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700' 
                }
              `}
            >
               {isSubmitting ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                   Submitting...
                 </>
               ) : (
                 <> 
                   <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                   Submit Quiz
                 </>
               )}
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              disabled={isSubmitting || timeLeft === 0 || !attemptId}
              className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                ${(isSubmitting || timeLeft === 0 || !attemptId) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700' 
                }
              `}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;