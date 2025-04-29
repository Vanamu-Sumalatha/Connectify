import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ChatRooms = () => {
  console.log('ChatRooms component rendering');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomType, setRoomType] = useState('discussions');
  const [formData, setFormData] = useState({
    name: '',
    type: 'support',
    description: '',
    isActive: true
  });

  const queryClient = useQueryClient();

  // Log room type changes
  const handleRoomTypeChange = (type) => {
    console.log('Changing tab from', roomType, 'to', type);
    setRoomType(type);
    
    // Refresh the data when tab changes
    queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms', type] });
  };

  // Fetch chat rooms
  const { data: chatRooms = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-chat-rooms', roomType],
    queryFn: async () => {
      console.log('Fetching chat rooms with tab:', roomType);
      console.log('API URL:', `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms?type=${roomType}`);
      
      try {
        const token = localStorage.getItem('token');
        console.log('Token available:', !!token);
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms?type=${roomType}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );
        
        console.log('API Response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        });
        
        return response.data;
      } catch (error) {
        console.error('API Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        toast.error('Failed to fetch chat rooms');
        return [];
      }
    },
    onSuccess: (data) => {
      console.log('Query Success - Chat Rooms:', data);
    },
    onError: (error) => {
      console.error('Query Error:', error);
    }
  });

  // Create chat room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData) => {
      console.log('Creating chat room with data:', roomData);
      const token = localStorage.getItem('token');
      
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms`,
          roomData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('Create Room Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Create Room Error:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Room created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms', roomType] });
      toast.success('Chat room created successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Create Room Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error creating chat room');
    }
  });

  // Update chat room mutation
  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, roomData }) => {
      console.log('Updating chat room:', id, 'with data:', roomData);
      const token = localStorage.getItem('token');
      
      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms/${id}`,
          roomData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('Update Room Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Update Room Error:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Room updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms', roomType] });
      toast.success('Chat room updated successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Update Room Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error updating chat room');
    }
  });

  // Delete chat room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: async (id) => {
      console.log('Deleting chat room:', id);
      const token = localStorage.getItem('token');
      
      try {
        const response = await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Delete Room Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Delete Room Error:', error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Room deleted successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms', roomType] });
      toast.success('Chat room deleted successfully');
    },
    onError: (error) => {
      console.error('Delete Room Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error deleting chat room');
    }
  });

  // Add useEffect for component mount/unmount
  useEffect(() => {
    console.log('ChatRooms component mounted');
    return () => {
      console.log('ChatRooms component unmounted');
    };
  }, []);

  // Add useEffect for roomType changes
  useEffect(() => {
    console.log('Room type changed to:', roomType);
  }, [roomType]);

  // Add useEffect for chatRooms data changes
  useEffect(() => {
    console.log('Chat rooms data updated:', chatRooms);
  }, [chatRooms]);

  // Direct API call for debugging
  const testApiCall = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('TEST API CALL: Making direct request with token available:', !!token);
      
      // First, create a test room
      const createResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms`,
        {
          name: "Test Room " + Date.now(),
          type: "support",
          description: "Test room created for debugging"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('TEST API CALL: Create response:', createResponse.data);
      toast.success('Test room created');
      
      // Then immediately fetch rooms
      const fetchResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms?type=discussions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('TEST API CALL: Fetch response status:', fetchResponse.status);
      console.log('TEST API CALL: Fetch data:', fetchResponse.data);
      console.log('TEST API CALL: Number of rooms:', fetchResponse.data.length);
      
      if (fetchResponse.data.length > 0) {
        console.log('TEST API CALL: First room type:', fetchResponse.data[0].type);
      }
      
      // Now refetch through React Query
      refetch();
      
    } catch (error) {
      console.error('TEST API CALL FAILED:', error);
      toast.error('Test API call failed');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setFormData({
      name: '',
      type: 'support',
      description: '',
      isActive: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRoom) {
      updateRoomMutation.mutate({
        id: selectedRoom._id,
        roomData: formData,
      });
    } else {
      createRoomMutation.mutate(formData);
    }
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      description: room.description || '',
      isActive: room.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this chat room?')) {
      deleteRoomMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate room statistics
  const totalRooms = chatRooms.length;
  const courseRooms = chatRooms.filter(room => room.type === 'course').length;
  const studyGroupRooms = chatRooms.filter(room => room.type === 'study-group').length;
  const discussionRooms = chatRooms.filter(room => room.type === 'support').length;
  const totalMembers = chatRooms.reduce((sum, room) => sum + (room.memberCount || 0), 0);
  const totalMessages = chatRooms.reduce((sum, room) => sum + (room.messageCount || 0), 0);

  // Debug log
  console.log('Room types in data:', chatRooms.map(room => room.type));
  console.log('Room display statistics:', { totalRooms, courseRooms, studyGroupRooms, discussionRooms });

  // Display helper function to convert backend type to display type
  const getDisplayType = (type) => {
    if (type === 'support') return 'Discussion';
    if (type === 'course') return 'Course';
    return 'Study Group';
  };

  // CSS helper for type labels
  const getTypeStyles = (type) => {
    if (type === 'support') return 'bg-yellow-100 text-yellow-800';
    if (type === 'course') return 'bg-green-100 text-green-800';
    return 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chat Rooms Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              console.log('Manual refetch triggered for tab:', roomType);
              refetch();
            }}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center mr-2"
          >
            <ClockIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Chat Room
          </button>
          <button
            onClick={testApiCall}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            Test API
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => handleRoomTypeChange('all')}
            className={`px-4 py-2 rounded-md ${
              roomType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            All Rooms
          </button>
          <button
            onClick={() => handleRoomTypeChange('discussions')}
            className={`px-4 py-2 rounded-md ${
              roomType === 'discussions' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            Discussions
          </button>
          <button
            onClick={() => handleRoomTypeChange('course')}
            className={`px-4 py-2 rounded-md ${
              roomType === 'course' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            Course Rooms
          </button>
          <button
            onClick={() => handleRoomTypeChange('study-group')}
            className={`px-4 py-2 rounded-md ${
              roomType === 'study-group' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            Study Group Rooms
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Total Rooms</h3>
            <p className="text-2xl font-bold text-blue-900">{totalRooms}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Course Rooms</h3>
            <p className="text-2xl font-bold text-green-900">{courseRooms}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Study Group Rooms</h3>
            <p className="text-2xl font-bold text-purple-900">{studyGroupRooms}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800">Discussion Rooms</h3>
            <p className="text-2xl font-bold text-yellow-900">{discussionRooms}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chatRooms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No chat rooms found. Create your first chat room!
                  </td>
                </tr>
              ) : (
                chatRooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <ChatBubbleLeftIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {room.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {room.description || (
                              room.type === 'course' ? 
                                `Room for course: ${room.courseId?.title || 'Unknown Course'}` : 
                                room.type === 'study-group' ? 
                                  `Room for study group: ${room.studyGroupId?.name || 'Unknown Group'}` : 
                                  'General discussion room'
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${getTypeStyles(room.type)}`}>
                        {getDisplayType(room.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-1 text-gray-500" />
                        {room.memberCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room.messageCount || 0} messages
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(room.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* Only allow editing/deleting discussion rooms (not linked to courses/groups) */}
                      {room.type === 'support' ? (
                        <>
                          <button
                            onClick={() => handleEdit(room)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            <PencilIcon className="h-5 w-5 inline" />
                            <span className="ml-1">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(room._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5 inline" />
                            <span className="ml-1">Delete</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">Managed automatically</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Chat Rooms Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium mb-2">Activity Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Members</span>
                <span className="font-medium">{totalMembers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Messages</span>
                <span className="font-medium">{totalMessages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Messages per Room</span>
                <span className="font-medium">
                  {totalRooms > 0 ? Math.round(totalMessages / totalRooms) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Members per Room</span>
                <span className="font-medium">
                  {totalRooms > 0 ? Math.round(totalMembers / totalRooms) : 0}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-md font-medium mb-2">Room Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Course Rooms</span>
                <span className="font-medium">{courseRooms} ({totalRooms > 0 ? Math.round((courseRooms / totalRooms) * 100) : 0}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Study Group Rooms</span>
                <span className="font-medium">{studyGroupRooms} ({totalRooms > 0 ? Math.round((studyGroupRooms / totalRooms) * 100) : 0}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Discussion Rooms</span>
                <span className="font-medium">{discussionRooms} ({totalRooms > 0 ? Math.round((discussionRooms / totalRooms) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedRoom ? 'Edit Chat Room' : 'Add New Chat Room'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {!selectedRoom && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="support">Discussion</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Course and Study Group rooms are created automatically.
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
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
                  {selectedRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRooms; 