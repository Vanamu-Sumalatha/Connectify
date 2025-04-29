import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon as ClockIconOutline,
  ExclamationCircleIcon,
  ArrowPathIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import ProgressBar from '../../../components/ui/ProgressBar';

const MyCourses = () => {
  const [filter, setFilter] = useState('all');
  const baseUrl = 'http://localhost:5000';

  // Fetch enrolled courses
  const {
    data: enrolledCourses,
    isLoading: isLoadingEnrolled,
    error: errorEnrolled,
    refetch: refetchEnrolled
  } = useQuery({
    queryKey: ['enrolledCourses'],
    queryFn: async () => {
      try {
      const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await axios.get(`${baseUrl}/api/student/courses/enrolled`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        toast.error('Failed to load your courses');
        
        // Return fallback data for demo
        return [
          {
            _id: '101',
            title: 'Demo Advanced JavaScript Programming',
            description: 'Master advanced JavaScript concepts including closures, prototypes, async/await, and modern ES6+ features.',
            thumbnail: '/assets/course-javascript.jpg',
            instructor: 'Course Instructor',
            progress: 35,
            status: 'in-progress',
            lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            completedLessons: 4,
            totalLessons: 12,
            isWishlisted: false
          },
          {
            _id: '102',
            title: 'Demo UX/UI Design Principles',
            description: 'Learn the fundamentals of user experience and interface design through practical examples and real-world projects.',
            thumbnail: '/assets/course-uxui.jpg',
            instructor: 'Course Instructor',
            progress: 100,
            status: 'completed',
            lastAccessed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            completedLessons: 10,
            totalLessons: 10,
            isWishlisted: false
          }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Fetch wishlist courses
  const {
    data: wishlistCourses,
    isLoading: isLoadingWishlist,
    error: errorWishlist,
    refetch: refetchWishlist
  } = useQuery({
    queryKey: ['wishlistCourses'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await axios.get(`${baseUrl}/api/student/courses/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      return response.data;
      } catch (error) {
        console.error('Error fetching wishlist courses:', error);
        
        // Return fallback data for demo
        return [
          {
            _id: '104',
            title: 'Demo Cloud Computing Fundamentals',
            description: 'Introduction to cloud computing concepts, services, and deployment models with hands-on practice.',
            thumbnail: '/assets/course-cloud.jpg',
            instructor: 'Course Instructor',
            progress: 0,
            status: 'wishlist',
            lastAccessed: null,
            completedLessons: 0,
            totalLessons: 8,
            isWishlisted: true
          },
          {
            _id: '105',
            title: 'Demo Digital Marketing Essentials',
            description: 'Learn digital marketing strategies including SEO, social media, content marketing, and analytics.',
            thumbnail: '/assets/course-marketing.jpg',
            instructor: 'Course Instructor',
            progress: 0,
            status: 'wishlist',
            lastAccessed: null,
            completedLessons: 0,
            totalLessons: 12,
            isWishlisted: true
          }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Combine all courses
  const allCourses = React.useMemo(() => {
    const enrolled = enrolledCourses || [];
    const wishlist = wishlistCourses || [];
    
    // Avoid duplicates by checking IDs
    const enrolledIds = new Set(enrolled.map(course => course._id));
    const filteredWishlist = wishlist.filter(course => !enrolledIds.has(course._id));
    
    return [...enrolled, ...filteredWishlist];
  }, [enrolledCourses, wishlistCourses]);
  
  // Categorized courses
  const categorizedCourses = React.useMemo(() => {
    const inProgress = enrolledCourses?.filter(course => 
      course.status === 'in-progress' && course.progress < 100
    ) || [];
    const completed = enrolledCourses?.filter(course => 
      course.status === 'completed' || course.progress === 100
    ) || [];
    const notStarted = enrolledCourses?.filter(course => 
      course.status === 'not-started' && course.progress === 0
    ) || [];
    const wishlist = wishlistCourses || [];
    
    return {
      all: allCourses,
      'in-progress': inProgress,
      completed,
      'not-started': notStarted,
      wishlist
    };
  }, [allCourses, enrolledCourses, wishlistCourses]);

  // Get current filtered courses
  const filteredCourses = categorizedCourses[filter] || [];
  
  const isLoading = isLoadingEnrolled || isLoadingWishlist;
  const error = errorEnrolled || errorWishlist;

  const handleRefresh = () => {
    refetchEnrolled();
    refetchWishlist();
    toast.success('Refreshing your courses...');
  };

  // Handle toggling wishlist status
  const toggleWishlist = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.post(
        `${baseUrl}/api/student/courses/wishlist/${courseId}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh courses after toggling wishlist
      refetchEnrolled();
      refetchWishlist();
      toast.success('Wishlist updated');
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />
            <div>
              <p className="text-red-700 font-medium">Error loading your courses</p>
              <p className="text-red-600">{error.message || 'An error occurred while loading your enrolled courses.'}</p>
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Title and Refresh */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
          <p className="text-gray-600 text-sm">Track your learning progress</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/student/courses/catalog"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Browse Courses
          </Link>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            title="Refresh Courses"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter('all')}
          >
            All Courses
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              filter === 'in-progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              filter === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              filter === 'not-started'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter('not-started')}
          >
            Not Started
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              filter === 'wishlist'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter('wishlist')}
          >
            Wishlist
          </button>
        </div>
      </div>

      {/* Add the following after the filter tabs section */}
      {categorizedCourses.completed && categorizedCourses.completed.length > 0 && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-800 mb-1">
                Congratulations on your achievements!
              </h3>
              <p className="text-green-700 mb-2">
                You've completed {categorizedCourses.completed.length} course{categorizedCourses.completed.length > 1 ? 's' : ''}. Keep up the great work!
              </p>
              <button 
                onClick={() => setFilter('completed')}
                className="text-sm font-medium text-green-600 hover:text-green-800"
              >
                View your completed courses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all'
              ? "You haven't enrolled in any courses yet."
              : filter === 'in-progress'
              ? "You don't have any courses in progress."
              : filter === 'completed'
              ? "You haven't completed any courses yet."
              : filter === 'wishlist'
              ? "You don't have any courses in your wishlist."
              : "You don't have any courses to start."}
          </p>
          <Link
            to="/student/courses/catalog"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100"
            >
              <div className="relative">
                <img
                  src={course.thumbnail || `/assets/course-placeholder.jpg`}
                  alt={course.title}
                  className="w-full h-52 object-cover"
                  onError={(e) => {
                    e.target.src = '/assets/course-placeholder.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="absolute bottom-0 w-full p-4">
                    <h3 className="text-lg font-bold text-white">{course.title}</h3>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                      course.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : course.status === 'in-progress'
                        ? 'bg-blue-500 text-white'
                        : course.status === 'wishlist'
                        ? 'bg-purple-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {course.status === 'completed'
                      ? 'Completed'
                      : course.status === 'in-progress'
                      ? 'In Progress'
                      : course.status === 'wishlist'
                      ? 'Wishlist'
                      : 'Not Started'}
                  </span>

                  {course.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/80 text-gray-800 shadow-sm">
                      {course.category}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => toggleWishlist(course._id)}
                  className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                >
                  {course.isWishlisted ? (
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
                  )}
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center mb-3 gap-2">
                  {course.level && (
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${course.level === 'Beginner' ? 'bg-green-100 text-green-800' : 
                        course.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' : 
                          'bg-purple-100 text-purple-800'}`}>
                      {course.level}
                    </span>
                  )}
                  {course.duration && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {course.duration} hrs
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                <div className="mb-4">
                  <ProgressBar 
                    progress={course.progress}
                    status={course.status}
                    completedCount={course.completedLessons}
                    totalCount={course.totalLessons}
                    showDetails={false}
                  />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpenIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>
                      {course.completedLessons} of {course.totalLessons} lessons completed
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>
                      {course.lastAccessed
                        ? `Last accessed ${new Date(course.lastAccessed).toLocaleDateString()}`
                        : 'Not started yet'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-100">
                  {course.status === 'completed' ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircleIcon className="w-5 h-5 mr-1" />
                      <span>Completed</span>
                    </div>
                  ) : course.status === 'in-progress' ? (
                    <div className="flex items-center text-blue-600">
                      <ClockIconOutline className="w-5 h-5 mr-1" />
                      <span>Continue</span>
                    </div>
                  ) : course.status === 'wishlist' ? (
                    <div className="flex items-center text-purple-600">
                      <HeartIcon className="w-5 h-5 mr-1" />
                      <span>Wishlist</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <ClockIconOutline className="w-5 h-5 mr-1" />
                      <span>Start</span>
                    </div>
                  )}

                  <Link
                    to={`/student/courses/${course._id}`}
                    state={{ course }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <span className="mr-1">View</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explore More Courses */}
      <div className="mt-12 flex justify-center">
        <Link
          to="/student/courses/catalog"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Explore More Courses
        </Link>
        </div>
    </div>
  );
};

export default MyCourses; 