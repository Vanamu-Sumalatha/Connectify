import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Webinars = () => {
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const queryClient = useQueryClient();

  // Fetch webinars
  const { data: webinars, isLoading } = useQuery({
    queryKey: ['webinars', filter],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/webinars`,
        {
          params: { filter },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    retry: 1,
  });

  // Mutation for registering for a webinar
  const registerMutation = useMutation({
    mutationFn: async (webinarId) => {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/webinars/${webinarId}/register`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['webinars', filter]);
      toast.success('Successfully registered for webinar');
    },
    onError: () => {
      toast.error('Failed to register for webinar');
    },
  });

  // Mutation for unregistering from a webinar
  const unregisterMutation = useMutation({
    mutationFn: async (webinarId) => {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/webinars/${webinarId}/unregister`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['webinars', filter]);
      toast.success('Successfully unregistered from webinar');
    },
    onError: () => {
      toast.error('Failed to unregister from webinar');
    },
  });

  const handleRegister = (webinarId) => {
    if (window.confirm('Are you sure you want to register for this webinar?')) {
      registerMutation.mutate(webinarId);
    }
  };

  const handleUnregister = (webinarId) => {
    if (window.confirm('Are you sure you want to unregister from this webinar?')) {
      unregisterMutation.mutate(webinarId);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <VideoCameraIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Webinars</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search webinars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <FunnelIcon className="w-5 h-5 text-gray-500 cursor-pointer" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="registered">Registered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Webinars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : (
          webinars?.map((webinar) => (
            <div
              key={webinar._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Webinar Thumbnail */}
              <div className="relative h-48 bg-gray-200">
                {webinar.thumbnail && (
                  <img
                    src={webinar.thumbnail}
                    alt={webinar.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2">
                  {webinar.isRegistered ? (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Registered
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Open
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {webinar.duration} minutes
                  </span>
                  <button className="text-white hover:text-gray-200">
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Webinar Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {webinar.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{webinar.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{formatDate(webinar.date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>{formatTime(webinar.date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span>{webinar.registeredCount} registered</span>
                  </div>
                </div>

                {/* Speaker Info */}
                <div className="flex items-center mb-4">
                  <img
                    src={webinar.speaker.avatar}
                    alt={webinar.speaker.name}
                    className="h-8 w-8 rounded-full mr-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {webinar.speaker.name}
                    </p>
                    <p className="text-xs text-gray-500">{webinar.speaker.title}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {webinar.isRegistered ? (
                    <>
                      <button
                        onClick={() => setSelectedWebinar(webinar)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Join Now
                      </button>
                      <button
                        onClick={() => handleUnregister(webinar._id)}
                        className="flex-1 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <XCircleIcon className="h-5 w-5 mx-auto" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRegister(webinar._id)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <CheckCircleIcon className="h-5 w-5 inline-block mr-2" />
                      Register
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Webinar Details Modal */}
      {selectedWebinar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedWebinar.title}
                </h2>
                <button
                  onClick={() => setSelectedWebinar(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedWebinar.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Schedule</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      <span>{formatDate(selectedWebinar.date)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      <span>{formatTime(selectedWebinar.date)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      <span>{selectedWebinar.registeredCount} registered</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Speaker</h3>
                  <div className="flex items-center">
                    <img
                      src={selectedWebinar.speaker.avatar}
                      alt={selectedWebinar.speaker.name}
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedWebinar.speaker.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedWebinar.speaker.title}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedWebinar(null);
                      handleRegister(selectedWebinar._id);
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Webinars;
