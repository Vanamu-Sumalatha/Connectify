import React, { Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import StudentLayout from '../layouts/StudentLayout';
import AuthLayout from '../layouts/AuthLayout';
import HomeLayout from '../layouts/HomeLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Home Page
import Home from '../pages/home/Home';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import CourseManagement from '../pages/admin/CourseManagement';
import Announcements from '../pages/admin/Announcements';
import Analytics from '../pages/admin/Analytics';
import ChatRooms from '../pages/admin/ChatRooms';
import AILogs from '../pages/admin/AILogs';
import TaskManager from '../pages/admin/TaskManager';
import SupportRequests from '../pages/admin/SupportRequests';
import AdminChatRooms from '../pages/admin/AdminChatRooms';
import AdminStudyGroups from '../pages/admin/AdminStudyGroups';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminAssignments from '../pages/admin/AdminAssignments';
import AdminCertificates from '../pages/admin/AdminCertificates';

// Student Pages
import StudentDashboard from '../pages/student/Dashboard/Dashboard';
import MyCourses from '../pages/student/My Courses/MyCourses';
import CourseDetails from '../pages/student/My Courses/CourseDetails';
import CourseEnrollment from '../pages/student/My Courses/CourseEnrollment';
import StudentChatRooms from '../pages/student/Chat Rooms/StudentChatRooms';
import Discussions from '../pages/student/Chat Rooms/Discussions';
import PeerNetworking from '../pages/student/Chat Rooms/PeerNetworking';
import AIChatbot from '../pages/student/AI Chatbot/AIChatbot';
import CertificationTests from '../pages/student/Certification Tests/CertificationTests';
import Assignments from '../pages/student/Assignments & To-Do/Assignments';
import Quiz from '../pages/student/Assignments & To-Do/Quiz';
import QuizAttempt from '../pages/student/Assignments & To-Do/QuizAttempt';
import Todo from '../pages/student/Assignments & To-Do/Todo';
import Roadmap from '../pages/student/Roadmap/Roadmap';
import Achievements from '../pages/student/Achievements/Achievements';
import Certificates from '../pages/student/Certificates/Certificates';
import Webinars from '../pages/student/Webinars/Webinars';
import Settings from '../pages/student/Settings/Settings';
import Profile from '../pages/student/Profile/Profile';
import Notifications from '../pages/student/Notifications/Notifications';
import Help from '../pages/student/Help/Help';
import AllAvailableCources from '../pages/student/My Courses/AllAvailableCources';
import CourseCatalog from '../pages/student/My Courses/CourseCatalog';
import TakeTest from '../pages/student/Certification Tests/TakeTest.jsx';

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Authentication Guard Component
const AuthGuard = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Use a ref to track if we've already navigated
  const hasNavigated = React.useRef(false);

  useEffect(() => {
    if (!isLoading && !hasNavigated.current) {
      if (!isAuthenticated) {
        hasNavigated.current = true;
        navigate('/login', { 
          state: { from: location }, 
          replace: true 
        });
      } else if (allowedRoles && !allowedRoles.includes(user?.role)) {
        hasNavigated.current = true;
        navigate('/', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user?.role, allowedRoles, location, navigate]);

  // Reset the ref when the component unmounts
  React.useEffect(() => {
    return () => {
      hasNavigated.current = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role))) {
    return null;
  }

  return children;
};

// Public Route Guard Component
const PublicRouteGuard = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Use a ref to track if we've already navigated
  const hasNavigated = React.useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasNavigated.current) {
      hasNavigated.current = true;
      const path = location.state?.from?.pathname || (user?.role === 'admin' ? '/admin' : '/student/dashboard');
      navigate(path, { replace: true });
    }
  }, [isLoading, isAuthenticated, user?.role, location.state?.from?.pathname, navigate]);

  // Reset the ref when the component unmounts
  React.useEffect(() => {
    return () => {
      hasNavigated.current = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
};

// Router Component
const AppRouter = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Home Routes - For non-authenticated users */}
        <Route element={<HomeLayout />}>
          <Route 
            path="/" 
            element={
              isLoading ? (
                <LoadingSpinner />
              ) : isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
              ) : (
                <Home />
              )
            } 
          />
          <Route 
            path="/home" 
            element={
              isLoading ? (
                <LoadingSpinner />
              ) : isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
              ) : (
                <Home />
              )
            } 
          />
        </Route>

        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <PublicRouteGuard>
                <Login />
              </PublicRouteGuard>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRouteGuard>
                <Register />
              </PublicRouteGuard>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRouteGuard>
                <ForgotPassword />
              </PublicRouteGuard>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AuthGuard allowedRoles={['admin']}>
              <AdminLayout />
            </AuthGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="chat-rooms" element={<AdminChatRooms />} />
          <Route path="study-groups" element={<AdminStudyGroups />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Announcements />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="help" element={<SupportRequests />} />
          <Route path="ai-logs" element={<AILogs />} />
          <Route path="certificates" element={<AdminCertificates />} />
        </Route>

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <AuthGuard allowedRoles={['student']}>
              <StudentLayout />
            </AuthGuard>
          }
        > 
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="courses/catalog" element={<ErrorBoundary><CourseCatalog /></ErrorBoundary>} />
          <Route path="courses/all" element={<AllAvailableCources />} />
          <Route path="courses/:id" element={<CourseDetails />} />
          <Route path="enroll/:id" element={<CourseEnrollment />} />
          <Route path="chat" element={<StudentChatRooms />} />
          <Route path="discussions" element={<Discussions />} />
          <Route path="peer-networking" element={<PeerNetworking />} />
          <Route path="ai-chat" element={<AIChatbot />} />
          <Route path="tests" element={<CertificationTests />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="assignments/quiz/:quizId" element={<QuizAttempt />} />
          <Route path="quiz/:quizId" element={<QuizAttempt />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="certificates/:id" element={<Certificates />} />
          <Route path="webinars" element={<Webinars />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
        </Route>

        {/* TakeTest Route - Outside StudentLayout */}
        <Route
          path="/student/tests/:id"
          element={
            <AuthGuard allowedRoles={['student']}>
              <TakeTest />
            </AuthGuard>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter; 