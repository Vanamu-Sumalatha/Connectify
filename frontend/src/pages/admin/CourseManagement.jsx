import React, { useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
  UserGroupIcon,
  StarIcon,
  AcademicCapIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  PlayIcon,
  MapIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { FaTrash } from 'react-icons/fa';

const CourseManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'programming',
    level: 'beginner',
    duration: 0,
    thumbnail: '',
    requirements: [''],
    objectives: [''],
    learningOutcomes: ['Upon completion of this course, students will be able to understand the core concepts'],
    code: '',
    rating: 0,
    totalStudents: 0,
    lessons: [{
      title: '',
      videoUrl: '',
      duration: 0,
      description: ''
    }],
    materials: []
  });

  const [currentMaterial, setCurrentMaterial] = useState({
    title: '',
    documentUrl: '',
    videoUrl: '',
    roadmapContent: '',
    description: '',
    materialType: 'document'
  });

  const queryClient = useQueryClient();

  // Fetch courses
  const { data: courses = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/admin/courses',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Admin courses API response:', response.data);
        
        // Check if response.data is an array or if it contains a courses property
        let coursesData = [];
        if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else if (response.data && response.data.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
        } else {
          console.error('Unexpected API response format:', response.data);
          return [];
        }
        
        // Process course data to ensure totalStudents is available
        return coursesData.map(course => {
          // If totalStudents is not available, calculate from enrollments if possible
          if (!course.totalStudents && course.enrollments) {
            course.totalStudents = course.enrollments.length;
          }
          
          // If enrolledStudents exists but totalStudents doesn't, use its length
          if (!course.totalStudents && course.enrolledStudents) {
            course.totalStudents = course.enrolledStudents.length;
          }
          
          // Ensure there's a default value for display
          if (!course.totalStudents) {
            course.totalStudents = 0;
          }
          
          return course;
        });
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      const token = localStorage.getItem('token');
      
      // Format the data for API
      const formattedData = {
        ...courseData,
        requirements: Array.isArray(courseData.requirements) 
          ? courseData.requirements 
          : courseData.requirements.split('\n').filter(item => item.trim()),
        objectives: Array.isArray(courseData.objectives)
          ? courseData.objectives
          : courseData.objectives.split('\n').filter(item => item.trim()),
        // Add learning outcomes (required by model) based on objectives
        learningOutcomes: Array.isArray(courseData.objectives)
          ? courseData.objectives
          : courseData.objectives.split('\n').filter(item => item.trim()),
        // Ensure lessons has the proper structure matching lessonSchema
        lessons: courseData.lessons.map(lesson => ({
          title: lesson.title,
          description: lesson.description || '',
          videoUrl: lesson.videoUrl || '',
          duration: Number(lesson.duration) || 0,
          materials: (lesson.materials && Array.isArray(lesson.materials)) 
            ? lesson.materials.map(material => ({ 
                title: material.title || material || 'Material',
                type: material.type || 'document',
                url: material.url || ''
              }))
            : []
        })),
        // Convert numeric string values to numbers
        duration: Number(courseData.duration),
        rating: Number(courseData.rating),
        totalStudents: Number(courseData.totalStudents),
        materials: courseData.materials.map(material => ({
          title: material.title,
          type: material.type,
          documentUrl: material.documentUrl || '',
          videoUrl: material.videoUrl || '',
          roadmapContent: material.roadmapContent || '',
          description: material.description || ''
        }))
      };

      // Use JSON format instead of FormData since we're not actually uploading files
      const response = await axios.post(
        'http://localhost:5000/api/courses',
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully');
      setIsSubmitting(false);
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error creating course:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error creating course');
      setIsSubmitting(false);
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, courseData }) => {
      const token = localStorage.getItem('token');
      
      // Format the data for API
      const formattedData = {
        ...courseData,
        requirements: Array.isArray(courseData.requirements) 
          ? courseData.requirements 
          : courseData.requirements.split('\n').filter(item => item.trim()),
        objectives: Array.isArray(courseData.objectives)
          ? courseData.objectives
          : courseData.objectives.split('\n').filter(item => item.trim()),
        learningOutcomes: Array.isArray(courseData.learningOutcomes)
          ? courseData.learningOutcomes
          : courseData.learningOutcomes.split('\n').filter(item => item.trim()),
        lessons: courseData.lessons.map(lesson => ({
          title: lesson.title,
          description: lesson.description || '',
          videoUrl: lesson.videoUrl || '',
          duration: Number(lesson.duration) || 0,
          materials: (lesson.materials && Array.isArray(lesson.materials)) 
            ? lesson.materials.map(material => ({ 
                title: material.title || material || 'Material',
                type: material.type || 'document',
                url: material.url || ''
              }))
            : []
        })),
        materials: courseData.materials.map(material => ({
          title: material.title,
          type: material.type,
          url: material.url,
          description: material.description || ''
        }))
      };

      console.log("Sending update request to API with data:", formattedData);
      console.log("API endpoint:", `http://localhost:5000/api/courses/${id}`);
      console.log("Token:", token ? "Token exists" : "No token found");

      try {
        const response = await axios.put(
          `http://localhost:5000/api/courses/${id}`,
          formattedData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log("API response:", response.data);
        return response.data;
      } catch (error) {
        console.error("API error:", error.response ? error.response.data : error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated successfully');
      setIsSubmitting(false);
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error updating course:', error.message);
      toast.error(error.message || 'Error updating course');
      setIsSubmitting(false);
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/courses/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting course');
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
    setFormData({
      title: '',
      description: '',
      category: 'programming',
      level: 'beginner',
      duration: 0,
      thumbnail: '',
      requirements: [''],
      objectives: [''],
      learningOutcomes: ['Upon completion of this course, students will be able to understand the core concepts'],
      code: '',
      rating: 0,
      totalStudents: 0,
      lessons: [{
        title: '',
        videoUrl: '',
        duration: 0,
        description: ''
      }],
      materials: []
    });
    setCurrentMaterial({
      title: '',
      documentUrl: '',
      videoUrl: '',
      roadmapContent: '',
      description: '',
      materialType: 'document'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log("Form submission started");
    console.log("Selected course:", selectedCourse);
    console.log("Form data before submission:", formData);
    
    // Format materials for submission
    const formattedMaterials = formData.materials.map(material => ({
      title: material.title,
      type: material.type,
      documentUrl: material.documentUrl || '',
      videoUrl: material.videoUrl || '',
      roadmapContent: material.roadmapContent || '',
      description: material.description || ''
    }));

    // Ensure learningOutcomes is properly set
    const formDataToSubmit = {
      ...formData,
      materials: formattedMaterials,
      // Make sure learningOutcomes is an array with at least one item
      learningOutcomes: Array.isArray(formData.learningOutcomes) && formData.learningOutcomes.length > 0
        ? formData.learningOutcomes
        : formData.objectives && formData.objectives.length > 0
          ? formData.objectives
          : ['Upon completion of this course, students will be able to understand the core concepts']
    };
    
    console.log("Form data after processing:", formDataToSubmit);
    
    if (selectedCourse) {
      console.log("Updating existing course with ID:", selectedCourse._id);
      updateCourseMutation.mutate({
        id: selectedCourse._id,
        courseData: formDataToSubmit,
      });
    } else {
      console.log("Creating new course");
      createCourseMutation.mutate(formDataToSubmit);
    }
  };

  const handleEdit = (course) => {
    console.log("Editing course:", course); // Debug log to see the course data
    
    setSelectedCourse(course);
    
    // Ensure requirements and objectives are arrays
    const requirements = Array.isArray(course.requirements) 
      ? course.requirements 
      : course.requirements 
        ? [course.requirements] 
        : [''];
    
    const objectives = Array.isArray(course.objectives) 
      ? course.objectives 
      : course.objectives 
        ? [course.objectives] 
        : [''];
    
    // Ensure learningOutcomes is an array (required by backend)
    const learningOutcomes = Array.isArray(course.learningOutcomes) 
      ? course.learningOutcomes 
      : course.learningOutcomes 
        ? [course.learningOutcomes] 
        : objectives.length > 0 && objectives[0] !== '' 
          ? objectives 
          : ['Upon completion of this course, students will be able to understand the core concepts'];
    
    // Ensure lessons is an array with at least one item
    const lessons = course.lessons && course.lessons.length > 0 
      ? course.lessons.map(lesson => ({
          title: lesson.title || '',
          videoUrl: lesson.videoUrl || '',
          duration: lesson.duration || 0,
          description: lesson.description || ''
        }))
      : [{ 
          title: '',
          videoUrl: '',
          duration: 0,
          description: ''
        }];
    
    // Ensure materials is an array with proper structure
    const materials = course.materials && course.materials.length > 0 
      ? course.materials.map(material => ({
          _id: material._id || Date.now().toString(),
          title: material.title || '',
          type: material.type || 'document',
          documentUrl: material.documentUrl || '',
          videoUrl: material.videoUrl || '',
          roadmapContent: material.roadmapContent || '',
          description: material.description || ''
        }))
      : [];
    
    // Debug logs
    console.log("Processed requirements:", requirements);
    console.log("Processed objectives:", objectives);
    console.log("Processed learningOutcomes:", learningOutcomes);
    console.log("Processed lessons:", lessons);
    console.log("Processed materials:", materials);
    
    // Set the form data with all fields
    const updatedFormData = {
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'programming',
      level: course.level || 'beginner',
      duration: course.duration || 0,
      thumbnail: course.thumbnail || '',
      requirements: requirements,
      objectives: objectives,
      learningOutcomes: learningOutcomes, // Add learningOutcomes field
      code: course.code || '',
      rating: course.rating || 0,
      totalStudents: course.totalStudents || 0,
      lessons: lessons,
      materials: materials
    };
    
    console.log("Setting form data to:", updatedFormData);
    setFormData(updatedFormData);
    
    // Reset the current material form
    setCurrentMaterial({
      title: '',
      documentUrl: '',
      videoUrl: '',
      roadmapContent: '',
      description: '',
      materialType: 'document'
    });
    
    // Open the modal
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteCourseMutation.mutate(id);
    }
  };

  // Handle adding a new lesson
  const handleAddLesson = () => {
    setFormData({
      ...formData,
      lessons: [...formData.lessons, { 
        title: '',
        videoUrl: '',
        // Include these fields with default values but don't show in UI
        duration: 0,
        description: ''
      }]
    });
  };

  // Handle removing a lesson
  const handleRemoveLesson = (index) => {
    const updatedLessons = [...formData.lessons];
    updatedLessons.splice(index, 1);
    setFormData({
      ...formData,
      lessons: updatedLessons.length ? updatedLessons : [{
        title: '',
        videoUrl: '',
        duration: 0,
        description: ''
      }] // Always keep at least one lesson
    });
  };

  // Handle lesson title change
  const handleLessonChange = (index, value) => {
    const updatedLessons = [...formData.lessons];
    updatedLessons[index] = value;
    setFormData({
      ...formData,
      lessons: updatedLessons
    });
  };

  // Modify handleAddMaterial to validate based on material type
  const handleAddMaterial = () => {
    // Validate required fields
    if (!currentMaterial.title) {
      toast.error('Material title is required');
      return;
    }

    // Create a new material object with the correct structure
    const newMaterial = {
      _id: Date.now().toString(), // Temporary ID for frontend management
      title: currentMaterial.title,
      type: currentMaterial.materialType,
      description: currentMaterial.description || '',
      // Initialize all URL fields
      documentUrl: '',
      videoUrl: '',
      roadmapContent: ''
    };

    // Set the appropriate URL field based on type
    switch (currentMaterial.materialType) {
      case 'document':
        if (!currentMaterial.documentUrl) {
          toast.error('Document URL is required');
          return;
        }
        newMaterial.documentUrl = currentMaterial.documentUrl;
        break;
      case 'video':
        if (!currentMaterial.videoUrl) {
          toast.error('Video URL is required');
          return;
        }
        newMaterial.videoUrl = currentMaterial.videoUrl;
        break;
      case 'roadmap':
        if (!currentMaterial.roadmapContent) {
          toast.error('Roadmap content is required');
          return;
        }
        newMaterial.roadmapContent = currentMaterial.roadmapContent;
        break;
      default:
        toast.error('Invalid material type');
        return;
    }

    // Add the new material to the formData
    setFormData(prevData => ({
      ...prevData,
      materials: [...(prevData.materials || []), newMaterial]
    }));

    // Reset the current material form
    setCurrentMaterial({
      title: '',
      documentUrl: '',
      videoUrl: '',
      roadmapContent: '',
      description: '',
      materialType: 'document'
    });

    toast.success('Material added successfully');
  };

  // Add this function to remove a material
  const handleRemoveMaterial = (materialId) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter(material => material._id !== materialId)
    });
  };

  // Add a function to fetch enrollment data for a course
  const fetchEnrollmentData = async (courseId) => {
    try {
      setIsLoadingEnrollments(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/courses/${courseId}/enrollments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Ensure we have a valid statistics object with all expected properties
      const statistics = response.data?.statistics || {
        totalEnrollments: 0,
        byStatus: {
          notStarted: 0,
          inProgress: 0, 
          completed: 0,
          wishlist: 0
        },
        averageProgress: 0
      };
      
      // Ensure enrollments is an array
      const enrollments = Array.isArray(response.data?.enrollments) 
        ? response.data.enrollments
        : [];
      
      setEnrollmentData({
        course: response.data?.course || { title: 'Course', enrollmentCount: 0 },
        statistics,
        enrollments
      });
      setIsEnrollmentModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch enrollment data:', error);
      toast.error('Failed to fetch enrollment data');
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Error Loading Courses</h2>
        <p className="text-gray-600 mb-4">There was a problem loading the course data.</p>
        <p className="text-sm text-gray-500 mb-4">{error?.message || 'Unknown error'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-800">Course Management</h1>
        <button
          onClick={() => {
            setSelectedCourse(null);
            setFormData({
              title: '',
              description: '',
              category: 'programming',
              level: 'beginner',
              duration: 0,
              thumbnail: '',
              requirements: [''],
              objectives: [''],
              learningOutcomes: ['Upon completion of this course, students will be able to understand the core concepts'],
              code: '',
              rating: 0,
              totalStudents: 0,
              lessons: [{
                title: '',
                videoUrl: '',
                duration: 0,
                description: ''
              }],
              materials: []
            });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Course
        </button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-md shadow-md overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enrolled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No courses found. Create your first course!
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-md object-cover"
                          src={course.thumbnail}
                          alt={course.title}
                          onError={(e) => {
                            e.target.src = '/assets/course-placeholder.jpg';
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {course.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {course.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {course.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {course.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.duration} hrs
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        {(enrollmentData?.statistics?.totalEnrollments) || 0}
                      </span>
                      <button
                        onClick={() => fetchEnrollmentData(course._id)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="View enrolled students"
                      >
                        <UsersIcon className="h-4 w-4 text-indigo-600" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(course)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                      <span className="ml-1">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5 inline" />
                      <span className="ml-1">Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Course Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCloseModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-md bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-indigo-600"></div>
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200"
                  >
                    <span className="text-indigo-700">
                      {selectedCourse ? 'Edit Course' : 'Add New Course'}
                    </span>
                  </Dialog.Title>

                  <div>
                    {/* Form for adding/editing course */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Main Course Information */}
                      <div className="p-5 rounded-md border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-md font-semibold text-indigo-700 mb-4 pb-2 border-b border-gray-200">Course Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                              Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="title"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              value={formData.title}
                              onChange={(e) => setFormData({...formData, title: e.target.value})}
                              required
                              placeholder="Enter course title"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                              Course Code <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="code"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              value={formData.code}
                              onChange={(e) => setFormData({...formData, code: e.target.value})}
                              required
                              placeholder="e.g., CS101"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                              Category <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="category"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value})}
                              required
                            >
                              <option value="">Select a category</option>
                              <option value="programming">Programming</option>
                              <option value="design">Design</option>
                              <option value="data science">Data Science</option>
                              <option value="business">Business</option>
                              <option value="marketing">Marketing</option>
                              <option value="cloud">Cloud Computing</option>
                              <option value="personal development">Personal Development</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                              Level <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="level"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                              value={formData.level}
                              onChange={(e) => setFormData({...formData, level: e.target.value})}
                              required
                            >
                              <option value="">Select a level</option>
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                              Duration (hours) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              id="duration"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              value={formData.duration}
                              onChange={(e) => setFormData({...formData, duration: e.target.value})}
                              required
                              min="0"
                              step="0.5"
                              placeholder="e.g., 10.5"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
                              Thumbnail URL <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="thumbnail"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              value={formData.thumbnail}
                              onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                              required
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                          
                          <div className="col-span-1 md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                              Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              id="description"
                              rows="3"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              value={formData.description}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              required
                              placeholder="Provide a detailed description of the course"
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      {/* Requirements & Objectives */}
                      <div className="p-5 rounded-md border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-md font-semibold text-indigo-700 mb-4 pb-2 border-b border-gray-200">Requirements & Objectives</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                              Requirements
                            </label>
                            <textarea
                              id="requirements"
                              rows="4"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter each requirement on a new line"
                              value={Array.isArray(formData.requirements) ? formData.requirements.join('\n') : formData.requirements}
                              onChange={(e) => setFormData({...formData, requirements: e.target.value.split('\n').filter(item => item.trim() !== '')})}
                            ></textarea>
                            <p className="mt-1 text-xs text-gray-500">Enter each requirement on a new line</p>
                          </div>
                          
                          <div>
                            <label htmlFor="objectives" className="block text-sm font-medium text-gray-700 mb-1">
                              Objectives
                            </label>
                            <textarea
                              id="objectives"
                              rows="4"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter each objective on a new line"
                              value={Array.isArray(formData.objectives) ? formData.objectives.join('\n') : formData.objectives}
                              onChange={(e) => setFormData({...formData, objectives: e.target.value.split('\n').filter(item => item.trim() !== '')})}
                            ></textarea>
                            <p className="mt-1 text-xs text-gray-500">Enter each objective on a new line</p>
                          </div>
                        </div>
                      </div>
                        
                      {/* Lessons */}
                      <div className="p-5 rounded-md border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                          <h3 className="text-md font-semibold text-indigo-700">Lessons</h3>
                          <button
                            type="button"
                            onClick={handleAddLesson}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Lesson
                          </button>
                        </div>
                        
                        {formData.lessons.map((lesson, index) => (
                          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm hover:shadow transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-indigo-700">Lesson {index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveLesson(index)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Title
                                </label>
                                <div className="flex">
                                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                                    Lesson {index + 1}:
                                  </span>
                                  <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-r-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={lesson.title}
                                    placeholder="Introduction to Java"
                                    onChange={(e) => {
                                      const title = e.target.value;
                                      handleLessonChange(index, { 
                                        ...lesson, 
                                        title: title,
                                        duration: lesson.duration || 0,
                                        description: lesson.description || ''
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Video URL
                                </label>
                                <input
                                  type="text"
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  value={lesson.videoUrl}
                                  placeholder="https://www.youtube.com/watch?v=example"
                                  onChange={(e) => handleLessonChange(index, { 
                                    ...lesson, 
                                    videoUrl: e.target.value,
                                    duration: lesson.duration || 0,
                                    description: lesson.description || ''
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {formData.lessons.length === 0 && (
                          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
                            <p>No lessons added yet. Click "Add Lesson" to get started.</p>
                            <p className="text-sm text-gray-400 mt-1">Lessons should include a title and video URL.</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Materials Section */}
                      <div className="p-5 rounded-md border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                          <h3 className="text-md font-semibold text-indigo-700">Course Materials</h3>
                        </div>
                        
                        {/* Materials List */}
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Course Materials</h4>
                          {formData.materials.map((material, index) => (
                            <div key={material._id || index} className="bg-white p-4 rounded-lg shadow mb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium">{material.title}</h5>
                                  <p className="text-sm text-gray-600">{material.description}</p>
                                  <p className="text-sm text-gray-500 mt-1">Type: {material.type}</p>
                                  {material.type === 'document' && material.documentUrl && (
                                    <a href={material.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                      View Document
                                    </a>
                                  )}
                                  {material.type === 'video' && material.videoUrl && (
                                    <a href={material.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                      Watch Video
                                    </a>
                                  )}
                                  {material.type === 'roadmap' && material.roadmapContent && (
                                    <div className="mt-2 text-sm">
                                      <p className="whitespace-pre-wrap">{material.roadmapContent}</p>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveMaterial(material._id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Materials Tabs */}
                        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                          <div className="flex border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => setCurrentMaterial({...currentMaterial, materialType: 'document'})}
                              className={`px-4 py-2 font-medium text-sm flex-1 ${
                                currentMaterial.materialType === 'document' 
                                  ? 'border-b-2 border-indigo-500 text-indigo-700 bg-gray-50' 
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                              Documents
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentMaterial({...currentMaterial, materialType: 'video'})}
                              className={`px-4 py-2 font-medium text-sm flex-1 ${
                                currentMaterial.materialType === 'video' 
                                  ? 'border-b-2 border-indigo-500 text-indigo-700 bg-gray-50' 
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <PlayIcon className="h-4 w-4 inline mr-1" />
                              Videos
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentMaterial({...currentMaterial, materialType: 'roadmap'})}
                              className={`px-4 py-2 font-medium text-sm flex-1 ${
                                currentMaterial.materialType === 'roadmap' 
                                  ? 'border-b-2 border-indigo-500 text-indigo-700 bg-gray-50' 
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <MapIcon className="h-4 w-4 inline mr-1" />
                              Roadmap
                            </button>
                          </div>
                          
                          <div className="p-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Material Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="e.g., Course Syllabus, JavaScript Cheat Sheet"
                                  value={currentMaterial.title}
                                  onChange={(e) => setCurrentMaterial({...currentMaterial, title: e.target.value})}
                                />
                              </div>
                              
                              {currentMaterial.materialType === 'document' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Document URL <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="URL to document (PDF, DOC, etc.)"
                                    value={currentMaterial.documentUrl}
                                    onChange={(e) => setCurrentMaterial({...currentMaterial, documentUrl: e.target.value})}
                                  />
                                </div>
                              )}
                              
                              {currentMaterial.materialType === 'video' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Video URL <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="URL to video (YouTube, Vimeo, etc.)"
                                    value={currentMaterial.videoUrl}
                                    onChange={(e) => setCurrentMaterial({...currentMaterial, videoUrl: e.target.value})}
                                  />
                                </div>
                              )}
                              
                              {currentMaterial.materialType === 'roadmap' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Roadmap Content <span className="text-red-500">*</span>
                                  </label>
                                  <textarea
                                    rows="4"
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter roadmap content or milestones"
                                    value={currentMaterial.roadmapContent}
                                    onChange={(e) => setCurrentMaterial({...currentMaterial, roadmapContent: e.target.value})}
                                  ></textarea>
                                </div>
                              )}
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description (Optional)
                                </label>
                                <textarea
                                  rows="2"
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="Brief description of the material"
                                  value={currentMaterial.description}
                                  onChange={(e) => setCurrentMaterial({...currentMaterial, description: e.target.value})}
                                ></textarea>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <button
                                type="button"
                                onClick={handleAddMaterial}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Add Material
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <span>{selectedCourse ? 'Update Course' : 'Create Course'}</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Enrollment Modal */}
      <Transition appear show={isEnrollmentModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEnrollmentModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-md bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-indigo-600"></div>
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200"
                  >
                    <span className="text-indigo-700">
                      {enrollmentData?.course?.title ? `Enrollments - ${enrollmentData.course.title}` : 'Course Enrollments'}
                    </span>
                  </Dialog.Title>

                  {isLoadingEnrollments ? (
                    <div className="p-8 flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <div>
                      {!enrollmentData || enrollmentData?.enrollments?.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <UsersIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p>No students enrolled in this course yet.</p>
                        </div>
                      ) : (
                        <div>
                          {/* Enrollment Statistics */}
                          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-indigo-50 p-4 rounded-md">
                              <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Total Enrollments</h4>
                              <p className="text-2xl font-bold text-indigo-700">{enrollmentData.statistics.totalEnrollments}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-md">
                              <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">In Progress</h4>
                              <p className="text-2xl font-bold text-blue-700">{enrollmentData.statistics.byStatus.inProgress}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-md">
                              <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Completed</h4>
                              <p className="text-2xl font-bold text-green-700">{enrollmentData.statistics.byStatus.completed}</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-md">
                              <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Average Progress</h4>
                              <p className="text-2xl font-bold text-yellow-700">{enrollmentData.statistics.averageProgress.toFixed(1)}%</p>
                            </div>
                          </div>

                          {/* Enrolled Students List */}
                          <div className="mb-4">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Enrolled Students</h4>
                            <div className="max-h-96 overflow-y-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled On</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Access</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {enrollmentData.enrollments.map((enrollment) => (
                                    <tr key={enrollment._id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className="flex-shrink-0 h-8 w-8">
                                            {enrollment.student?.avatar ? (
                                              <img
                                                className="h-8 w-8 rounded-full"
                                                src={enrollment.student.avatar}
                                                alt=""
                                              />
                                            ) : (
                                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-indigo-600">
                                                  {enrollment.student?.firstName?.charAt(0) || enrollment.student?.username?.charAt(0) || 'U'}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">
                                              {enrollment.student?.firstName} {enrollment.student?.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">{enrollment.student?.email}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                          ${enrollment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                          enrollment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                                          'bg-gray-100 text-gray-800'}`}>
                                          {enrollment.status === 'not-started' ? 'Not Started' : 
                                           enrollment.status === 'in-progress' ? 'In Progress' : 
                                           enrollment.status === 'completed' ? 'Completed' : enrollment.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                          <div 
                                            className={`h-2.5 rounded-full ${
                                              enrollment.progress >= 100 ? 'bg-green-600' : 
                                              enrollment.progress > 50 ? 'bg-blue-600' : 
                                              enrollment.progress > 0 ? 'bg-yellow-600' : 'bg-gray-300'
                                            }`} 
                                            style={{ width: `${enrollment.progress}%` }}>
                                          </div>
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1">{enrollment.progress}%</span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {enrollment.lastAccessDate ? new Date(enrollment.lastAccessDate).toLocaleDateString() : 'Never'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEnrollmentModalOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default CourseManagement; 