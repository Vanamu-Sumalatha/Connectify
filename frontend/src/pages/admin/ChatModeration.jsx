import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ChatBubbleLeftIcon,
  UserIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  FlagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ChatModeration = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch chat messages
  const { data: chatMessages, isLoading } = useQuery(
    ['chatMessages', filter, searchQuery],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/admin/chat-messages?filter=${filter}&search=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    }
  );

  // Update message status mutation
  const updateStatusMutation = useMutation(
    async ({ messageId, status }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/admin/chat-messages/${messageId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('chatMessages');
        toast.success('Message status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error updating message status');
      },
    }
  );

  // Ban user mutation
  const banUserMutation = useMutation(
    async (userId) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/admin/users/${userId}/ban`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('chatMessages');
        toast.success('User banned successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error banning user');
      },
    }
  );

  const handleStatusUpdate = (messageId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'flagged' : 'approved';
    if (window.confirm(`Are you sure you want to ${newStatus} this message?`)) {
      updateStatusMutation.mutate({ messageId, status: newStatus });
    }
  };

  const handleBanUser = (userId) => {
    if (window.confirm('Are you sure you want to ban this user?')) {
      banUserMutation.mutate(userId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chat Moderation</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ChatBubbleLeftIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Messages</option>
            <option value="flagged">Flagged Messages</option>
            <option value="reported">Reported Messages</option>
            <option value="banned">Banned Users</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Chat Messages</h2>
              </div>
              <div className="divide-y">
                {chatMessages?.map((message) => (
                  <div
                    key={message._id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedChat?._id === message._id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedChat(message)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{message.user.name}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{message.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            message.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {message.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(message._id, message.status);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ShieldCheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBanUser(message.user._id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <NoSymbolIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message Details */}
          <div className="lg:col-span-1">
            {selectedChat ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Message Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">User</h3>
                    <p className="mt-1">{selectedChat.user.name}</p>
                    <p className="text-sm text-gray-500">{selectedChat.user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Message</h3>
                    <p className="mt-1">{selectedChat.content}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                    <p className="mt-1">
                      {new Date(selectedChat.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-1 flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          selectedChat.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedChat.status}
                      </span>
                      {selectedChat.reports?.length > 0 && (
                        <span className="flex items-center text-red-600">
                          <FlagIcon className="w-4 h-4 mr-1" />
                          {selectedChat.reports.length} reports
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedChat.reports?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Reports
                      </h3>
                      <div className="mt-2 space-y-2">
                        {selectedChat.reports.map((report, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded p-2 text-sm"
                          >
                            <p className="font-medium">{report.reason}</p>
                            <p className="text-gray-600">{report.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Reported by: {report.reportedBy.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-4" />
                <p>Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatModeration; 