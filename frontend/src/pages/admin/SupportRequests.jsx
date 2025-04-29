import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  QuestionMarkCircleIcon,
  UserIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const SupportRequests = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  // Fetch support tickets
  const { data: tickets, isLoading } = useQuery(
    ['supportTickets', filter, searchQuery],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/admin/support-tickets?filter=${filter}&search=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    }
  );

  // Update ticket status mutation
  const updateStatusMutation = useMutation(
    async ({ ticketId, status }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/admin/support-tickets/${ticketId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('supportTickets');
        toast.success('Ticket status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error updating ticket status');
      },
    }
  );

  // Add response mutation
  const addResponseMutation = useMutation(
    async ({ ticketId, responseText }) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/admin/support-tickets/${ticketId}/responses`,
        { content: responseText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('supportTickets');
        toast.success('Response added successfully');
        setResponse('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error adding response');
      },
    }
  );

  const handleStatusUpdate = (ticketId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    if (window.confirm(`Are you sure you want to ${newStatus} this ticket?`)) {
      updateStatusMutation.mutate({ ticketId, status: newStatus });
    }
  };

  const handleSubmitResponse = (e) => {
    e.preventDefault();
    if (!response.trim()) return;
    addResponseMutation.mutate({
      ticketId: selectedTicket._id,
      responseText: response,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Requests</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Support Tickets</h2>
              </div>
              <div className="divide-y">
                {tickets?.map((ticket) => (
                  <div
                    key={ticket._id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedTicket?._id === ticket._id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <QuestionMarkCircleIcon className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{ticket.subject}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(ticket.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">
                            {ticket.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            ticket.status === 'open'
                              ? 'bg-green-100 text-green-800'
                              : ticket.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(ticket._id, ticket.status);
                          }}
                          className={`${
                            ticket.status === 'open'
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {ticket.status === 'open' ? (
                            <XMarkIcon className="w-5 h-5" />
                          ) : (
                            <CheckIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Ticket Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">User</h3>
                    <div className="mt-1 flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span>{selectedTicket.user.name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedTicket.user.email}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Subject</h3>
                    <p className="mt-1">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Description
                    </h3>
                    <p className="mt-1">{selectedTicket.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-1 flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          selectedTicket.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : selectedTicket.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        Created:{' '}
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Responses */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Responses
                    </h3>
                    <div className="space-y-3">
                      {selectedTicket.responses?.map((response, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">
                              {response.isAdmin ? 'Admin' : 'User'}
                            </span>
                            <span className="text-gray-500">
                              {new Date(response.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-600">{response.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Response Form */}
                  <form onSubmit={handleSubmitResponse}>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Add Response
                      </label>
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Type your response..."
                        required
                      />
                    </div>
                    <div className="mt-4">
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Send Response
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-4" />
                <p>Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportRequests; 