import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  MapIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Roadmap = () => {
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const queryClient = useQueryClient();

  // Fetch roadmap data
  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['roadmap'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/roadmap`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data;
    },
    retry: 1,
  });

  // Mutation for updating milestone status
  const updateMilestoneMutation = useMutation({
    mutationFn: async (milestoneData) => {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/student/roadmap/milestones/${milestoneData._id}`,
        milestoneData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roadmap']);
      toast.success('Milestone updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update milestone');
    },
  });

  const handleMilestoneClick = (milestone) => {
    setSelectedMilestone(milestone);
  };

  const handleStatusUpdate = async (milestoneId, newStatus) => {
    try {
      await updateMilestoneMutation.mutateAsync({
        _id: milestoneId,
        status: newStatus,
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

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
        <MapIcon className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold">Learning Roadmap</h1>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-medium">Total Milestones</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {roadmap?.totalMilestones || 0}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
              <span className="font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {roadmap?.completedMilestones || 0}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <span className="font-medium">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {roadmap?.inProgressMilestones || 0}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
              <span className="font-medium">Completion Rate</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {roadmap?.completionRate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="space-y-8">
        {roadmap?.learningPaths.map((path) => (
          <div key={path._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BookOpenIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold">{path.title}</h2>
              </div>
              <span className="text-sm text-gray-500">
                {path.completedMilestones}/{path.totalMilestones} completed
              </span>
            </div>

            <div className="space-y-4">
              {path.milestones.map((milestone) => (
                <div
                  key={milestone._id}
                  className="border-l-4 border-blue-200 pl-4 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${
                          milestone.status === 'completed'
                            ? 'bg-green-500'
                            : milestone.status === 'in_progress'
                            ? 'bg-yellow-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <h3 className="font-medium">{milestone.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {milestone.duration} hours
                      </span>
                      <button
                        onClick={() => handleMilestoneClick(milestone)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">{milestone.description}</p>
                  <div className="mt-4 flex items-center space-x-4">
                    {milestone.status !== 'completed' && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(milestone._id, 'completed')
                        }
                        className="text-sm text-green-600 hover:text-green-800"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {milestone.status === 'not_started' && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(milestone._id, 'in_progress')
                        }
                        className="text-sm text-yellow-600 hover:text-yellow-800"
                      >
                        Start Learning
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Milestone Details Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedMilestone.title}</h2>
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">{selectedMilestone.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>Duration: {selectedMilestone.duration} hours</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  <span>Prerequisites: {selectedMilestone.prerequisites.join(', ')}</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Learning Resources:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedMilestone.resources.map((resource, index) => (
                      <li key={index} className="text-gray-600">
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap; 