import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash2, FiMessageSquare, FiUsers } from 'react-icons/fi';

const AdminChatRooms = () => {
  const [activeTab, setActiveTab] = useState('discussions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'support',
    description: '',
    isActive: true
  });

  const { data: chatRoomsData, isLoading, refetch } = useQuery({
    queryKey: ['adminChatRooms', activeTab],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      
      // IMPORTANT: Fix the API endpoint path to use the specialized route
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/chat-rooms`;
      
      // Fix for backend type mismatch
      let queryType = activeTab;
      
      console.log('Fetching chat rooms with tab:', activeTab);
      console.log('Full URL with params:', `${apiUrl}?type=${queryType}`);
      
      try {
        const response = await axios.get(apiUrl, {
          params: { type: queryType },
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Chat rooms API response status:', response.status);
        console.log('Chat rooms API response:', response.data);
        
        // Process the data to ensure studentCount is available
        const processedData = Array.isArray(response.data) 
          ? response.data.map(room => ({
              ...room,
              // Ensure studentCount is calculated even if backend doesn't provide it
              studentCount: room.studentCount || 
                (room.participants ? 
                  room.participants.filter(p => p.userType === 'StudentUser').length : 0)
            }))
          : response.data;
        
        console.log('Processed chat rooms data:', processedData);
        
        // If we get an empty array and we're looking for discussions, try with 'support' type
        if (Array.isArray(processedData) && processedData.length === 0 && activeTab === 'discussions') {
          console.log('No discussion rooms found, trying with support type');
          
          // Try again with support type
          const alternateResponse = await axios.get(apiUrl, {
            params: { type: 'support' },
            headers: { Authorization: `Bearer ${token}` },
          });
          
          console.log('Alternate API response status:', alternateResponse.status);
          console.log('Alternate API response:', alternateResponse.data);
          
          // Process alternate data
          const processedAltData = Array.isArray(alternateResponse.data)
            ? alternateResponse.data.map(room => ({
                ...room,
                studentCount: room.studentCount || 
                  (room.participants ? 
                    room.participants.filter(p => p.userType === 'StudentUser').length : 0)
              }))
            : alternateResponse.data;
          
          console.log('Processed alternate data:', processedAltData);
          
          return processedAltData;
        }
        
        return processedData;
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        console.error('Error details:', {
          message: error.message, 
          status: error.response?.status,
          data: error.response?.data
        });
        return { message: 'Failed to fetch chat rooms' };
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Ensure chatRooms is always an array
  const chatRooms = Array.isArray(chatRoomsData) ? chatRoomsData : [];

  const handleTabChange = (tab) => {
    console.log('Changing tab from', activeTab, 'to', tab);
    setActiveTab(tab);
    // Force a refetch when tab changes
    setTimeout(() => {
      refetch();
    }, 100);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      // For discussions tab, ensure we're using a valid type value
      let roomData = {...formData};
      // Always use 'support' type for discussion rooms
      if (activeTab === 'discussions') {
        roomData.type = 'support'; // Use 'support' type for discussion rooms
      }
      
      console.log('Creating chat room with data:', roomData);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms`,
        roomData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log('Create room response:', response.data);
      setIsModalOpen(false);
      setFormData({
        name: '',
        type: 'support', // Reset to valid enum value
        description: '',
        isActive: true
      });
      
      // Ensure we're refetching with the current active tab
      console.log("Room created, refetching with tab:", activeTab);
      
      // Short delay to allow backend to process the creation
      setTimeout(async () => {
        await refetch();
      }, 500);
      
      // Alert success
      alert('Chat room created successfully!');
    } catch (error) {
      console.error('Error creating chat room:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      alert(error.response?.data?.message || 'Failed to create chat room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this chat room?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms/${roomId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      refetch();
    } catch (error) {
      console.error('Error deleting chat room:', error);
      alert(error.response?.data?.message || 'Failed to delete chat room');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chat Rooms Management</h1>
        
        {activeTab === 'discussions' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FiPlus className="mr-2" /> Create Chat Room
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        {['discussions', 'course'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'course' ? 'Course Rooms' : 'Discussion Rooms'}
          </button>
        ))}
      </div>

      {/* Chat Rooms Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
            <FiMessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-gray-500">Total Chat Rooms</h3>
            <p className="text-2xl font-semibold">{chatRooms.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
            <FiUsers size={24} />
          </div>
          <div>
            <h3 className="text-gray-500">Total Members</h3>
            <p className="text-2xl font-semibold">
              {chatRooms.reduce((total, room) => total + (room.memberCount || 0), 0)}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
            <FiMessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-gray-500">Total Messages</h3>
            <p className="text-2xl font-semibold">
              {chatRooms.reduce((total, room) => total + (room.messageCount || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Rooms Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : chatRooms.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  {chatRoomsData && chatRoomsData.message ? chatRoomsData.message : 'No chat rooms found'}
                </td>
              </tr>
            ) : (
              chatRooms.map((room, index) => (
                <tr key={room._id || `room-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {room.name}
                    </div>
                    {room.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {room.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 capitalize">
                      {room.type === 'support' ? 'Discussion' : room.type}
                    </div>
                    {room.courseId && (
                      <div className="text-xs text-blue-500 mt-1">
                        Course: {room.courseId.title || room.courseId}
                      </div>
                    )}
                    {room.studyGroupId && (
                      <div className="text-xs text-green-500 mt-1">
                        Group: {room.studyGroupId.name || room.studyGroupId}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <span className="font-semibold">
                        {room.studentCount || 0}
                      </span> students
                      {activeTab === 'discussions' && (
                        <button
                          onClick={async () => {
                            try {
                              const adminToken = localStorage.getItem('token');
                              
                              // Find all students
                              const usersResponse = await axios.get(
                                `${import.meta.env.VITE_API_URL}/api/admin/users?role=student&limit=1000`,
                                { headers: { Authorization: `Bearer ${adminToken}` } }
                              );
                              
                              const students = usersResponse.data.users || [];
                              
                              if (students.length === 0) {
                                alert('No students found to add');
                                return;
                              }
                              
                              // Since the participants endpoint doesn't exist, directly 
                              // update the room with all students in one request
                              try {
                                const updateResponse = await axios.put(
                                  `${import.meta.env.VITE_API_URL}/api/admin/chat-rooms/${room._id}`,
                                  {
                                    participants: students.map(student => ({
                                      userId: student._id,
                                      userType: 'StudentUser',
                                      role: 'member',
                                      joinedAt: new Date().toISOString()
                                    }))
                                  },
                                  { headers: { Authorization: `Bearer ${adminToken}` } }
                                );
                                
                                alert(`Successfully added ${students.length} students to the room`);
                                refetch();
                              } catch (updateError) {
                                console.error('Error updating room:', updateError);
                                alert('Failed to add students to the room');
                              }
                            } catch (error) {
                              console.error('Error:', error);
                              alert('Failed to get student list');
                            }
                          }}
                          className="ml-2 text-xs text-blue-500 hover:text-blue-800"
                        >
                          + Add All Students
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{room.messageCount || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      room.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {room.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {/* Handle view details */}}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    {(activeTab === 'discussions' || room.type === 'support') && (
                      <>
                        <button
                          onClick={() => {/* Handle edit */}}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          <FiEdit className="inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="inline" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Chat Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Chat Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Room Status
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.isActive ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="ml-3 text-sm text-gray-700">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatRooms; 