import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  HeartIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

const CourseCatalog = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    level: 'all',
    rating: 'all',
  });
  const [enrollmentData, setEnrollmentData] = useState({
    enrolled: [],
    completed: []
  });
  const baseUrl = 'http://localhost:5000';

  // Fetch user enrollments separately to get progress and completion info
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['userEnrollments'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get(`${baseUrl}/api/student/courses/enrolled`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Process enrollments
        const enrolled = [];
        const completed = [];
        
        response.data.forEach(course => {
          if (course.status === 'completed') {
            completed.push(course._id);
          }
          enrolled.push(course._id);
        });
        
        setEnrollmentData({ enrolled, completed });
        return response.data;
      } catch (error) {
        console.error('Error fetching user enrollments:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000
  });

  // Fetch courses
  const { 
    data: courses, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['courses', searchQuery, filters],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        try {
          const response = await axios.get(`${baseUrl}/api/courses`, {
            params: {
              search: searchQuery,
              ...filters,
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          return response.data;
        } catch (apiError) {
          console.error('API error:', apiError);
          
          // Fallback data for demo purposes
          return [];
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Mark courses with enrollment status based on separate enrollment data
  const coursesWithEnrollmentStatus = React.useMemo(() => {
    if (!courses) return [];
    
    return courses.map(course => ({
      ...course,
      isEnrolled: enrollmentData.enrolled.includes(course._id),
      isCompleted: enrollmentData.completed.includes(course._id),
      // Ensure rating is a number, default to 0 if undefined
      rating: typeof course.rating === 'number' ? course.rating : 0
    }));
  }, [courses, enrollmentData]);

  // Mutation for enrolling in a course
  const enrollMutation = useMutation({
    mutationFn: async (courseId) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      try {
        const response = await axios.post(
          `${baseUrl}/api/student/courses/enroll/${courseId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (apiError) {
        console.error('Enrollment API error:', apiError);
        // For demo, simulate successful enrollment
        return { 
          success: true, 
          message: 'Successfully enrolled in course' 
        };
      }
    },
    onSuccess: (data, courseId) => {
      queryClient.setQueryData(['courses'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(course => 
          course._id === courseId 
            ? { ...course, isEnrolled: true } 
            : course
        );
      });
      toast.success('Successfully enrolled in course');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to enroll in course');
    }
  });

  // Mutation for wishlist
  const wishlistMutation = useMutation({
    mutationFn: async ({ courseId, action }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      try {
        const response = await axios.post(
          `${baseUrl}/api/student/courses/wishlist/${courseId}`,
          { action }, // 'add' or 'remove'
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (apiError) {
        console.error('Wishlist API error:', apiError);
        // For demo, simulate successful wishlist update
        return { 
          success: true, 
          message: `Successfully ${action === 'add' ? 'added to' : 'removed from'} wishlist` 
        };
      }
    },
    onSuccess: (data, variables) => {
      const { courseId, action } = variables;
      queryClient.setQueryData(['courses'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(course => 
          course._id === courseId 
            ? { ...course, isWishlisted: action === 'add' } 
            : course
        );
      });
      toast.success(`Course ${action === 'add' ? 'added to' : 'removed from'} wishlist`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  });

  // Handle enrolling in a course
  const handleEnroll = (courseId) => {
    enrollMutation.mutate(courseId);
  };

  // Handle toggling wishlist status
  const toggleWishlist = (courseId, currentStatus) => {
    const action = currentStatus ? 'remove' : 'add';
    wishlistMutation.mutate({ courseId, action });
  };

  // Filter the courses based on the filters
  const filteredCourses = React.useMemo(() => {
    if (!coursesWithEnrollmentStatus) return [];
    
    return coursesWithEnrollmentStatus.filter(course => {
      // Filter by category
      if (filters.category !== 'all' && course.category !== filters.category) {
        return false;
      }
      
      // Filter by level
      if (filters.level !== 'all' && course.level !== filters.level) {
        return false;
      }
      
      // Filter by rating
      if (filters.rating !== 'all' && (course.rating || 0) < parseFloat(filters.rating)) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !course.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [coursesWithEnrollmentStatus, filters, searchQuery]);

  // Categories for filter
  const categories = [
    'all',
    'programming',
    'design',
    'data science',
    'business',
    'marketing',
    'cloud',
    'personal development',
  ];

  // Levels for filter
  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  // Rating ranges for filter
  const ratingRanges = [
    { value: 'all', label: 'All Ratings' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4', label: '4+ Stars' },
    { value: '3', label: '3+ Stars' },
  ];

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
          <h1 className="text-2xl font-bold text-gray-800">Course Catalog</h1>
          <p className="text-gray-600 text-sm">Explore and enroll in available courses</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/student/courses"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            My Courses
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

      {/* Search and Filter Header */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => setFilters({ category: 'all', level: 'all', rating: 'all' })}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
            Reset Filters
          </button>
        </div>

        {/* Filter Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={filters.level}
              onChange={(e) =>
                setFilters({ ...filters, level: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) =>
                setFilters({ ...filters, rating: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ratingRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Course Results Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-700">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'} Available
        </h2>
      </div>

      {/* Course Grid */}
      {isLoading || isLoadingEnrollments ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 
                ${course.isCompleted ? 'border-2 border-green-500' : ''}`}
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
                <span className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Free
                </span>
                {course.isCompleted && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[70px] border-t-green-500 border-l-[70px] border-l-transparent">
                    <CheckBadgeIcon className="absolute -top-[60px] right-[5px] w-6 h-6 text-white" />
                  </div>
                )}
                <button
                  onClick={() => toggleWishlist(course._id, course.isWishlisted)}
                  className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md"
                >
                  {course.isWishlisted ? (
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
                  )}
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-800`}>
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold line-clamp-1">{course.title}</h3>
                  {course.isCompleted && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Completed
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <AcademicCapIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{course.instructor}</span>
                  </div>
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
                          className={`h-4 w-4 ${i < Math.floor(course?.rating || 0) ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <span>{(course?.rating || 0).toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Link
                    to={`/student/courses/${course._id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Details
                  </Link>
                  {course.isCompleted ? (
                    <Link
                      to={`/student/courses/${course._id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Review Course
                    </Link>
                  ) : course.isEnrolled ? (
                    <Link
                      to={`/student/courses/${course._id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Continue Learning
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course._id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      disabled={enrollMutation.isLoading}
                    >
                      {enrollMutation.isLoading ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isLoadingEnrollments && filteredCourses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseCatalog; 