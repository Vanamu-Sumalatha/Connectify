import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentCheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TestManagement = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    totalMarks: '',
    passingMarks: '',
    questions: [],
  });

  const queryClient = useQueryClient();

  // Fetch tests
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/tests`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        toast.error('Failed to fetch tests');
        return [];
      }
    },
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/tests`,
        testData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        duration: '',
        totalMarks: '',
        passingMarks: '',
        questions: [],
      });
      toast.success('Test created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create test');
    },
  });

  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async ({ testId, testData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/tests/${testId}`,
        testData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      setShowModal(false);
      setSelectedTest(null);
      setFormData({
        title: '',
        description: '',
        duration: '',
        totalMarks: '',
        passingMarks: '',
        questions: [],
      });
      toast.success('Test updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update test');
    },
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (testId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/tests/${testId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Test deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete test');
    },
  });

  const handleCreateTest = () => {
    setSelectedTest(null);
    setFormData({
      title: '',
      description: '',
      duration: '',
      totalMarks: '',
      passingMarks: '',
      questions: [],
    });
    setShowModal(true);
  };

  const handleEditTest = (test) => {
    setSelectedTest(test);
    setFormData({
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      questions: test.questions,
    });
    setShowModal(true);
  };

  const handleDeleteTest = (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      deleteTestMutation.mutate(testId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTest) {
      updateTestMutation.mutate({
        testId: selectedTest._id,
        testData: formData,
      });
    } else {
      createTestMutation.mutate(formData);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTest(null);
    setFormData({
      title: '',
      description: '',
      duration: '',
      totalMarks: '',
      passingMarks: '',
      questions: [],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">Test Management</h1>
        </div>
        <button
          onClick={handleCreateTest}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests?.map((test) => (
          <div
            key={test._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{test.title}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditTest(test)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteTest(test._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{test.description}</p>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-2" />
                <span>Duration: {test.duration} minutes</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DocumentCheckIcon className="h-4 w-4 mr-2" />
                <span>Total Marks: {test.totalMarks}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <XMarkIcon className="h-4 w-4 mr-2" />
                <span>Passing Marks: {test.passingMarks}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                <span>Questions: {test.questions?.length || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Test Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {selectedTest ? 'Edit Test' : 'Create Test'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, totalMarks: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    value={formData.passingMarks}
                    onChange={(e) =>
                      setFormData({ ...formData, passingMarks: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedTest ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement; 