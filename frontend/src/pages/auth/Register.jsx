import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

// Student Registration Component
const StudentRegister = ({ handleSubmit, formData, handleChange, isLoading, showPassword, showConfirmPassword, togglePasswordVisibility }) => {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showOtherCourseInput, setShowOtherCourseInput] = useState(false);
  const [otherCourseName, setOtherCourseName] = useState('');
  const [courseError, setCourseError] = useState('');

  // Fetch courses from backend

  useEffect(() => {
    const fetchCoursesAndStats = async () => {
      setLoadingCourses(true);
      try {
        const baseUrl = 'http://localhost:5000';
        // Fetch courses
        const coursesResponse = await axios.get(`${baseUrl}/api/courses`);
        setCourses(coursesResponse.data);
        
        // Fetch stats
        try {
          const statsResponse = await axios.get(`${baseUrl}/api/stats`);
          setStats(statsResponse.data);
        } catch (statsError) {
          console.error('Error fetching stats:', statsError);
          // Set default stats
          setStats({
            totalStudents: 120,
            totalCourses: 15,
            activeCourses: 12
          });
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses from server. Using local data.');
        // Fallback data if API fails
        setCourses([
          { _id: '1', title: 'Computer Science' },
          { _id: '2', title: 'Information Technology' },
          { _id: '3', title: 'Software Engineering' },
          { _id: '4', title: 'Data Science' },
          { _id: '5', title: 'Artificial Intelligence' },
          { _id: '6', title: 'Cybersecurity' },
          { _id: '7', title: 'Web Development' },

        ]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCoursesAndStats();
  }, []);

  // Handle course checkbox change
  const handleCourseCheckboxChange = (courseId) => {
    let updatedCourses = [...(formData.selectedCourses || [])];
    
    if (updatedCourses.includes(courseId)) {
      updatedCourses = updatedCourses.filter(id => id !== courseId);
    } else {
      updatedCourses.push(courseId);
    }
    
    handleChange({
      target: {
        name: 'selectedCourses',
        value: updatedCourses
      }
    });
    
    // Clear error if at least one course is selected
    if (updatedCourses.length > 0 || (showOtherCourseInput && otherCourseName.trim())) {
      setCourseError('');
    }
  };

  // Handle "Other" course checkbox
  const handleOtherCourseCheckbox = (e) => {
    setShowOtherCourseInput(e.target.checked);
    if (!e.target.checked) {
      setOtherCourseName('');
      handleChange({
        target: {
          name: 'otherCourse',
          value: ''
        }
      });
    }
  };

  // Handle other course name input
  const handleOtherCourseNameChange = (e) => {
    setOtherCourseName(e.target.value);
    handleChange({
      target: {
        name: 'otherCourse',
        value: e.target.value
      }
    });
    
    // Clear error if text is entered
    if (e.target.value.trim()) {
      setCourseError('');
    }
  };

  // Custom submit handler with validation
  const validateAndSubmit = (e) => {
    e.preventDefault();
    
    // Validate that at least one course is selected
    if (
      (!formData.selectedCourses || formData.selectedCourses.length === 0) && 
      (!showOtherCourseInput || !otherCourseName.trim())
    ) {
      setCourseError('Please select at least one course or specify other');
      return;
    }
    
    // Continue with form submission
    handleSubmit(e);
  };

  return (
    <div>
      <h2 className="text-center text-2xl font-bold mb-8">Create Student Account</h2>

      <form onSubmit={validateAndSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Course Selection with Checkboxes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Courses <span className="text-red-500">*</span>
          </label>
          {loadingCourses ? (
            <div className="text-sm text-gray-500">Loading courses...</div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {courses.map(course => (
                  <div key={course._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`course-${course._id}`}
                      checked={formData.selectedCourses?.includes(course._id)}
                      onChange={() => handleCourseCheckboxChange(course._id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`course-${course._id}`} className="ml-2 text-sm text-gray-700">
                      {course.title}
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Other option */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="other-course"
                    type="checkbox"
                    checked={showOtherCourseInput}
                    onChange={handleOtherCourseCheckbox}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <label htmlFor="other-course" className="ml-2 text-sm text-gray-700">
                  Other (please specify)
                </label>
              </div>
              
              {showOtherCourseInput && (
                <div className="mt-2 ml-6">
                  <input
                    type="text"
                    value={otherCourseName}
                    onChange={handleOtherCourseNameChange}
                    placeholder="Enter course name"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              )}
              
              {courseError && (
                <p className="text-sm text-red-600 mt-1">{courseError}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('password')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirmPassword')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Hidden input for role */}
        <input type="hidden" name="role" value="student" />

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create Student Account'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
};

// Admin Registration Component
const AdminRegister = ({ handleSubmit, formData, handleChange, isLoading, showPassword, showConfirmPassword, togglePasswordVisibility }) => {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showOtherCourseInput, setShowOtherCourseInput] = useState(false);
  const [otherCourseName, setOtherCourseName] = useState('');
  const [courseError, setCourseError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeCourses: 0
  });

  // Fetch courses from backend
  useEffect(() => {
    const fetchCoursesAndStats = async () => {
      setLoadingCourses(true);
      try {
        // Fetch courses
        const coursesResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/courses`);
        setCourses(coursesResponse.data);
        
        // Fetch stats
        try {
          const statsResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/stats`);
          setStats(statsResponse.data);
        } catch (statsError) {
          console.error('Error fetching stats:', statsError);
          // Set default stats
          setStats({
            totalStudents: 120,
            totalCourses: 15,
            activeCourses: 12
          });
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Set some default courses if API fails
        setCourses([
          { _id: '1', title: 'Computer Science' },
          { _id: '2', title: 'Data Science' },
          { _id: '3', title: 'Web Development' },
          { _id: '4', title: 'Machine Learning' },
          { _id: '5', title: 'Artificial Intelligence' },
        ]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCoursesAndStats();
  }, []);

  // Handle course checkbox change
  const handleCourseCheckboxChange = (courseId) => {
    let updatedCourses = [...(formData.managedCourses || [])];
    
    if (updatedCourses.includes(courseId)) {
      updatedCourses = updatedCourses.filter(id => id !== courseId);
    } else {
      updatedCourses.push(courseId);
    }
    
    handleChange({
      target: {
        name: 'managedCourses',
        value: updatedCourses
      }
    });
    
    // Clear error if at least one course is selected
    if (updatedCourses.length > 0 || (showOtherCourseInput && otherCourseName.trim())) {
      setCourseError('');
    }
  };

  // Handle "Other" course checkbox
  const handleOtherCourseCheckbox = (e) => {
    setShowOtherCourseInput(e.target.checked);
    if (!e.target.checked) {
      setOtherCourseName('');
      handleChange({
        target: {
          name: 'otherCourse',
          value: ''
        }
      });
    }
  };

  // Handle other course name input
  const handleOtherCourseNameChange = (e) => {
    setOtherCourseName(e.target.value);
    handleChange({
      target: {
        name: 'otherCourse',
        value: e.target.value
      }
    });
    
    // Clear error if text is entered
    if (e.target.value.trim()) {
      setCourseError('');
    }
  };

  // Custom submit handler with validation
  const validateAndSubmit = (e) => {
    e.preventDefault();
    
    // Validate that at least one course is selected
    if (
      (!formData.managedCourses || formData.managedCourses.length === 0) && 
      (!showOtherCourseInput || !otherCourseName.trim())
    ) {
      setCourseError('Please select at least one course or specify other');
      return;
    }
    
    // Continue with form submission
    handleSubmit(e);
  };

  return (
    <div>
      <h2 className="text-center text-2xl font-bold mb-8">Create Admin Account</h2>

      {/* Stats Dashboard */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-blue-800 mb-2">Platform Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-xl font-bold text-blue-600">{stats.totalStudents}</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-xl font-bold text-blue-600">{stats.totalCourses}</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-sm text-gray-500">Active Courses</p>
            <p className="text-xl font-bold text-blue-600">{stats.activeCourses}</p>
          </div>
        </div>
      </div>

      <form onSubmit={validateAndSubmit} className="space-y-4">
        {/* Personal Information */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                required
                value={formData.contactNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Employment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                required
                value={formData.employeeId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                required
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                Position
          </label>
              <input
                id="position"
                name="position"
                type="text"
                required
                value={formData.position}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Course Management */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Course Management</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Courses to Manage <span className="text-red-500">*</span>
            </label>
            {loadingCourses ? (
              <div className="text-sm text-gray-500">Loading courses...</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {courses.map(course => (
                    <div key={course._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`manage-course-${course._id}`}
                        checked={formData.managedCourses?.includes(course._id)}
                        onChange={() => handleCourseCheckboxChange(course._id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`manage-course-${course._id}`} className="ml-2 text-sm text-gray-700">
                        {course.title}
                      </label>
                    </div>
                  ))}
                </div>
                
                {/* Other option */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="other-manage-course"
                      type="checkbox"
                      checked={showOtherCourseInput}
                      onChange={handleOtherCourseCheckbox}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <label htmlFor="other-manage-course" className="ml-2 text-sm text-gray-700">
                    Other (please specify)
                  </label>
                </div>
                
                {showOtherCourseInput && (
                  <div className="mt-2 ml-6">
                    <input
                      type="text"
                      value={otherCourseName}
                      onChange={handleOtherCourseNameChange}
                      placeholder="Enter course name"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                )}
                
                {courseError && (
                  <p className="text-sm text-red-600 mt-1">{courseError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security Information */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden input for role */}
        <input type="hidden" name="role" value="admin" />

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create Admin Account'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
};

// Main Register Component
const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    department: '',
    position: '',
    contactNumber: '',
    selectedCourses: [],
    managedCourses: [],
    otherCourse: '',
    role: 'student',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  
  // Check if we're on the admin registration page
  const isAdminRegister = location.pathname === '/register/admin';
  
  // Set the role based on the route
  useEffect(() => {
    if (isAdminRegister) {
      setFormData(prev => ({ ...prev, role: 'admin' }));
    } else {
      setFormData(prev => ({ ...prev, role: 'student' }));
    }
  }, [isAdminRegister]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Prepare data for API
      const formDataToSend = { ...formData };
      
      // Process data according to role and course selection
      if (formData.role === 'student') {
        // For student registration
        let courses = [...(formData.selectedCourses || [])];
        
        // Add the other course if specified
        if (formData.otherCourse && formData.otherCourse.trim()) {
          formDataToSend.customCourse = formData.otherCourse.trim();
        }
        
        formDataToSend.courses = courses;
      } else {
        // For admin registration
        let managedCourses = [...(formData.managedCourses || [])];
        
        // Add the other course if specified
        if (formData.otherCourse && formData.otherCourse.trim()) {
          formDataToSend.customManagedCourse = formData.otherCourse.trim();
        }
        
        formDataToSend.managedCourses = managedCourses;
      }
      
      // Remove fields that shouldn't be sent to the API
      delete formDataToSend.confirmPassword;
      delete formDataToSend.otherCourse;
      
      await register(formDataToSend);
      toast.success('Registration successful!');
      
      // Redirect based on role
      if (formData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Render the appropriate registration form based on the route
  return isAdminRegister 
    ? <AdminRegister 
        handleSubmit={handleSubmit} 
        formData={formData} 
        handleChange={handleChange} 
        isLoading={isLoading} 
        showPassword={showPassword} 
        showConfirmPassword={showConfirmPassword} 
        togglePasswordVisibility={togglePasswordVisibility} 
      />
    : <StudentRegister 
        handleSubmit={handleSubmit} 
        formData={formData} 
        handleChange={handleChange} 
        isLoading={isLoading} 
        showPassword={showPassword} 
        showConfirmPassword={showConfirmPassword} 
        togglePasswordVisibility={togglePasswordVisibility} 
      />;
};

export default Register; 