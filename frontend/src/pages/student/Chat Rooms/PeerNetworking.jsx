import React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  MapPinIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PeerNetworking = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [filters, setFilters] = useState({
    course: '',
    year: '',
    skills: [],
    location: '',
  });
  const queryClient = useQueryClient();

  // Fetch peers
  const { data: peers, isLoading } = useQuery(
    ['peers', filters],
    async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/peers`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          params: filters,
        }
      );
      return response.data;
    }
  );

  // Mutation for connecting with a peer
  const connectMutation = useMutation(
    async (peerId) => {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/peers/${peerId}/connect`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('peers');
        toast.success('Successfully connected with peer');
      },
      onError: () => {
        toast.error('Failed to connect with peer');
      },
    }
  );

  // Mutation for disconnecting from a peer
  const disconnectMutation = useMutation(
    async (peerId) => {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/peers/${peerId}/disconnect`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('peers');
        toast.success('Successfully disconnected from peer');
      },
      onError: () => {
        toast.error('Failed to disconnect from peer');
      },
    }
  );

  const handleConnect = (peerId) => {
    if (window.confirm('Are you sure you want to connect with this peer?')) {
      connectMutation.mutate(peerId);
    }
  };

  const handleDisconnect = (peerId) => {
    if (window.confirm('Are you sure you want to disconnect from this peer?')) {
      disconnectMutation.mutate(peerId);
    }
  };

  const filteredPeers = peers?.filter((peer) =>
    peer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Peer Networking</h1>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search peers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setFilters({ ...filters, showFilters: !filters.showFilters })}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 text-gray-600 mr-2" />
            Filters
          </button>
        </div>

        {filters.showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <input
                type="text"
                value={filters.course}
                onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="text"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <input
                type="text"
                value={filters.skills.join(', ')}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    skills: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comma-separated skills"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Peers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeers?.map((peer) => (
          <div
            key={peer._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Peer Profile */}
            <div className="p-4">
              <div className="flex items-center mb-4">
                <img
                  src={peer.avatar}
                  alt={peer.name}
                  className="h-12 w-12 rounded-full mr-3"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {peer.name}
                  </h3>
                  <p className="text-sm text-gray-500">{peer.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  <span>{peer.course}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <BriefcaseIcon className="h-4 w-4 mr-2" />
                  <span>{peer.year} Year</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  <span>{peer.location}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {peer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {peer.isConnected ? (
                  <>
                    <button
                      onClick={() => setSelectedPeer(peer)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => handleDisconnect(peer._id)}
                      className="flex-1 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <UserMinusIcon className="h-5 w-5 mx-auto" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(peer._id)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <UserPlusIcon className="h-5 w-5 inline-block mr-2" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Modal */}
      {selectedPeer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <img
                    src={selectedPeer.avatar}
                    alt={selectedPeer.name}
                    className="h-10 w-10 rounded-full mr-3"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedPeer.name}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedPeer.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPeer(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Chat messages will be implemented here */}
              <div className="h-96 bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-center text-gray-500">
                  Chat functionality coming soon...
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedPeer(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerNetworking;
