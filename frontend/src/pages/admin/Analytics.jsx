import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  UserGroupIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('monthly');

  // Fetch analytics data
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics', timeRange],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/analytics?timeRange=${timeRange}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        toast.error('Failed to fetch analytics data');
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold mb-2">Error loading analytics data</p>
          <p className="text-sm">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <p className="text-xl font-bold mb-2">No data available</p>
          <p className="text-sm">There may be no analytics data available yet</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const userActivityChartData = {
    labels: data.userActivity.labels,
    datasets: [
      {
        label: 'Active Users',
        data: data.userActivity.data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const courseEnrollmentChartData = {
    labels: data.courseEnrollments.labels,
    datasets: [
      {
        label: 'Course Registrations',
        data: data.courseEnrollments.data,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderWidth: 1,
      },
    ],
  };

  const userDemographicsChartData = {
    labels: ['Students', 'Instructors', 'Admins'],
    datasets: [
      {
        data: [data.usersByRole.student, data.usersByRole.instructor, data.usersByRole.admin],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const certificatesChartData = {
    labels: data.certificates.labels,
    datasets: [
      {
        label: 'Certificates Issued',
        data: data.certificates.data,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <OverviewCard 
          title="Total Users" 
          value={data.totalUsers} 
          icon={<UserGroupIcon className="h-8 w-8 text-blue-500" />}
          change={data.userGrowth}
          isPositive={data.userGrowth > 0}
        />
        <OverviewCard 
          title="Total Courses" 
          value={data.totalCourses} 
          icon={<BookOpenIcon className="h-8 w-8 text-green-500" />}
          change={data.courseGrowth}
          isPositive={data.courseGrowth > 0}
        />
        <OverviewCard 
          title="Course Completions" 
          value={data.courseCompletions} 
          icon={<AcademicCapIcon className="h-8 w-8 text-purple-500" />}
          change={data.completionGrowth}
          isPositive={data.completionGrowth > 0}
        />
        <OverviewCard 
          title="Certificates Issued" 
          value={data.totalCertificates} 
          icon={<DocumentTextIcon className="h-8 w-8 text-yellow-500" />}
          change={data.certificateGrowth}
          isPositive={data.certificateGrowth > 0}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Activity</h2>
          <Line 
            data={userActivityChartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false,
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                }
              }
            }}
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Course Registrations</h2>
          <Bar 
            data={courseEnrollmentChartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false,
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                }
              }
            }}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Demographics</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={userDemographicsChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Certificates Issued</h2>
          <Line 
            data={certificatesChartData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: false,
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                }
              }
            }}
          />
        </div>
      </div>

      {/* Top Courses Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Top Courses</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Rating</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topCourses.map((course, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpenIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.registrations}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${course.completionRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">{course.completionRate}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{course.avgRating}</span>
                      <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Overview Card Component
const OverviewCard = ({ title, value, icon, change, isPositive }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${!isPositive && 'transform rotate-180'}`} />
        <span>{Math.abs(change)}% {isPositive ? 'increase' : 'decrease'}</span>
      </div>
    </div>
  );
};

export default Analytics; 