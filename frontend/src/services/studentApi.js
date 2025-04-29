import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl } from '../config.js';

const API_URL = baseUrl;
const API_BASE = `${API_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increase timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
api.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('API Request:', `${config.method.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('API Timeout Error: Request took too long to complete');
      toast.error('Server request timed out. Please check if the backend server is running.');
    } else {
      console.error('API Response Error:', 
        error.response ? 
          `${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}` : 
          error.message
      );
    }
    return Promise.reject(error);
  }
);

const studentApi = {
    // Authentication
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (studentData) => {
        try {
            const response = await api.post('/auth/register', studentData);
            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    // User Profile
    getProfile: async (studentId) => {
        const response = await api.get(`/students/${studentId}/profile`);
        return response.data;
    },

    updateProfile: async (studentId, profileData) => {
        const response = await api.put(`/students/${studentId}/profile`, profileData);
        return response.data;
    },

    // Dashboard
    getDashboard: async (studentId) => {
        const response = await api.get(`/students/${studentId}/dashboard`);
        return response.data;
    },

    // Courses
    getCourses: async (studentId) => {
        const response = await api.get(`/students/${studentId}/courses`);
        return response.data;
    },

    getCourseDetails: async (studentId, courseId) => {
        const response = await api.get(`/students/${studentId}/courses/${courseId}`);
        return response.data;
    },

    // Assignments
    getAssignments: async (studentId) => {
        const response = await api.get(`/students/${studentId}/assignments`);
        return response.data;
    },

    submitAssignment: async (studentId, assignmentId, submissionData) => {
        const response = await api.post(
            `/students/${studentId}/assignments/${assignmentId}/submit`,
            submissionData
        );
        return response.data;
    },

    // Quizzes
    getQuizzes: async (studentId) => {
        const response = await api.get(`/students/${studentId}/quizzes`);
        return response.data;
    },

    startQuiz: async (studentId, quizId) => {
        const response = await api.post(`/students/${studentId}/quizzes/${quizId}/start`);
        return response.data;
    },

    submitQuiz: async (studentId, quizId, answers) => {
        const response = await api.post(
            `/students/${studentId}/quizzes/${quizId}/submit`,
            { answers }
        );
        return response.data;
    },

    // Study Groups
    getStudyGroups: async (studentId) => {
        const response = await api.get(`/students/${studentId}/study-groups`);
        return response.data;
    },

    joinStudyGroup: async (studentId, groupId) => {
        const response = await api.post(`/students/${studentId}/study-groups/${groupId}/join`);
        return response.data;
    },

    // Chat
    getChatRooms: async (studentId) => {
        const response = await api.get(`/students/${studentId}/chat-rooms`);
        return response.data;
    },

    sendMessage: async (studentId, roomId, message) => {
        const response = await api.post(
            `/students/${studentId}/chat-rooms/${roomId}/messages`,
            { message }
        );
        return response.data;
    },

    // Analytics
    getAnalytics: async (studentId) => {
        const response = await api.get(`/students/${studentId}/analytics`);
        return response.data;
    },

    // Notifications
    getNotifications: async (studentId) => {
        const response = await api.get(`/students/${studentId}/notifications`);
        return response.data;
    },

    markNotificationAsRead: async (studentId, notificationId) => {
        const response = await api.put(
            `/students/${studentId}/notifications/${notificationId}/read`
        );
        return response.data;
    },

    // Settings
    getSettings: async (studentId) => {
        const response = await api.get(`/students/${studentId}/settings`);
        return response.data;
    },

    updateSettings: async (studentId, settings) => {
        const response = await api.put(`/students/${studentId}/settings`, settings);
        return response.data;
    }
};

export default studentApi; 