import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { baseUrl } from '../../../config.js';

const Quiz = () => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'pending'
  
  const queryClient = useQueryClient();

  // Fetch available quizzes
  const { 
    data: quizzes, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        try {
          const response = await axios.get(
            `${baseUrl}/api/quiz/student/quizzes`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          return response.data;
        } catch (apiError) {
          console.error('API error fetching quizzes:', apiError);
          
          if (apiError.response?.status === 404) {
            console.log('Quizzes endpoint not available yet, using fallback data');
            // Fallback data for quizzes
            return [
              {
                _id: 'quiz001',
                title: 'JavaScript Fundamentals Quiz',
                description: 'Test your knowledge of JavaScript basics, including variables, data types, and functions.',
                courseId: {
                  _id: 'course001',
                  title: 'Advanced JavaScript Programming',
                  thumbnail: 'https://via.placeholder.com/150'
                },
                attempts: 0,
                bestScore: null,
                passed: false,
                passingScore: 70,
                duration: 30 // minutes
              },
              {
                _id: 'quiz002',
                title: 'React Components Quiz',
                description: 'Test your understanding of React components, props, state, and lifecycle methods.',
                courseId: {
                  _id: 'course002',
                  title: 'Frontend Web Development',
                  thumbnail: 'https://via.placeholder.com/150'
                },
                attempts: 2,
                bestScore: 85,
                passed: true,
                passingScore: 70,
                duration: 45 // minutes
              },
              {
                _id: 'quiz003',
                title: 'Database Fundamentals',
                description: 'Test your knowledge of database concepts, SQL, and normalization.',
                courseId: {
                  _id: 'course003',
                  title: 'Database Systems',
                  thumbnail: 'https://via.placeholder.com/150'
                },
                attempts: 1,
                bestScore: 60,
                passed: false,
                passingScore: 75,
                duration: 60 // minutes
              }
            ];
          }
          
          throw apiError;
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        if (error.response?.status !== 404) {
          toast.error('Failed to load quizzes');
        }
        throw error;
      }
    },
    retry: 1,
  });

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshed quizzes');
  };

  const getStatusColor = (quiz) => {
    if (quiz.passed) {
      return 'text-green-600';
    } else if (quiz.attempts > 0) {
      return 'text-red-600';
    }
    return 'text-blue-600';
  };

  const getStatusText = (quiz) => {
    if (quiz.passed) {
      return 'Passed';
    } else if (quiz.attempts > 0) {
      return 'Failed';
    }
    return 'Not attempted';
  };

  const getStatusIcon = (quiz) => {
    if (quiz.passed) {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    } else if (quiz.attempts > 0) {
      return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
    }
    return <ClockIcon className="h-5 w-5 text-blue-600" />;
  };

  // Filter quizzes based on status
  const filteredQuizzes = quizzes?.filter(quiz => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return quiz.passed;
    if (filterStatus === 'pending') return !quiz.passed;
    return true;
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-gray-600 text-sm">Test your knowledge with quizzes from your completed courses</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 ${
            filterStatus === 'all'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Quizzes
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 ${
            filterStatus === 'completed'
              ? 'border-b-2 border-green-500 text-green-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Passed
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 ${
            filterStatus === 'pending'
              ? 'border-b-2 border-yellow-500 text-yellow-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending
        </button>
      </div>

      {/* Quizzes grid */}
      {filteredQuizzes?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-40 bg-gray-200 relative">
                {quiz.courseId?.thumbnail ? (
                  <img 
                    src={quiz.courseId.thumbnail} 
                    alt={quiz.courseId.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100">
                    <DocumentTextIcon className="h-16 w-16 text-blue-500" />
                  </div>
                )}
                
                {quiz.passed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                    <TrophyIcon className="h-4 w-4 mr-1" />
                    Passed
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-medium mb-2">{quiz.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                
                {quiz.courseId && (
                  <div className="text-sm text-gray-500 mb-3 flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    <span>{quiz.courseId.title}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center text-sm">
                    <ClockIcon className="h-4 w-4 mr-1 text-gray-500" />
                    <span>{quiz.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-sm">
                    {getStatusIcon(quiz)}
                    <span className={`ml-1 ${getStatusColor(quiz)}`}>
                      {getStatusText(quiz)}
                    </span>
                  </div>
                </div>
                
                {quiz.attempts > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="bg-gray-100 p-2 rounded text-center">
                      <p className="text-gray-500">Best Score</p>
                      <p className={`font-bold ${quiz.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {quiz.bestScore ? `${Math.round(quiz.bestScore)}%` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded text-center">
                      <p className="text-gray-500">Attempts</p>
                      <p className="font-bold text-blue-600">{quiz.attempts}</p>
                    </div>
                  </div>
                )}
                
                <Link
                  to={`/student/assignments/quiz/${quiz._id}`}
                  className="w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {quiz.attempts === 0 ? 'Start Quiz' : 'Retake Quiz'}
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No quizzes available</h3>
          <p className="text-gray-600 mb-6">
            {filterStatus === 'all'
              ? 'You don\'t have any quizzes available yet. Complete courses to unlock quizzes.'
              : filterStatus === 'completed'
              ? 'You haven\'t passed any quizzes yet. Keep studying!'
              : 'You\'ve completed all available quizzes!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Quiz; 