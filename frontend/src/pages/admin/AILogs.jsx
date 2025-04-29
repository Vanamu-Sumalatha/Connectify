import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  CommandLineIcon,
  UserIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const AILogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('day');

  // Fetch AI logs
  const { data: aiLogs, isLoading } = useQuery(
    ['aiLogs', filter, timeRange, searchQuery],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/admin/ai-logs?filter=${filter}&timeRange=${timeRange}&search=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Interaction Logs</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search logs..."
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
            <option value="all">All Interactions</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="error">Errors</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <CommandLineIcon className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Total Interactions</p>
                    <p className="text-2xl font-semibold">{aiLogs?.stats?.totalInteractions}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Success Rate</p>
                    <p className="text-2xl font-semibold">{aiLogs?.stats?.successRate}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <DocumentTextIcon className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Average Response Time</p>
                    <p className="text-2xl font-semibold">{aiLogs?.stats?.avgResponseTime}ms</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <UserIcon className="w-8 h-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Unique Users</p>
                    <p className="text-2xl font-semibold">{aiLogs?.stats?.uniqueUsers}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Log List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Interaction Logs</h2>
              </div>
              <div className="divide-y">
                {aiLogs?.logs?.map((log) => (
                  <div key={log._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{log.user.name}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Query:</p>
                            <p className="text-gray-600 mt-1">{log.query}</p>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Response:</p>
                            <p className="text-gray-600 mt-1">{log.response}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            log.status === 'successful'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {log.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {log.responseTime}ms
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Analysis</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Common Queries
                  </h3>
                  <div className="mt-2 space-y-2">
                    {aiLogs?.analysis?.commonQueries?.map((query, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">{query.text}</span>
                        <span className="text-gray-500">{query.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Error Patterns
                  </h3>
                  <div className="mt-2 space-y-2">
                    {aiLogs?.analysis?.errorPatterns?.map((pattern, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">{pattern.type}</span>
                        <span className="text-gray-500">{pattern.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Performance Metrics
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Average Response Time</span>
                      <span className="text-gray-500">
                        {aiLogs?.analysis?.performance?.avgResponseTime}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Peak Response Time</span>
                      <span className="text-gray-500">
                        {aiLogs?.analysis?.performance?.peakResponseTime}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="text-gray-500">
                        {aiLogs?.analysis?.performance?.successRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AILogs; 