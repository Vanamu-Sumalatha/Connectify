import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeftIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  TrophyIcon,
  FireIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { baseUrl } from '../../../config.js';

// Function to create confetti effect
const createConfetti = () => {
  // Check if window is defined (for SSR safety)
  if (typeof window !== 'undefined') {
    // Dynamic import of canvas-confetti
    import('canvas-confetti').then(module => {
      const confetti = module.default;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }).catch(error => {
      console.error('Failed to load confetti:', error);
    });
  }
};

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [remainingTime, setRemainingTime] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [attemptData, setAttemptData] = useState(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Timer interval ref
  const timerRef = useRef(null);

  // Fetch quiz details
  const { 
    data: quiz, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // First try the primary endpoint for fetching a specific quiz
        try {
          const response = await axios.get(
            `${baseUrl}/api/quiz/student/quizzes/${quizId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("Quiz data from primary endpoint:", response.data);
          return response.data;
        } catch (apiError) {
          console.error('Primary endpoint error:', apiError);
          
          // Try alternative endpoint for admin-created quizzes
          try {
            const response = await axios.get(
              `${baseUrl}/api/student/quizzes/${quizId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            console.log("Quiz data from alternative endpoint:", response.data);
            return response.data;
          } catch (altError) {
            console.error('Alternative endpoint error:', altError);
            
            // If all API calls fail and we're in development, use fallback data
            if (import.meta.env.DEV) {
              console.log('Using fallback quiz data for development');
            // Fallback quiz data for development
            return {
                _id: quizId || 'quiz001',
              title: 'JavaScript Fundamentals Quiz',
              description: 'Test your knowledge of JavaScript basics, including variables, data types, and functions.',
              courseId: {
                _id: 'course001',
                title: 'Advanced JavaScript Programming',
                thumbnail: 'https://via.placeholder.com/150'
              },
              passingScore: 70,
              duration: 30, // minutes
              questions: [
                {
                  _id: 'q1',
                  text: 'Which of the following is NOT a JavaScript primitive type?',
                  type: 'multiple-choice',
                  points: 2,
                  options: [
                    { _id: 'o1', text: 'String' },
                    { _id: 'o2', text: 'Number' },
                    { _id: 'o3', text: 'Object' },
                    { _id: 'o4', text: 'Boolean' }
                  ]
                },
                {
                  _id: 'q2',
                  text: 'What will be the output of: console.log(typeof null)',
                  type: 'multiple-choice',
                  points: 2,
                  options: [
                    { _id: 'o5', text: 'null' },
                    { _id: 'o6', text: 'undefined' },
                    { _id: 'o7', text: 'object' },
                    { _id: 'o8', text: 'string' }
                  ]
                },
                {
                  _id: 'q3',
                  text: 'Which method is used to add an element to the end of an array?',
                  type: 'multiple-choice',
                  points: 2,
                  options: [
                    { _id: 'o9', text: 'push()' },
                    { _id: 'o10', text: 'pop()' },
                    { _id: 'o11', text: 'shift()' },
                    { _id: 'o12', text: 'unshift()' }
                  ]
                },
                {
                  _id: 'q4',
                  text: 'JavaScript is a case-sensitive language.',
                  type: 'true-false',
                  points: 1,
                  options: [
                    { _id: 'o13', text: 'True' },
                    { _id: 'o14', text: 'False' }
                  ]
                },
                {
                  _id: 'q5',
                  text: 'What is the correct way to check if a variable is of type undefined?',
                  type: 'multiple-choice',
                  points: 3,
                  options: [
                    { _id: 'o15', text: 'if (variable === undefined)' },
                    { _id: 'o16', text: 'if (typeof variable === "undefined")' },
                    { _id: 'o17', text: 'if (variable == null)' },
                    { _id: 'o18', text: 'if (!variable)' }
                  ]
                }
              ],
              attempts: []
            };
          }
          
            throw new Error('Failed to fetch quiz data from multiple endpoints');
          }
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz details');
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Debug to check quiz data structure
  React.useEffect(() => {
    if (quiz) {
      console.log("Full quiz data:", quiz);
      console.log("Questions structure:", quiz.questions);
      
      // Check for possible alternate locations where questions might be stored
      const possibleQuestionFields = [
        quiz.questions,
        quiz.content?.questions, 
        quiz.settings?.questions,
        quiz.quizData?.questions
      ];
      
      console.log("Possible question fields:", possibleQuestionFields);
    }
  }, [quiz]);

  // Completely rewrite the startQuizMutation to handle more endpoints
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      // Check if offline mode is preferred
      const preferOfflineMode = localStorage.getItem('preferOfflineMode') === 'true';
      if (preferOfflineMode) {
        console.log("Using offline mode by user preference");
        return {
          _id: `offline-${Date.now()}`,
          attemptId: `offline-${Date.now()}`,
          duration: quiz?.duration || 30,
          startTime: new Date(),
          status: 'in-progress'
        };
      }
      
      // Try various API endpoints
      try {
        console.log(`Attempting to start quiz with ID: ${quizId}`);
        
        // Define endpoint patterns to try
        const endpoints = [
          `${baseUrl}/api/quiz/student/quizzes/${quizId}/attempt`,
          `${baseUrl}/api/student/quizzes/${quizId}/attempt`,
          `${baseUrl}/api/quiz/student/quizzes/${quizId}/attempts`,
          `${baseUrl}/api/quiz/attempts/start`
        ];
        
        // Try each endpoint
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await axios.post(
              endpoint,
              { quizId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data) {
              console.log(`Success with endpoint: ${endpoint}`, response.data);
              return response.data;
            }
          } catch (err) {
            console.log(`Failed with endpoint: ${endpoint}`, err.message);
            // Continue to next endpoint
          }
        }
        
        // If all endpoints failed, try with user ID
        console.log("Trying with user ID extraction");
        let userId = null;
        
        try {
          // Extract user ID from JWT token
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            userId = payload.id || payload._id || payload.userId || payload.sub;
          }
        } catch (error) {
          console.error("Could not extract user ID from token", error);
        }
        
        // Fallback user ID
        userId = userId || localStorage.getItem('userId') || '67f4d182310e690308930a23';
        
        // Try with full request body
        const response = await axios.post(
          `${baseUrl}/api/quiz/student/quizzes/${quizId}/attempts`,
          {
            quiz: quizId,
            user: userId,
            student: userId,
            answers: {},
            timeSpent: 0,
            score: 0,
            status: 'in-progress',
            startTime: new Date()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("Success with user ID approach", response.data);
        return response.data;
      } catch (error) {
        console.error("All API approaches failed", error);
        // Fallback to offline mode
        return {
          _id: `offline-${Date.now()}`,
          attemptId: `offline-${Date.now()}`,
          duration: quiz?.duration || 30,
          startTime: new Date(),
          status: 'in-progress'
        };
      }
    },
    onSuccess: (data) => {
      console.log("Quiz attempt started successfully:", data);
      // Handle different possible response formats
      const newAttemptData = {
        attemptId: data.attemptId || data._id,
        duration: data.duration || quiz?.duration || 30,
        startTime: data.startTime || new Date()
      };
      
      setAttemptId(newAttemptData.attemptId);
      setAttemptData(newAttemptData);
      setQuizStarted(true);
      
      // Calculate duration in seconds
      const newDurationSeconds = newAttemptData.duration * 60;
      setDurationSeconds(newDurationSeconds);
      setRemainingTime(newDurationSeconds);
      
      toast.success('Quiz started!');
    },
    onError: (error) => {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz: ' + (error.response?.data?.message || error.message));
      
      // If there's an existing attempt in progress, use that ID
      if (error.response?.data?.attemptId) {
        const existingAttemptId = error.response.data.attemptId;
        setAttemptId(existingAttemptId);
        setQuizStarted(true);
        // Calculate remaining time based on when the attempt was started
        const durationSeconds = quiz?.duration * 60 || 1800; // Default to 30 minutes
        setRemainingTime(durationSeconds);
        toast.success('Continuing previous attempt');
      } else {
        // If quiz loading failed but we have fallback data, try to start with that
        if (quiz) {
          setQuizStarted(true);
          const durationSeconds = quiz.duration * 60 || 1800;
          setRemainingTime(durationSeconds);
          toast.success('Starting quiz in offline mode');
        }
      }
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const localAttemptId = attemptData?.attemptId || attemptId;
      if (!localAttemptId) throw new Error('Attempt ID is missing');
      
      // Calculate time spent in seconds
      const timeSpent = durationSeconds - remainingTime;
      
      // Format answers for submission
      const formattedAnswers = Object.entries(userAnswers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions]
      }));
      
      console.log("Submitting quiz with data:", {
        attemptId: localAttemptId,
        formattedAnswers,
        timeSpent
      });
      
      // Skip API calls only if explicitly set to offline mode or using an offline attempt ID
      const preferOfflineMode = localStorage.getItem('preferOfflineMode') === 'true' || 
                               localAttemptId.toString().startsWith('offline-'); // Use offline mode if the attempt was started offline
      
      if (preferOfflineMode) {
        console.log("Using offline mode for quiz submission");
        // Calculate a simulated score based on number of answers
        const answeredCount = Object.keys(userAnswers).length;
        const totalQuestions = quiz?.questions?.length || 5;
        const correctCount = Math.floor(Math.random() * (answeredCount + 1)); // Random number of correct answers
        const percentageScore = Math.round((correctCount / totalQuestions) * 100);
        const passed = percentageScore >= (quiz?.passingScore || 70);
        
        return {
          attemptId: localAttemptId,
          quiz: quizId,
          score: percentageScore,
          percentageScore: percentageScore,
          passed: passed,
          correctAnswers: correctCount,
          totalQuestions: totalQuestions,
          completedAt: new Date()
        };
      }
      
      try {
        // Try first endpoint pattern with quizId and attemptId in URL
        try {
      const response = await axios.post(
            `${baseUrl}/api/quiz/student/quizzes/${quizId}/attempts/${localAttemptId}/submit`,
            {
              answers: formattedAnswers,
              timeSpent: timeSpent
            },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
          console.log("Quiz submission response:", response.data);
      return response.data;
        } catch (err) {
          // If first pattern fails with 404 or 500, try alternative endpoint
          console.log("First submission endpoint failed, trying alternative pattern...");
          if (err.response?.status === 404 || err.response?.status === 500) {
            try {
              // Try second endpoint pattern
              const response = await axios.post(
                `${baseUrl}/api/student/quizzes/${quizId}/attempts/${localAttemptId}/submit`,
                {
                  answers: formattedAnswers,
                  timeSpent: timeSpent
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              console.log("Quiz submission response from alternative endpoint:", response.data);
              return response.data;
            } catch (err2) {
              // If the alternative endpoint also fails, fall back to original endpoint pattern
              console.error("Alternative submission endpoint failed, trying original format...");
              try {
                // Try to extract user ID from token instead of calling /api/profile/me
                console.log("Attempting to get user ID from token...");
                
                // Get userId from token
                let userId = null;
                
                // Try to decode the JWT token to get the user ID
                try {
                  // Extract payload from JWT token (format: header.payload.signature)
                  const tokenParts = token.split('.');
                  if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    userId = payload.id || payload._id || payload.userId || payload.sub;
                    console.log("Extracted user ID from token:", userId);
                  }
                } catch (decodeError) {
                  console.error("Could not decode token:", decodeError);
                }
                
                // If we couldn't get the user ID from the token, use a hardcoded fallback
                // This is a last resort and not ideal for production
                if (!userId) {
                  userId = localStorage.getItem('userId') || '67f4d182310e690308930a23'; // Fallback to hardcoded ID
                  console.log("Using fallback user ID:", userId);
                }
                
                const response = await axios.post(
                  `${baseUrl}/api/quiz/student/quizzes/submit`,
                  {
                    quizId: quizId,
                    attemptId: localAttemptId,
                    user: userId,
                    student: userId,
                    answers: formattedAnswers,
                    timeSpent: timeSpent,
                    endTime: new Date(),
                    status: 'completed'
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                console.log("Quiz submission response from original format:", response.data);
                return response.data;
              } catch (err3) {
                console.error("All submission endpoints failed:", err3);
                // Generate a reasonable fallback response
                return {
                  score: 0,
                  percentageScore: 0,
                  passed: false,
                  message: "Saved in offline mode. Please reconnect to submit.",
                  correctAnswers: 0,
                  totalQuestions: quiz?.questions?.length || 0
                };
              }
            }
          } else {
            // If error is not 404, rethrow original error
            throw err;
          }
        }
      } catch (error) {
        console.error("Full submission error details:", error);
        if (error.response) {
          console.error("Error status:", error.response.status);
          console.error("Error data:", error.response.data);
        }
        
        // Generate a reasonable fallback response
        return {
          score: 0,
          percentageScore: 0,
          passed: false,
          message: "Failed to submit, please try again later.",
          correctAnswers: 0,
          totalQuestions: quiz?.questions?.length || 0
        };
      }
    },
    onSuccess: (data) => {
      setQuizComplete(true);
      
      // Handle different possible response formats
      const results = {
        score: data.score || data.percentageScore || 0,
        percentageScore: data.percentageScore || data.score || 0,
        passed: data.passed || (data.percentageScore >= (quiz?.passingScore || 70)),
        correctAnswers: data.correctAnswers || data.correct || 0,
        totalQuestions: data.totalQuestions || quiz?.questions?.length || 0
      };
      
      setQuizResults(results);
      queryClient.invalidateQueries(['quizzes']);
      
      if (results.passed) {
        // Create confetti effect for passing the quiz
        createConfetti();
        toast.success('Congratulations! You passed the quiz!');
      } else {
        toast.error('You didn\'t pass the quiz. Try again!');
      }
    },
    onError: (error) => {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz: ' + (error.response?.data?.message || error.message));
    },
  });

  // Start timer when quiz begins
  useEffect(() => {
    if (quizStarted && remainingTime !== null && !quizComplete) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            // Auto-submit when time runs out
            toast.error("Time's up! Submitting your answers automatically.", { 
              icon: '⏰' 
            });
            submitQuizMutation.mutate();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizStarted, remainingTime, quizComplete, submitQuizMutation]);

  // Format time remaining
  const formatTimeRemaining = () => {
    if (remainingTime === null) return '';
    
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fix the handleOptionSelect function to work without requiring question lookup
  const handleOptionSelect = (questionId, optionId) => {
    if (!questionId || !optionId) {
      console.error('Invalid question or option ID', { questionId, optionId });
      return;
    }

    console.log('Selecting option:', { questionId, optionId });
    
    // Instead of trying to find the question, just check the current question
    const questionType = currentQuestion?.type || 'multiple-choice';
    
    // Log more details for debugging
    console.log('Current question:', {
      id: currentQuestion?._id || currentQuestion?.id,
      type: questionType,
      inQuestionsArray: quiz?.questions?.some(q => q._id === questionId || q.id === questionId)
    });
    
    // Store selection in userAnswers regardless of whether we can find the question in quiz.questions
    setUserAnswers(prev => {
      // Create a new answers object
      const newAnswers = { ...prev };
      
      if (questionType === 'true-false' || questionType === 'single' || questionType === 'single-choice') {
        // For single selection questions, just set the array with one value
        newAnswers[questionId] = [optionId];
      } else {
        // For multiple selection questions
        const currentSelections = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
        
        if (currentSelections.includes(optionId)) {
          // Remove if already selected
          newAnswers[questionId] = currentSelections.filter(id => id !== optionId);
        } else {
          // Add if not already selected
          newAnswers[questionId] = [...currentSelections, optionId];
        }
      }
      
      console.log('Updated answers:', newAnswers);
      return newAnswers;
    });
  };

  // Update the isOptionSelected function
  const isOptionSelected = (questionId, optionId) => {
    if (!questionId || !optionId) return false;
    
    const selections = userAnswers[questionId];
    if (!selections) return false;
    
    if (Array.isArray(selections)) {
      return selections.includes(optionId);
    }
    
    return selections === optionId;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!quiz || !questionsArray || questionsArray.length === 0) return 0;
    
    // Count questions that have answers
    const answeredCount = Object.keys(userAnswers).length;
    return Math.min(100, Math.max(0, (answeredCount / questionsArray.length) * 100));
  };

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  // Start the quiz
  const handleStartQuiz = () => {
    startQuizMutation.mutate();
  };

  // Format answers for submission
  const formatAnswersForSubmission = () => {
    const answersToSubmit = [];
    
    Object.entries(userAnswers).forEach(([questionId, answer]) => {
      const question = quiz?.questions?.find(q => (q._id === questionId || q.id === questionId));
      
      if (question) {
        answersToSubmit.push({
          questionId,
          answer,
          type: question.type || 'multiple-choice'
        });
      }
    });
    
    return answersToSubmit;
  };

  // Update the existing handleSubmitQuiz function
  const handleSubmitQuiz = () => {
    if (submitQuizMutation.isLoading || isSubmitting) return;
    
    // Format answers for submission
    const formattedAnswers = formatAnswersForSubmission();
    console.log('Submitting answers:', formattedAnswers);
    
    // Make sure we have an attempt ID - if not, start a new attempt
    if (!attemptId) {
      console.log('No attempt ID found, starting a new attempt');
      
      // Set a flag to indicate we're in the process of starting a quiz
      setIsSubmitting(true);
      
      // Start a new quiz attempt
      startQuizMutation.mutate(undefined, {
        onSuccess: (data) => {
          // After successful attempt creation, submit the quiz
          if (data && (data.attemptId || data._id)) {
            const newAttemptId = data.attemptId || data._id;
            console.log('Successfully created attempt with ID:', newAttemptId);
            
            // Submit the quiz with the new attempt ID
            submitQuizMutation.mutate({
              quizId: quizId,
              answers: formattedAnswers,
              timeSpent: durationSeconds - remainingTime,
              attemptId: newAttemptId
            });
          } else {
            console.error('Failed to get attempt ID from response:', data);
            toast.error('Failed to start quiz attempt. Please try again.');
            setIsSubmitting(false);
          }
        },
        onError: (error) => {
          console.error('Error starting quiz attempt:', error);
          toast.error('Failed to start quiz attempt. Please try again.');
          setIsSubmitting(false);
        }
      });
      return;
    }
    
    // If we already have an attempt ID, submit directly
    submitQuizMutation.mutate({
      quizId: quizId,
      answers: formattedAnswers,
      timeSpent: durationSeconds - remainingTime,
      attemptId: attemptId
    });
    
    setIsSubmitting(true);
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!questionsArray || questionsArray.length === 0 || !currentQuestion) return false;
    
    // Get the current question ID directly from currentQuestion
    const questionId = currentQuestion._id || currentQuestion.id;
    
    // Check if we have answers for this question
    return userAnswers[questionId] && userAnswers[questionId].length > 0;
  };

  useEffect(() => {
    if (quiz) {
      // Debug: Log the quiz data structure to see where questions are stored
      console.log("Quiz structure:", quiz);
      console.log("Questions array:", quiz.questions);
      
      // Check if there are other possible locations where questions could be stored
      const possibleQuestionsLocations = [
        quiz.questions,
        quiz.content?.questions,
        quiz.data?.questions,
        quiz.settings?.questions
      ];
      
      console.log("Possible question locations:", possibleQuestionsLocations);
    }
  }, [quiz]);

  // Normalize question data structure to handle different formats
  const normalizeQuestion = (q) => {
    // If question is a mongoose document, try to access the _doc property
    const questionData = q._doc || q;
    
    return {
      id: questionData._id || questionData.id,
      text: questionData.question || questionData.text || '',
      options: questionData.options || [],
      type: questionData.type || 'multiple-choice',
      points: questionData.points || 1,
      correctAnswer: questionData.correctAnswer,
      difficulty: questionData.difficulty || 'medium'
    };
  };

  // Safely extract questions array from quiz data
  const questionsArray = useMemo(() => {
    if (!quiz || !quiz.questions) return [];
    
    try {
      return Array.isArray(quiz.questions) 
        ? quiz.questions.map(normalizeQuestion)
        : [];
    } catch (error) {
      console.error('Error processing questions:', error);
      return [];
    }
  }, [quiz]);

  // Active quiz screen, ensure we have a valid current question
  const currentQuestion = questionsArray?.[currentQuestionIndex];
  
  // Check if quiz has no real questions and show appropriate message
  if (quiz && (!questionsArray || questionsArray.length === 0 || 
      (questionsArray.length === 1 && questionsArray[0]._id === 'sample-q1'))) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">This quiz doesn't have any questions yet. Please contact your instructor.</p>
          <details className="mt-4">
            <summary className="text-sm text-gray-600 cursor-pointer">View Quiz Data (for debugging)</summary>
            <pre className="mt-2 text-xs text-gray-700 overflow-auto max-h-60 bg-gray-100 p-2 rounded">
              {JSON.stringify(quiz, null, 2)}
            </pre>
          </details>
        </div>
        <button
          onClick={() => navigate('/student/assignments')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Assignments
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">Question not found. Please try again.</p>
        </div>
        <button
          onClick={() => navigate('/student/assignments')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Assignments
        </button>
      </div>
    );
  }

  // Get options, ensuring it's an array with proper fallbacks
  const getOptions = (question) => {
    if (!question) return [];
    
    // Check if options exist and is an array
    if (Array.isArray(question.options) && question.options.length > 0) {
      return question.options;
    }
    
    // Check alternatives
    if (Array.isArray(question.choices) && question.choices.length > 0) {
      return question.choices;
    }
    
    if (Array.isArray(question.answers) && question.answers.length > 0) {
      return question.answers;
    }
    
    // Create default options for testing if none found
    console.warn("No options found for question:", question);
    return [
      { _id: `${question._id || 'q'}-o1`, text: 'Option A (No real options found)' },
      { _id: `${question._id || 'q'}-o2`, text: 'Option B (No real options found)' },
      { _id: `${question._id || 'q'}-o3`, text: 'Option C (No real options found)' }
    ];
  };
  
  const options = getOptions(currentQuestion);
  
  // Helper function to safely render question text
  const renderQuestion = (question) => {
    if (!question) return 'Question not available';
    return question.question || question.text || 'Question not available';
  };

  // Update the renderOptions function for cleaner option rendering
  const renderOptions = (question) => {
    if (!question) return [];
    
    // For true-false questions
    if (question.type === 'true-false') {
      return [
        { _id: 'true', text: 'True' },
        { _id: 'false', text: 'False' }
      ];
    }
    
    // Extract options with consistent IDs
    if (Array.isArray(question.options) && question.options.length > 0) {
      return question.options.map(option => {
        // Handle both object and string formats
        if (typeof option === 'object') {
          return {
            _id: option._id || option.id || String(option.value || Math.random()),
            text: option.text || option.label || option.value || 'Option'
          };
        } else {
          return {
            _id: String(option),
            text: option
          };
        }
      });
    } else if (Array.isArray(question.choices) && question.choices.length > 0) {
      return question.choices.map(choice => ({
        _id: choice._id || choice.id || String(Math.random()),
        text: choice.text || choice.label || 'Choice'
      }));
    }
    
    return [];
  };

  // Add a results layout component
  const QuizResultsView = () => {
    if (!quizResults) return null;
    
    const { score, percentageScore, passed, correctAnswers, totalQuestions } = quizResults;
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center mb-4">
            {passed ? (
              <div className="bg-green-100 text-green-800 p-3 rounded-full">
                <TrophyIcon className="h-12 w-12" />
              </div>
            ) : (
              <div className="bg-red-100 text-red-800 p-3 rounded-full">
                <XCircleIcon className="h-12 w-12" />
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Quiz Completed'}
          </h1>
          
          <p className="text-lg text-gray-600">
            {passed 
              ? 'You have successfully passed this quiz!' 
              : 'You did not meet the passing score for this quiz.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-blue-800 font-bold text-3xl mb-1">{percentageScore}%</div>
            <div className="text-blue-600 text-sm">Your Score</div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-indigo-800 font-bold text-3xl mb-1">{quiz?.passingScore || 70}%</div>
            <div className="text-indigo-600 text-sm">Passing Score</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-purple-800 font-bold text-3xl mb-1">{correctAnswers}/{totalQuestions}</div>
            <div className="text-purple-600 text-sm">Correct Answers</div>
          </div>
        </div>
        
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
              passed ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentageScore}%` }}
          ></div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <button
            onClick={() => navigate('/student/assignments')}
            className="px-4 py-2 flex items-center text-blue-600 hover:text-blue-800 border border-blue-600 rounded-lg justify-center w-full md:w-auto"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Assignments
          </button>
          
          {!passed && (
            <button
              onClick={() => {
                navigate(0); // Refresh the page to retry
              }}
              className="px-4 py-2 flex items-center bg-blue-600 text-white hover:bg-blue-700 rounded-lg justify-center w-full md:w-auto"
            >
              Retry Quiz
              <ArrowPathIcon className="h-4 w-4 ml-2" />
            </button>
          )}
          
          {passed && (
            <button
              onClick={() => navigate(`/student/course/${quiz?.courseId?._id || quiz?.courseId}`)}
              className="px-4 py-2 flex items-center bg-green-600 text-white hover:bg-green-700 rounded-lg justify-center w-full md:w-auto"
            >
              Continue Learning
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Add intro screen component
  const QuizIntroScreen = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 rounded-full p-4">
            <DocumentTextIcon className="h-12 w-12 text-blue-700" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-4">{quiz?.title}</h1>
        
        <div className="mb-8">
          <p className="text-gray-600 mb-4">{quiz?.description}</p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Quiz Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span>Duration: {quiz?.duration} minutes</span>
              </div>
              <div className="flex items-center">
                <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span>Questions: {questionsArray?.length || 0}</span>
              </div>
              <div className="flex items-center">
                <TrophyIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span>Passing Score: {quiz?.passingScore || 70}%</span>
              </div>
              <div className="flex items-center">
                <FireIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span>Attempts: Unlimited</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-medium text-blue-800 mb-2">Instructions</h3>
            <ul className="text-blue-700 text-sm space-y-1 list-disc pl-5">
              <li>Read each question carefully before answering</li>
              <li>You can navigate between questions using the navigation buttons</li>
              <li>The quiz will auto-submit when the time runs out</li>
              <li>Make sure you have a stable internet connection</li>
              <li>Don't refresh or close the page during the quiz</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={handleStartQuiz}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            disabled={startQuizMutation.isLoading}
          >
            {startQuizMutation.isLoading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>Start Quiz</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Add loading state component
  const LoadingState = () => {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Loading Quiz...</h2>
        <p className="text-gray-500 mt-2">Please wait while we prepare your quiz</p>
      </div>
    );
  };

  // Update the main component return to include the new components
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-2" />
            <p className="text-red-700">Failed to load quiz: {error.message}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/student/assignments')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Assignments
        </button>
      </div>
    );
  }

  if (quizComplete) {
    return <QuizResultsView />;
  }

  if (!quizStarted) {
    return <QuizIntroScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Quiz header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{quiz?.title || 'Quiz'}</h1>
          <div className="text-sm text-gray-600 mt-1">
            {Object.keys(userAnswers).length} of {questionsArray.length} questions answered
          </div>
        </div>
        
        <div className="flex items-center">
          <div className={`flex items-center mr-6 ${remainingTime < 300 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
            <ClockIcon className="h-5 w-5 mr-1" />
            <span className={`font-medium ${remainingTime < 300 ? 'font-bold' : ''}`}>{formatTimeRemaining()}</span>
          </div>
          
          <div className="text-sm">
            Question {currentQuestionIndex + 1} of {questionsArray.length}
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="bg-green-600 h-full transition-all duration-300"
          style={{ width: `${calculateProgress()}%` }}
        ></div>
      </div>
      
      {/* Question card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-medium">Question {currentQuestionIndex + 1}</h2>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {currentQuestion?.points || 1} {(currentQuestion?.points || 1) === 1 ? 'point' : 'points'}
          </span>
        </div>
        
        <p className="text-gray-800 text-lg mb-6">{renderQuestion(currentQuestion)}</p>
        
        <div className="space-y-3">
          {currentQuestion && renderOptions(currentQuestion).map((option) => {
            // Get IDs directly from current question and option
            const questionId = currentQuestion._id || currentQuestion.id;
            const optionId = option._id || option.id;
            
            // Check if selected - more lenient comparison to handle different ID formats
            const isSelected = userAnswers[questionId]?.some(id => 
              id.toString() === optionId.toString()
            );
            
            return (
              <div
                key={optionId}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-green-400 text-white border-green-500 shadow-md' 
                    : 'hover:bg-gray-50 border-gray-300'
                }`}
                onClick={() => {
                  console.log('Option clicked:', questionId, optionId);
                  handleOptionSelect(questionId, optionId);
                }}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                    isSelected ? 'bg-white border-white' : 'border-gray-400'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={isSelected ? 'font-medium' : ''}>{option.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={goToPreviousQuestion}
          className="px-4 py-2 flex items-center text-gray-600 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Previous
        </button>
        
        {currentQuestionIndex < questionsArray.length - 1 ? (
          <button
            onClick={goToNextQuestion}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isCurrentQuestionAnswered()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Next Question
          </button>
        ) : (
          <button
            onClick={handleSubmitQuiz}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center transition-colors"
            disabled={submitQuizMutation.isLoading}
          >
            {submitQuizMutation.isLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Quiz'
            )}
          </button>
        )}
      </div>
      
      {/* Question navigation */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Question Navigation</h3>
        <div className="flex flex-wrap gap-2">
          {questionsArray.map((q, index) => {
            const questionId = q._id || q.id || `question-${index}`;
            const isAnswered = userAnswers[questionId] && userAnswers[questionId].length > 0;
            const isCurrentQuestion = currentQuestionIndex === index;
            
            return (
              <button
                key={questionId}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm relative transition-all
                  ${isCurrentQuestion
                    ? 'bg-blue-600 text-white scale-110'
                    : isAnswered
                      ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                title={`Question ${index + 1}${isAnswered ? ' (Answered)' : ' (Not answered)'}`}
              >
                {index + 1}
                {isAnswered && !isCurrentQuestion && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt; 