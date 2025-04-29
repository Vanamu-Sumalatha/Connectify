import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useStudent } from '../../../context/StudentContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  BellIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Fallback mock data when API isn't available
const fallbackDashboardData = {
  progress: 65,
  activeCourses: 4,
  completedCourses: 2,
  streak: 7,
  totalHours: 12,
  achievements: 8,
  pendingAchievements: 3,
  upcomingTasks: [
    {
      title: "Assignment: Data Structures",
      description: "Complete the linked list implementation",
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      course: "Computer Science 101"
    },
    {
      title: "Quiz: React Fundamentals",
      description: "Test your knowledge of React basics",
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      course: "Web Development"
    },
    {
      title: "Group Project Milestone",
      description: "Submit the first prototype",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      course: "Software Engineering"
    }
  ],
  announcements: [
    {
      title: "Platform Maintenance",
      content: "The platform will be down for maintenance on July 20 from 2-4am UTC.",
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      priority: "medium"
    },
    {
      title: "New Course Available",
      content: "Check out our new course on Artificial Intelligence.",
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
      priority: "high"
    }
  ],
  upcomingEvents: [
    {
      title: "Course Review Session",
      description: "Join us for a review session of your current course.",
      startTime: new Date(Date.now() + 86400000).toISOString()
    },
    {
      title: "Live Webinar: Advanced Concepts",
      description: "A deep dive into advanced concepts in your field of study.",
      startTime: new Date(Date.now() + 3 * 86400000).toISOString()
    }
  ]
};

const Dashboard = () => {
  console.log('Dashboard component rendering');
  const [timeRange, setTimeRange] = useState('week');
  const { user } = useAuth();
  const { student } = useStudent();
  const navigate = useNavigate();

  console.log('Current user:', user);
  console.log('Current student data:', student);

  // Get token from localStorage directly
  const token = localStorage.getItem('token');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', timeRange],
    queryFn: async () => {
      console.log('Fetching dashboard data...');
      try {
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login');
          return null;
        }

        const baseUrl = 'http://localhost:5000';
        console.log('Making API request to:', `${baseUrl}/api/student/dashboard?timeRange=${timeRange}`);
        const response = await axios.get(
          `${baseUrl}/api/student/dashboard?timeRange=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('API Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
          
          if (error.response.status === 401) {
            toast.error('Session expired. Please login again.');
            navigate('/login');
          } else if (error.response.status === 404) {
            console.log('API endpoint not found, using fallback data');
            toast.error('Dashboard API not available, using sample data');
            return fallbackDashboardData;
          } else {
            toast.error('Failed to load dashboard data. Please try again later.');
          }
        } else {
          toast.error('Network error. Please check your connection.');
        }
        
        // Return fallback data for development
        return fallbackDashboardData;
      }
    },
    enabled: !!token,
    retry: 1,
  });

  console.log('Query state:', { isLoading, error, hasData: !!data });

  if (isLoading) {
    console.log('Loading state rendered');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const dashboardData = data || fallbackDashboardData;

  // Get the greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user display name from either student context or user context
  const displayName = student?.profile?.firstName || user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
          <p className="text-gray-600">{getGreeting()}, {displayName}</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Overall Progress */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Overall Progress</p>
              <p className="text-2xl font-semibold">{dashboardData.progress || 0}%</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${dashboardData.progress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Active Courses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Active Courses</p>
              <p className="text-2xl font-semibold">{dashboardData.activeCourses || 0}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">
              {dashboardData.completedCourses || 0} completed
            </span>
          </div>
        </div>

        {/* Learning Streak */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Learning Streak</p>
              <p className="text-2xl font-semibold">{dashboardData.streak || 0} days</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-yellow-600">
              {dashboardData.totalHours || 0} hours this week
            </span>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Achievements</p>
              <p className="text-2xl font-semibold">{dashboardData.achievements || 0}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-purple-600">
              {dashboardData.pendingAchievements || 0} pending
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming Tasks Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Upcoming Tasks</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
        </div>
        
        {dashboardData.upcomingTasks && dashboardData.upcomingTasks.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.upcomingTasks.map((task, index) => (
              <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.description}</p>
                <div className="flex items-center mt-1">
                  <CalendarIcon className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-xs text-gray-500">
                    {new Date(task.dueDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No upcoming tasks at the moment.</p>
          </div>
        )}
      </div>

      {/* Announcements Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Announcements</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
        </div>
        
        {dashboardData.announcements && dashboardData.announcements.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.announcements.map((announcement, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  <BellIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                    <span className="text-xs text-gray-500 mt-2 block">
                      {new Date(announcement.timestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No announcements at the moment.</p>
          </div>
        )}
      </div>

      {/* Upcoming Events Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Upcoming Events</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
        </div>
        
        {dashboardData.upcomingEvents && dashboardData.upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-start p-4 border border-gray-200 rounded-lg">
                <div className="bg-blue-100 rounded-md p-2 mr-4">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  <div className="flex items-center mt-2">
                    <ClockIcon className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-xs text-gray-500">
                      {new Date(event.startTime).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No upcoming events at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 