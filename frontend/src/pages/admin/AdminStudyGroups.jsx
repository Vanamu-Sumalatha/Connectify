import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const AdminStudyGroups = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    courseId: '',
    leader: '',
    leaderId: '',
    nextMeeting: '',
    status: 'active',
  });

  const queryClient = useQueryClient();

  // Fetch study groups
  const { data: studyGroups = [], isLoading } = useQuery({
    queryKey: ['admin-study-groups'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/study-groups`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Study groups API response:', response.data);
        
        // Check if response contains a message indicating no data
        if (response.data && response.data.message === 'No study groups found in database') {
          return [];
        }
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch study groups:', error);
        toast.error('Failed to fetch study groups');
        return [];
      }
    },
  });

  // Fetch courses for dropdown
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      try {
        console.log('Fetching courses for study group form');
        const token = localStorage.getItem('token');
        console.log('API URL:', `${import.meta.env.VITE_API_URL}/api/admin/courses`);
        console.log('Using token:', token ? 'Valid token exists' : 'No token found');
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/courses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Courses API full response:', response);
        console.log('Courses API response data:', response.data);
        
        // Check if response contains a message indicating no data
        if (response.data && response.data.message === 'No courses found in database') {
          console.log('No courses found in database message received');
          toast.warning('No courses found in database');
          return [];
        }
        
        if (Array.isArray(response.data)) {
          console.log(`Found ${response.data.length} courses (array format)`);
          return response.data;
        } else if (response.data && response.data.courses && Array.isArray(response.data.courses)) {
          console.log(`Found ${response.data.courses.length} courses (nested format)`);
          return response.data.courses;
        } else {
          console.log('Unexpected data format for courses:', response.data);
          toast.warning('Unexpected response format for courses');
          return [];
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        console.error('Error details:', error.response || error.message || error);
        toast.error(`Failed to fetch courses: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        return [];
      }
    },
  });

  // Create study group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData) => {
      const token = localStorage.getItem('token');
      console.log('Creating study group with data:', groupData);
      toast.loading('Creating study group...');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/study-groups`,
        groupData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully created study group:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-study-groups'] });
      toast.dismiss();
      toast.success('Study group created successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error creating study group:', error.response?.data);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Error creating study group');
    },
  });

  // Update study group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, groupData }) => {
      const token = localStorage.getItem('token');
      toast.loading('Updating study group...');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/study-groups/${id}`,
        groupData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully updated study group:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-study-groups'] });
      toast.dismiss();
      toast.success('Study group updated successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error updating study group:', error.response?.data);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Error updating study group');
    },
  });

  // Delete study group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      toast.loading('Deleting study group...');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/study-groups/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully deleted study group:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-study-groups'] });
      toast.dismiss();
      toast.success('Study group deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting study group:', error.response?.data);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Error deleting study group');
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
    setFormData({
      name: '',
      course: '',
      courseId: '',
      leader: '',
      leaderId: '',
      nextMeeting: '',
      status: 'active',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedGroup) {
      updateGroupMutation.mutate({
        id: selectedGroup._id || selectedGroup.id,
        groupData: formData,
      });
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      course: group.course,
      courseId: group.courseId?._id || group.courseId,
      leader: group.leader,
      leaderId: group.leaderId?._id || group.leaderId,
      nextMeeting: group.nextMeeting ? new Date(group.nextMeeting).toISOString().slice(0, 16) : '',
      status: group.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this study group?')) {
      deleteGroupMutation.mutate(id);
    }
  };

  const handleOpenModal = () => {
    if (!courses || courses.length === 0) {
      toast.error('You need to create courses first before creating study groups');
      return;
    }
    
    setSelectedGroup(null);
    setFormData({
      name: '',
      course: '',
      courseId: '',
      leader: '',
      leaderId: '',
      nextMeeting: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Study Groups Management</h1>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Study Group
        </button>
      </div>

      {/* Study Groups Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Study Group
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leader
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Meeting
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {studyGroups.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No study groups found. Create your first study group!
                </td>
              </tr>
            ) : (
              studyGroups.map((group) => (
                <tr key={group._id || group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {group.name}
              </div>
                    <div className="text-sm text-gray-500">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {group.courseId?.title || group.course}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {group.leaderId?.username || group.leader}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                      <UserGroupIcon className="w-4 h-4 mr-1 text-gray-500" />
                      {group.memberCount} members
                </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(group.nextMeeting)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleEdit(group)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                >
                      <PencilIcon className="h-5 w-5 inline" />
                      <span className="ml-1">Edit</span>
                </button>
                <button
                      onClick={() => handleDelete(group._id || group.id)}
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

      {/* Study Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedGroup ? 'Edit Study Group' : 'Add New Study Group'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
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
                  ) : courses.length === 0 ? (
                    <div className="mt-1 py-2 text-red-500">
                      No courses available. Please create a course first.
                    </div>
                  ) : (
                    <select
                      value={formData.courseId}
                      onChange={(e) => {
                        const selectedCourse = courses.find(c => c._id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          courseId: e.target.value,
                          course: selectedCourse ? selectedCourse.title : ''
                        });
                      }}
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
                    Group Leader
                  </label>
                  <input
                    type="text"
                    value={formData.leader}
                    onChange={(e) =>
                      setFormData({ ...formData, leader: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    placeholder="Leader's name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Leader ID
                  </label>
                  <input
                    type="text"
                    value={formData.leaderId}
                    onChange={(e) =>
                      setFormData({ ...formData, leaderId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    placeholder="Leader's user ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Next Meeting (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.nextMeeting}
                    onChange={(e) =>
                      setFormData({ ...formData, nextMeeting: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">
                    Status
                </label>
                  <select
                    value={formData.status}
                  onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedGroup ? 'Update Study Group' : 'Create Study Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudyGroups; 