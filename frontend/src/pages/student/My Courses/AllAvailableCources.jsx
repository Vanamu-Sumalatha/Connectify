import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const AllAvailableCources = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all courses
  const {
    data: courses,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['allCourses'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const baseUrl = 'http://localhost:5000';
        const response = await axios.get(`${baseUrl}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Courses fetched successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching courses:', error);
        const errorMessage = error.response?.status === 500 
          ? 'Server error. Please try again later or contact support.' 
          : `Failed to load courses: ${error.message}`;
        toast.error(errorMessage);
        
        // Return empty array instead of throwing to prevent the error state
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Fetch user's enrolled courses
  const { data: enrolledCourses } = useQuery({
    queryKey: ['enrolledCourses'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const baseUrl = 'http://localhost:5000';
        const response = await axios.get(`${baseUrl}/api/student/courses/enrolled`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Enrolled courses fetched successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch wishlist
  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const baseUrl = 'http://localhost:5000';
        const response = await axios.get(`${baseUrl}/api/student/courses/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Wishlist fetched successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Filter courses based on tab and search query
  const filteredCourses = React.useMemo(() => {
    if (!courses) return [];
    
    let filtered = [...courses];
    
    // Apply tab filter
    if (activeTab === 'in-progress') {
      filtered = filtered.filter(course => course.isEnrolled && course.status === 'in-progress');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(course => course.isEnrolled && course.status === 'completed');
    } else if (activeTab === 'not-started') {
      filtered = filtered.filter(course => course.isEnrolled && course.status === 'not-started');
    } else if (activeTab === 'wishlist') {
      filtered = filtered.filter(course => course.isWishlisted);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(query) || 
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [courses, activeTab, searchQuery]);

  // Handle course click
  const handleCourseClick = (courseId) => {
    navigate(`/student/courses/${courseId}`);
  };

  // Handle enrollment
  const enrollMutation = useMutation({
    mutationFn: async (courseId) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const baseUrl = 'http://localhost:5000';
      try {
        const response = await axios.post(
          `${baseUrl}/api/student/courses/enroll/${courseId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (apiError) {
        console.error('Enrollment API error:', apiError);
        // Format the error message to be more user-friendly
        if (apiError.response?.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw new Error(apiError.response?.data?.message || 'Failed to enroll in course');
      }
    },
    onSuccess: (data, courseId) => {
      toast.success('Successfully enrolled in course');
      // Update the course in the cache directly
      queryClient.setQueryData(['allCourses'], (oldData) => {
        if (!oldData) return [];
        return oldData.map(course => {
          if (course._id === courseId) {
            // Update the course with the enrollment data
            return {
              ...course,
              isEnrolled: true,
              status: 'not-started',
              progress: 0
            };
          }
          return course;
        });
      });
      // Also invalidate enrolledCourses to refetch
      queryClient.invalidateQueries(['enrolledCourses']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enroll in course');
    }
  });

  const handleEnroll = (e, courseId) => {
    e.stopPropagation(); // Prevent triggering the card click
    enrollMutation.mutate(courseId);
  };

  // Refresh data
  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing courses...');
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />
            <div>
              <p className="text-red-700 font-medium">Error loading courses</p>
              <p className="text-red-600">{error.message || 'An error occurred while loading available courses.'}</p>
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
          <h1 className="text-2xl font-bold text-gray-800">All Courses</h1>
          <p className="text-gray-600 text-sm">Discover and manage your learning journey</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/student/courses/catalog"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Browse More Courses
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses by title, description, category, or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Courses
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'in-progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('in-progress')}
          >
            In Progress
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'not-started'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('not-started')}
          >
            Not Started
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('wishlist')}
          >
            Wishlist
          </button>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {activeTab === 'all'
              ? "We couldn't find any courses matching your criteria."
              : activeTab === 'in-progress'
              ? "You don't have any courses in progress."
              : activeTab === 'completed'
              ? "You haven't completed any courses yet."
              : activeTab === 'not-started'
              ? "You don't have any courses waiting to be started."
              : "You don't have any courses in your wishlist."}
          </p>
          <Link
            to="/student/courses/catalog"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse All Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => handleCourseClick(course._id)}
            >
              <div className="relative">
                <img
                  src={course.thumbnail || `/assets/course-placeholder.jpg`}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = '/assets/course-placeholder.jpg';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : course.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : course.status === 'wishlist'
                        ? 'bg-purple-100 text-purple-800'
                        : course.status === 'not-started'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {course.status === 'completed'
                      ? 'Completed'
                      : course.status === 'in-progress'
                      ? 'In Progress'
                      : course.status === 'wishlist'
                      ? 'Wishlist'
                      : course.status === 'not-started'
                      ? 'Not Started'
                      : 'Available'}
                  </span>
                </div>
                {course.isWishlisted && (
                  <div className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md">
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-800`}>
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                {course.isEnrolled && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          course.status === 'completed'
                            ? 'bg-green-500'
                            : course.status === 'wishlist'
                            ? 'bg-purple-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpenIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{course.lessons?.length || 0} lessons</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{course.duration} hours</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <UserGroupIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{course.totalStudents} students</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex text-yellow-400 mr-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(course.rating) ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <span>{course.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/courses/${course._id}`);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Details
                  </button>
                  
                  {course.isEnrolled ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/courses/${course._id}`);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      {course.status === 'completed' ? 'View Certificate' : 'Continue Learning'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleEnroll(e, course._id)}
                      disabled={enrollMutation.isLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {enrollMutation.isLoading && enrollMutation.variables === course._id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enrolling...
                        </>
                      ) : (
                        'Enroll Now'
                      )}
                    </button>
                  )}
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

export default AllAvailableCources;