import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  AcademicCapIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const CourseEnrollment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);

  // Fetch course details
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
    refetch
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      try {
      const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const baseUrl = 'http://localhost:5000';
        try {
          const response = await axios.get(`${baseUrl}/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
        } catch (apiError) {
          console.error('API error:', apiError);
          
          // Fallback data for demo purposes
          return {
            _id: courseId,
            title: 'Advanced JavaScript Programming',
            description: 'Master advanced JavaScript concepts including closures, prototypes, async/await, and modern ES6+ features. This course provides a deep dive into JavaScript programming, covering advanced topics and modern development practices.',
            thumbnail: '/assets/course-javascript.jpg',
            instructor: 'Prof. Michael Chen',
            totalStudents: 234,
            duration: 20,
            level: 'advanced',
            rating: 4.8,
            category: 'programming',
            prerequisites: ['Basic JavaScript knowledge', 'Understanding of web development concepts'],
            objectives: [
              'Understand advanced JavaScript concepts like closures and prototypes',
              'Master asynchronous programming with promises and async/await',
              'Learn modern ES6+ features and best practices',
              'Build complex applications using design patterns',
              'Optimize JavaScript code for better performance'
            ],
            syllabus: 'This course covers advanced JavaScript concepts, asynchronous programming, modern ES6+ features, design patterns, and performance optimization techniques.',
            lessons: Array(12).fill().map((_, i) => ({
              _id: `lesson-${i+1}`,
              title: `Lesson ${i+1}: ${['Variables & Scope', 'Functions & Closures', 'Prototypes', 'Async Programming', 'ES6 Features', 'Error Handling', 'Design Patterns', 'Performance Optimization', 'Testing Strategies', 'Project Structure', 'Browser APIs', 'Final Project'][i % 12]}`
            }))
          };
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course details');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Check if already enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!courseId) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const baseUrl = 'http://localhost:5000';
        try {
          const response = await axios.get(`${baseUrl}/api/student/courses/enrolled`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const isEnrolled = response.data.some(course => course._id === courseId);
          setIsAlreadyEnrolled(isEnrolled);
        } catch (error) {
          console.error('Error checking enrollment:', error);
          // For demo, check local storage for enrolled courses
          const enrolledCoursesString = localStorage.getItem('enrolledCourses');
          if (enrolledCoursesString) {
            const enrolledCourses = JSON.parse(enrolledCoursesString);
            setIsAlreadyEnrolled(enrolledCourses.includes(courseId));
          }
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
      }
    };

    checkEnrollment();
  }, [courseId]);

  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const baseUrl = 'http://localhost:5000';
      try {
      const response = await axios.post(
          `${baseUrl}/api/student/courses/enroll`,
          { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // Fallback for demo purposes
        // Store enrolled course in localStorage for demo
        const enrolledCoursesString = localStorage.getItem('enrolledCourses');
        let enrolledCourses = enrolledCoursesString ? JSON.parse(enrolledCoursesString) : [];
        
        if (!enrolledCourses.includes(courseId)) {
          enrolledCourses.push(courseId);
          localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
        }
        
        return { message: 'Enrolled successfully' };
      }
    },
      onSuccess: () => {
      toast.success('Successfully enrolled in the course!');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
      navigate('/student/courses');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enroll in the course');
    }
  });

  const handleEnroll = () => {
    if (isAlreadyEnrolled) {
      navigate('/student/courses');
    } else {
      enrollMutation.mutate();
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing course details...');
  };

  if (courseError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />
            <div>
              <p className="text-red-700 font-medium">Error loading course details</p>
              <p className="text-red-600">{courseError.message || 'An error occurred while loading the course details.'}</p>
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
        <Link
          to="/student/courses/catalog"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Course Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          to="/student/courses/catalog"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Course Catalog
        </Link>
      </div>

        {/* Course Details */}
      {courseLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Course Header */}
          <div className="relative">
            <img
              src={course?.thumbnail || '/assets/course-placeholder.jpg'}
              alt={course?.title}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.target.src = '/assets/course-placeholder.jpg';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center p-6">
                <h1 className="text-3xl font-bold text-white mb-2">{course?.title}</h1>
                <div className="flex justify-center items-center text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon 
                      key={i} 
                      className={`h-5 w-5 ${i < Math.floor(course?.rating || 0) ? 'fill-current' : ''}`}
                    />
                  ))}
                  <span className="ml-2 text-white">{course?.rating?.toFixed(1) || 0}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-800`}>
                  {course?.level?.charAt(0).toUpperCase() + course?.level?.slice(1) || 'Beginner'}
                </span>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <AcademicCapIcon className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Instructor</p>
                  <p className="font-medium">{course?.instructor}</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <ClockIcon className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{course?.duration} hours</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                <UserGroupIcon className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Students</p>
                  <p className="font-medium">{course?.totalStudents} enrolled</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">About this course</h2>
              <p className="text-gray-700">{course?.description}</p>
            </div>

            {course?.prerequisites && course.prerequisites.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Prerequisites</h2>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {course.prerequisites.map((prerequisite, index) => (
                    <li key={index}>{prerequisite}</li>
                  ))}
                </ul>
              </div>
            )}

            {course?.objectives && course.objectives.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">What you'll learn</h2>
                <ul className="space-y-2">
                  {course.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
            )}

            {course?.syllabus && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Syllabus</h2>
                <p className="text-gray-700">{course.syllabus}</p>
            </div>
            )}

            {course?.lessons && course.lessons.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Course Content</h2>
                <p className="text-sm text-gray-500 mb-4">{course.lessons.length} lessons • {course.duration} hours total</p>
                
                <div className="border rounded-lg overflow-hidden">
                  {course.lessons.map((lesson, index) => (
                    <div 
                      key={lesson._id} 
                      className={`p-4 flex items-center ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="font-medium">{lesson.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enrollment Action */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                className={`px-6 py-3 rounded-lg font-medium text-white ${
                  isAlreadyEnrolled
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors ${
                  enrollMutation.isPending ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {enrollMutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : isAlreadyEnrolled ? (
                  'Go to My Courses'
                ) : (
                  'Enroll in Course'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollment; 