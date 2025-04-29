import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  TrophyIcon,
  AcademicCapIcon,
  StarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Achievements = () => {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/achievements`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data;
    },
    onError: () => {
      toast.error('Failed to fetch achievements');
    },
    retry: 1,
  });

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
        <TrophyIcon className="h-8 w-8 text-yellow-500 mr-3" />
        <h1 className="text-2xl font-bold">My Achievements</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements?.map((achievement) => (
          <div
            key={achievement._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              {achievement.type === 'course' && (
                <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
              )}
              {achievement.type === 'quiz' && (
                <StarIcon className="h-6 w-6 text-yellow-500 mr-2" />
              )}
              {achievement.type === 'milestone' && (
                <ChartBarIcon className="h-6 w-6 text-green-600 mr-2" />
              )}
              <h2 className="text-xl font-semibold">{achievement.title}</h2>
            </div>

            <p className="text-gray-600 mb-4">{achievement.description}</p>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Earned on: {new Date(achievement.earnedAt).toLocaleDateString()}</span>
              {achievement.points && (
                <span className="font-semibold text-blue-600">
                  +{achievement.points} points
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!achievements || achievements.length === 0) && (
        <div className="text-center py-12">
          <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Achievements Yet
          </h3>
          <p className="text-gray-500">
            Complete courses, quizzes, and reach milestones to earn achievements!
          </p>
        </div>
      )}
    </div>
  );
};

export default Achievements; 