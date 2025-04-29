import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const initialActiveTab = 'test';
const initialAssignmentType = initialActiveTab === 'quiz' ? 'quiz' : 'assignment';

const AdminAssignments = () => {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    duration: 30, // in minutes
    passingScore: 70,
    maxAttempts: 3,
    questions: [{
      type: 'multiple-choice',
      question: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      points: 1,
      explanation: ''
    }],
    settings: {
      isRandomized: true,
      showResults: true,
      allowReview: true,
      timeLimit: true,
      requireProctoring: false
    },
    status: 'draft'
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Utility functions
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const isValidObjectId = (id) => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  };

  const getAssignmentTypeFromTab = (tab) => {
    switch (tab) {
      case 'quiz': return 'quiz';
      case 'test': return 'assignment';
      default: return 'assignment';
    }
  };

  const formatAssignmentType = (type) => {
    console.log('Formatting assignment type:', type);
    if (!type) return 'Test'; // Default to 'Test' instead of 'Unknown'
    
    switch (type) {
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Test';
      case 'project': return 'Project';
      case 'essay': return 'Essay';
      case 'presentation': return 'Presentation';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Render error state function
  const renderErrorState = (error, entityName) => (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mt-4">
      <div className="flex">
        <div className="py-1">
          <svg className="w-6 h-6 mr-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <div>
          <p className="font-bold">Error loading {entityName}</p>
          <p className="text-sm">{error.message || `Failed to load ${entityName}. Please try again later.`}</p>
        </div>
      </div>
    </div>
  );

  // Fetch certificate tests
  const { data: tests = [], isLoading: isLoadingTests, error: testsError } = useQuery({
    queryKey: ['admin-tests'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/tests`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Tests API response:', response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format from tests API');
        }
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch tests:', error);
        if (error.response?.status === 401) {
          toast.error('Authentication error. Please login again.');
        } else {
          toast.error('Failed to load tests: ' + (error.response?.data?.message || error.message));
        }
        throw error;
      }
    },
    enabled: activeTab === 'test',
    retry: 1,
  });

  // Fetch quizzes
  const { data: quizzes = [], isLoading: isLoadingQuizzes, error: quizzesError } = useQuery({
    queryKey: ['admin-quizzes'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/quizzes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Quizzes API response:', response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format from quizzes API');
        }
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch quizzes:', error);
        if (error.response?.status === 401) {
          toast.error('Authentication error. Please login again.');
        } else {
          toast.error('Failed to load quizzes: ' + (error.response?.data?.message || error.message));
        }
        throw error;
      }
    },
    enabled: activeTab === 'quiz',
    retry: 1,
  });

  // Fetch assignments
  const { data: assignments = [], isLoading: isLoadingAssignments, error: assignmentsError } = useQuery({
    queryKey: ['admin-assignments'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/assignments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Assignments API response:', response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format from assignments API');
        }
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        if (error.response?.status === 401) {
          toast.error('Authentication error. Please login again.');
        } else {
          toast.error('Failed to load assignments: ' + (error.response?.data?.message || error.message));
        }
        throw error;
      }
    },
    retry: 1,
  });

  // Fetch courses for dropdown
  const { data: courses = [], isLoading: isLoadingCourses, error: coursesError } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/courses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid courses data format:', response.data);
          throw new Error('Invalid response format from courses API');
        }
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        if (error.response?.status === 401) {
          toast.error('Authentication error. Please login again.');
        } else {
          toast.error('Failed to load courses: ' + (error.response?.data?.message || error.message));
        }
        throw error;
      }
    },
    retry: 1,
  });

  // Add new query for fetching test details
  const { data: testDetails = {}, isLoading: isLoadingTestDetails } = useQuery({
    queryKey: ['admin-test-details'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/tests/${selectedAssignment?._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Test details API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch test details:', error);
        toast.error('Failed to fetch test details');
        return {};
      }
    },
    enabled: !!selectedAssignment?._id,
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log('Creating assignment with data:', assignmentData);
      setIsSubmitting(true);
      toast.loading('Creating assignment...');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/assignments`,
        assignmentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.data) {
        throw new Error('No data returned from create assignment API');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully created assignment:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      setIsSubmitting(false);
      toast.dismiss();
      toast.success('Assignment created successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error creating assignment:', error);
      setIsSubmitting(false);
      toast.dismiss();
      
      let errorMessage = 'Failed to create assignment';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, assignmentData }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      setIsSubmitting(true);
      toast.loading('Updating assignment...');
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/assignments/${id}`,
        assignmentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.data) {
        throw new Error('No data returned from update assignment API');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully updated assignment:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      setIsSubmitting(false);
      toast.dismiss();
      toast.success('Assignment updated successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error updating assignment:', error);
      setIsSubmitting(false);
      toast.dismiss();
      
      let errorMessage = 'Failed to update assignment';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      toast.loading('Deleting assignment...');
      
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/assignments/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully deleted assignment:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      toast.dismiss();
      toast.success('Assignment deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting assignment:', error);
      toast.dismiss();
      
      let errorMessage = 'Failed to delete assignment';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log('Creating test with data:', testData);
      setIsSubmitting(true);
      toast.loading('Creating certificate test...');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/tests`,
        testData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.data) {
        throw new Error('No data returned from create test API');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully created test:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-tests'] });
      setIsSubmitting(false);
      toast.dismiss();
      toast.success('Certificate test created successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error creating test:', error);
      setIsSubmitting(false);
      toast.dismiss();
      
      let errorMessage = 'Failed to create certificate test';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (quizData) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Format the quiz data
      const formattedQuizData = {
        ...quizData,
        type: 'practice',
        questions: quizData.questions.map(q => ({
          type: q.type || 'multiple-choice',
          question: q.text || q.question, // Handle both text and question fields
          options: q.options.map(opt => ({
            text: opt.text || '',
            isCorrect: opt.isCorrect || false
          })),
          points: q.points || 1
        }))
      };

      console.log('Creating quiz with data:', formattedQuizData);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/quizzes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formattedQuizData)
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to create quiz');
        }

        return responseData;
      } catch (error) {
        console.error('Error in quiz creation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Quiz created successfully');
      setFormData({
        title: '',
        description: '',
        courseId: '',
        type: 'practice',
        passingScore: 70,
        duration: 30,
        questions: []
      });
      setIsModalOpen(false);
      queryClient.invalidateQueries(['quizzes']);
    },
    onError: (error) => {
      console.error('Quiz creation error:', error);
      toast.error(error.message || 'Failed to create quiz');
      setIsSubmitting(false);
    }
  });

  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async ({ id, testData }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      setIsSubmitting(true);
      toast.loading('Updating certificate test...');
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/tests/${id}`,
        testData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.data) {
        throw new Error('No data returned from update test API');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully updated test:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-tests'] });
      setIsSubmitting(false);
      toast.dismiss();
      toast.success('Certificate test updated successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error updating test:', error);
      setIsSubmitting(false);
      toast.dismiss(); 
      
      let errorMessage = 'Failed to update certificate test';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: async ({ id, quizData }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      setIsSubmitting(true);
      toast.loading('Updating practice quiz...');
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/quizzes/${id}`,
        quizData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.data) {
        throw new Error('No data returned from update quiz API');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully updated quiz:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      setIsSubmitting(false);
      toast.dismiss();
      toast.success('Practice quiz updated successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error updating quiz:', error);
      setIsSubmitting(false);
      toast.dismiss();
      
      let errorMessage = 'Failed to update practice quiz';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      toast.loading('Deleting certificate test...');
      
      try {
        console.log(`Sending delete request for test ID: ${id}`);
        const response = await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/admin/tests/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        return response.data;
      } catch (error) {
        console.error('Delete request failed with:', error.response?.status, error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Successfully deleted test:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-tests'] });
      toast.dismiss();
      toast.success('Certificate test deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting test:', error);
      toast.dismiss();
      
      let errorMessage = 'Failed to delete certificate test';
      
      // Check for the specific MongoDB/Mongoose error
      const isRemoveMethodError = error.response?.data?.error === 'test.remove is not a function';
      
      if (isRemoveMethodError) {
        // This is a known issue with the backend using deprecated MongoDB method
        errorMessage = 'Backend error: The server is using a deprecated delete method. Please notify the developers to update the code.';
        toast.error(errorMessage);
        
        // Log additional information for developers
        console.error('Developer Note: The backend is using test.remove() which is deprecated. Update to use deleteOne() or findOneAndDelete() instead.');
        
        return;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error: The test may be referenced by other data and cannot be deleted';
        
        // Ask if admin wants to force delete
        const forceDelete = window.confirm(
          'The server encountered an error deleting this test. It may be referenced by other data. Would you like to try a force delete? (This may cause data inconsistency)'
        );
        
        if (forceDelete) {
          // Try to delete with force parameter
          const testId = error.config?.url?.split('/').pop();
          if (testId) {
            toast.loading('Attempting force delete...');
            
            // Add a force parameter to the delete request
            axios.delete(
              `${import.meta.env.VITE_API_URL}/api/admin/tests/${testId}?force=true`,
              {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              }
            )
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ['admin-tests'] });
              toast.dismiss();
              toast.success('Certificate test force deleted successfully');
            })
            .catch((forceError) => {
              toast.dismiss();
              toast.error('Force delete failed: ' + (forceError.response?.data?.message || forceError.message));
            });
            
            return; // Exit early since we're handling the error
          }
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      toast.loading('Deleting practice quiz...');
      
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/quizzes/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully deleted quiz:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast.dismiss();
      toast.success('Practice quiz deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting quiz:', error);
      toast.dismiss();
      
      let errorMessage = 'Failed to delete practice quiz';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
    setFormData({
      title: '',
      description: '',
      courseId: '',
      type: 'practice',
      passingScore: 70,
      duration: 30,
      isCertificateTest: false,
      totalPoints: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      questions: [{
        question: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        type: 'multiple-choice',
        points: 1
      }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.courseId) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate questions
    if (!formData.questions || formData.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }
    
    // Validate each question
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      
      if (!question.question) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      
      if (question.type === 'multiple-choice') {
        if (!question.options || question.options.length === 0) {
          toast.error(`Question ${i + 1} must have options`);
          return;
        }
        
        const hasCorrectOption = question.options.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
          toast.error(`Question ${i + 1} must have at least one correct option`);
          return;
        }
        
        const hasEmptyOption = question.options.some(opt => !opt.text);
        if (hasEmptyOption) {
          toast.error(`Question ${i + 1} has an empty option`);
          return;
        }
      }
    }
    
    try {
      // Format the data according to the backend schema
      const formattedData = {
        ...formData,
        questions: formData.questions.map(q => ({
          type: q.type,
          question: q.question, // Keep the question field for UI compatibility
          text: q.question,     // Add the text field for backend validation
          options: q.options.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect
          })),
          points: q.points || 1,
          explanation: q.explanation || ''
        })),
        settings: {
          isRandomized: formData.settings?.isRandomized ?? true,
          showResults: formData.settings?.showResults ?? true,
          allowReview: formData.settings?.allowReview ?? true,
          timeLimit: formData.settings?.timeLimit ?? true,
          requireProctoring: formData.settings?.requireProctoring ?? false
        },
        status: formData.status || 'draft'
      };
      
      // Log the full formatted data for debugging
      console.log('Formatted test data:', JSON.stringify(formattedData, null, 2));

      // Check if we are editing an existing assignment
      if (selectedAssignment && selectedAssignment._id) {
        const id = selectedAssignment._id;
        console.log(`Updating ${activeTab} with ID: ${id}`);

        if (activeTab === 'quiz') {
          await updateQuizMutation.mutateAsync({ id, quizData: formattedData });
        } else if (activeTab === 'test') {
          await updateTestMutation.mutateAsync({ id, testData: formattedData });
        } else {
          toast.error('Update logic for this tab is not implemented yet.'); 
          return;
        }
      } else {
        // Creating a new assignment
        console.log('Creating test with data:', formattedData);
        if (activeTab === 'quiz') {
          await createQuizMutation.mutateAsync(formattedData);
        } else if (activeTab === 'test') {
          await createTestMutation.mutateAsync(formattedData);
        } else {
          toast.error('Create logic for this tab is not implemented yet.');
          return;
        }
      }
    } catch (error) {
      console.error('Error during form submission trigger:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'An unexpected error occurred');
      }
    }
  };

  const handleEdit = (assignment) => {
    try {
      console.log('Editing assignment:', assignment);
      
      if (!assignment || !assignment._id) {
        console.error('Invalid assignment data for editing:', assignment);
        toast.error('Cannot edit: Invalid assignment data');
        return;
      }
      
      setSelectedAssignment(assignment);
      // Format the date for the date input (YYYY-MM-DD)
      const formattedDueDate = assignment.dueDate 
        ? new Date(assignment.dueDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      // Safely handle courseId which might be an object or a string
      // Make sure it defaults to an empty string instead of null
      const courseIdValue = assignment.courseId 
        ? (typeof assignment.courseId === 'object' 
            ? (assignment.courseId._id || '') 
            : assignment.courseId)
        : '';
        
      // Ensure questions array exists and is properly formatted
      const sanitizedQuestions = Array.isArray(assignment.questions) 
        ? assignment.questions.map(q => ({
            type: q.type || 'multiple-choice',
            question: q.question || q.text || '',
            options: Array.isArray(q.options) 
              ? q.options.map(opt => ({
                  text: opt.text || '',
                  isCorrect: !!opt.isCorrect
                })) 
              : [
                  { text: '', isCorrect: false },
                  { text: '', isCorrect: false },
                  { text: '', isCorrect: false },
                  { text: '', isCorrect: false }
                ],
            points: q.points || 1,
            explanation: q.explanation || ''
          }))
        : [{
            type: 'multiple-choice',
            question: '',
            options: [
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false }
            ],
            points: 1,
            explanation: ''
          }];
      
      console.log('Setting form data with questions:', sanitizedQuestions);
          
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        courseId: courseIdValue,
        type: assignment.type || getAssignmentTypeFromTab(activeTab),
        passingScore: assignment.passingScore || 70,
        duration: assignment.duration || 30,
        isCertificateTest: !!assignment.isCertificateTest,
        totalPoints: assignment.totalPoints || 100,
        dueDate: formattedDueDate,
        questions: sanitizedQuestions,
        status: assignment.status || 'draft'
      });
      
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      toast.error('Something went wrong while preparing edit form');
    }
  };

  const handleDelete = (id) => {
    try {
      console.log('Deleting assignment with id:', id);
      
      if (!id) {
        console.error('No ID provided for deletion');
        toast.error('Cannot delete: Missing ID');
        return;
      }
      
      // Find the assignment to check for potential issues
      let assignment;
      if (activeTab === 'test') {
        assignment = tests.find(test => test._id === id);
      } else if (activeTab === 'quiz') {
        assignment = quizzes.find(quiz => quiz._id === id);
      }
      
      if (assignment) {
        console.log('Assignment to delete:', assignment);
        
        // Check if it has any dependencies that might cause deletion issues
        const hasAttempts = assignment.attempts && assignment.attempts.length > 0;
        const hasCertificates = assignment.certificates && assignment.certificates.length > 0;
        
        if (hasCertificates) {
          const proceed = window.confirm(
            'Warning: This test has certificates issued to students. Deleting it may affect student records. Are you sure you want to proceed?'
          );
          if (!proceed) return;
        } else if (hasAttempts) {
          const proceed = window.confirm(
            'Warning: Students have already attempted this test. Deleting it may affect student records. Are you sure you want to proceed?'
          );
          if (!proceed) return;
        }
      }
      
      const message = activeTab === 'test' 
        ? 'Are you sure you want to delete this certificate test?' 
        : 'Are you sure you want to delete this practice quiz?';
      
      if (window.confirm(message)) {
        if (activeTab === 'test') {
          deleteTestMutation.mutate(id);
        } else if (activeTab === 'quiz') {
          deleteQuizMutation.mutate(id);
        } else {
          toast.error(`Delete not supported for ${activeTab} tab`);
        }
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('Something went wrong while trying to delete');
    }
  };

  const handleOpenModal = () => {
    if (!courses || courses.length === 0) {
      toast.error('You need to create courses first before creating assignments');
      return;
    }
    
    setSelectedAssignment(null);
    setFormData({
      ...formData,
      type: getAssignmentTypeFromTab(activeTab),
      courseId: '',
      totalPoints: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          type: 'multiple-choice',
          points: 1
        }
      ]
    });
  };

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(index, 1);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    
    if (field === 'text') {
      // Map 'text' field to 'question' for consistency
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        question: value
      };
    } else {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value
      };
    }
    
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    if (questionIndex < 0 || questionIndex >= (formData.questions?.length || 0)) {
      console.error(`Invalid question index: ${questionIndex}`);
      return;
    }
    
    const updatedQuestions = [...formData.questions];
    
    // Make sure options array exists
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    
    // Make sure the option at optionIndex exists
    if (optionIndex < 0 || optionIndex >= updatedQuestions[questionIndex].options.length) {
      console.error(`Invalid option index: ${optionIndex}`);
      return;
    }
    
    // For radio buttons where only one option can be correct
    if (field === 'isCorrect' && value === true) {
      // Reset all options to false first
      updatedQuestions[questionIndex].options.forEach(opt => opt.isCorrect = false);
    }
    
    updatedQuestions[questionIndex].options[optionIndex][field] = value;
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleStartTest = (id) => {
    navigate(`/student/tests/${id}`);
  };

  const currentItems = activeTab === 'test' ? tests : quizzes;

  // Update the loading check
  if ((activeTab === 'test' && isLoadingTests) || (activeTab === 'quiz' && isLoadingQuizzes)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Update the error handling
  if ((activeTab === 'test' && testsError) || (activeTab === 'quiz' && quizzesError)) {
    return renderErrorState(activeTab === 'test' ? testsError : quizzesError, activeTab === 'test' ? 'tests' : 'quizzes');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assignments Management</h1>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create {activeTab === 'test' ? 'Test' : 'Quiz'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 flex items-center transition-all duration-300 ${
            activeTab === 'test'
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <DocumentTextIcon className="w-5 h-5 mr-2" />
          Tests
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-2 flex items-center transition-all duration-300 ${
            activeTab === 'quiz'
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" />
          Quizzes
        </button>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Questions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Certificate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {coursesError 
                    ? 'Error loading courses. Cannot create assignments without courses.' 
                    : `No ${activeTab === 'test' ? 'tests' : 'quizzes'} found. Create your first one!`}
                </td>
              </tr>
            ) : (
              currentItems.map((assignment) => (
                <tr key={assignment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignment.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof assignment.courseId === 'object' && assignment.courseId?.title 
                      ? assignment.courseId.title 
                      : 'Unknown Course'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatAssignmentType(assignment.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(assignment.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assignment.questions?.length || 0} questions
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignment.totalPoints || 0} points total
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {assignment.duration || 0} minutes
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assignment.isCertificateTest ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                        aria-label="Delete"
                        type="button"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                        aria-label="Edit"
                        type="button"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedAssignment ? `Edit ${activeTab === 'test' ? 'Test' : 'Quiz'}` : `Create ${activeTab === 'test' ? 'Test' : 'Quiz'}`}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Course
                  </label>
                  {isLoadingCourses ? (
                    <div className="mt-1 py-2 text-gray-500">Loading courses...</div>
                  ) : coursesError ? (
                    <div className="mt-1 py-2 text-red-500">
                      Error loading courses: {coursesError.message}
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="mt-1 py-2 text-red-500">
                      No courses available. Please create a course first.
                    </div>
                  ) : (
                    <select
                      value={formData.courseId || ''}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                      Passing Score (%)
                  </label>
                    <input
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalPoints}
                    onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-2 mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="certificate-test"
                    checked={formData.isCertificateTest}
                    onChange={(e) => setFormData({ ...formData, isCertificateTest: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="certificate-test" className="ml-2 block text-sm text-gray-900">
                    This is a certificate test
                  </label>
                </div>
                {formData.isCertificateTest && (
                  <p className="text-xs text-gray-500 mt-1">
                    Students who pass this test will automatically receive a certificate.
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Questions</h3>
                
                {formData.questions.map((question, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium">Question {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                        disabled={formData.questions.length === 1}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-2">
                      <div>
                <label className="block text-sm font-medium text-gray-700">
                          Question Text
                </label>
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Question Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True/False</option>
                          </select>
                        </div>
                        <div>
                <label className="block text-sm font-medium text-gray-700">
                            Points
                </label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => handleQuestionChange(index, 'points', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    {question.type === 'true-false' ? (
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`question-${index}-true`}
                            name={`question-${index}-correct`}
                            checked={question.options[0]?.isCorrect}
                            onChange={() => {
                              const updatedOptions = [
                                { text: 'True', isCorrect: true },
                                { text: 'False', isCorrect: false }
                              ];
                              handleQuestionChange(index, 'options', updatedOptions);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor={`question-${index}-true`} className="ml-2 block text-sm text-gray-900">
                            True is correct
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`question-${index}-false`}
                            name={`question-${index}-correct`}
                            checked={question.options[1]?.isCorrect}
                            onChange={() => {
                              const updatedOptions = [
                                { text: 'True', isCorrect: false },
                                { text: 'False', isCorrect: true }
                              ];
                              handleQuestionChange(index, 'options', updatedOptions);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor={`question-${index}-false`} className="ml-2 block text-sm text-gray-900">
                            False is correct
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Options (select the correct answer)
                        </label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`question-${index}-option-${optionIndex}`}
                              name={`question-${index}-correct`}
                              checked={option.isCorrect}
                              onChange={() => handleOptionChange(index, optionIndex, 'isCorrect', true)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => handleOptionChange(index, optionIndex, 'text', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder={`Option ${optionIndex + 1}`}
                  required
                />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Add Question
                </button>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  )}
                  {selectedAssignment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments; 