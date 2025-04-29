import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  XCircleIcon,
  UserIcon,
  BookOpenIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

const AdminCertificates = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    assignmentId: '',
    title: '',
    score: 80,
  });

  const queryClient = useQueryClient();

  // Fetch certificates
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/certificates`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Certificates API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
        toast.error('Failed to fetch certificates');
        return [];
      }
    },
  });

  // Fetch students for dropdown
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // Filter for student users only
        const studentUsers = response.data.filter(user => user.role === 'student');
        return studentUsers;
      } catch (error) {
        console.error('Failed to fetch students:', error);
        return [];
      }
    },
  });

  // Fetch courses for dropdown
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/courses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (Array.isArray(response.data)) {
          return response.data;
        } else {
          return [];
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        return [];
      }
    },
  });

  // Fetch certificate tests for dropdown
  const { data: certificateTests = [], isLoading: isLoadingTests } = useQuery({
    queryKey: ['admin-certificate-tests'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/assignments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // Filter for certificate tests only
        const tests = response.data.filter(assignment => 
          assignment.type === 'test' && assignment.isCertificateTest
        );
        return tests;
      } catch (error) {
        console.error('Failed to fetch certificate tests:', error);
        return [];
      }
    },
  });

  // Issue certificate mutation
  const issueCertificateMutation = useMutation({
    mutationFn: async (certificateData) => {
      const token = localStorage.getItem('token');
      console.log('Issuing certificate with data:', certificateData);
      toast.loading('Issuing certificate...');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/certificates`,
        certificateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully issued certificate:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      toast.dismiss();
      toast.success('Certificate issued successfully');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error issuing certificate:', error.response?.data);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Error issuing certificate');
    },
  });

  // Revoke certificate mutation
  const revokeCertificateMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      toast.loading('Revoking certificate...');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/certificates/${id}/revoke`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully revoked certificate:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      toast.dismiss();
      toast.success('Certificate revoked successfully');
    },
    onError: (error) => {
      console.error('Error revoking certificate:', error.response?.data);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Error revoking certificate');
    },
  });

  // Delete certificate mutation
  const deleteCertificateMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      toast.loading('Deleting certificate...');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/certificates/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Successfully deleted certificate:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      toast.dismiss();
      toast.success('Certificate deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting certificate:', error.response?.data);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Error deleting certificate');
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      studentId: '',
      courseId: '',
      assignmentId: '',
      title: '',
      score: 80,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    issueCertificateMutation.mutate(formData);
  };

  const handleRevoke = (id) => {
    if (window.confirm('Are you sure you want to revoke this certificate?')) {
      revokeCertificateMutation.mutate(id);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
      deleteCertificateMutation.mutate(id);
    }
  };

  const handleEdit = (id) => {
    // TODO: Implement edit functionality
    console.log('Edit certificate:', id);
  };

  const handleOpenModal = () => {
    if (!students || students.length === 0) {
      toast.error('You need to have students enrolled before issuing certificates');
      return;
    }
    
    if (!courses || courses.length === 0) {
      toast.error('You need to create courses first before issuing certificates');
      return;
    }
    
    setIsModalOpen(true);
  };

  if (isLoadingCertificates) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Certificates Management</h1>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Issue Certificate
        </button>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Certificate ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {certificates.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No certificates found. Issue your first certificate!
                </td>
              </tr>
            ) : (
              certificates.map((certificate) => (
                <tr key={certificate._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {certificate.certificateId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {certificate.student?.profile?.name || certificate.student?.username || 'Unknown Student'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {certificate.student?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        {certificate.course?.title || 'Unknown Course'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {certificate.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(certificate.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      certificate.status === 'issued'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {certificate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(certificate._id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Certificate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Issue New Certificate</h2>
              <AcademicCapIcon className="h-8 w-8 text-blue-500" />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Student
                  </label>
                  {isLoadingStudents ? (
                    <div className="mt-1 py-2 text-gray-500">Loading students...</div>
                  ) : students.length === 0 ? (
                    <div className="mt-1 py-2 text-red-500">
                      No students available.
                    </div>
                  ) : (
                    <select
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.profile?.name || student.username} ({student.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Course
                  </label>
                  {isLoadingCourses ? (
                    <div className="mt-1 py-2 text-gray-500">Loading courses...</div>
                  ) : courses.length === 0 ? (
                    <div className="mt-1 py-2 text-red-500">
                      No courses available.
                    </div>
                  ) : (
                    <select
                      value={formData.courseId}
                      onChange={(e) => {
                        const course = courses.find(c => c._id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          courseId: e.target.value,
                          title: course ? `${course.title} Certificate of Completion` : ''
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Certificate Test (Optional)
                  </label>
                  {isLoadingTests ? (
                    <div className="mt-1 py-2 text-gray-500">Loading tests...</div>
                  ) : certificateTests.length === 0 ? (
                    <div className="mt-1 py-2 text-gray-500">
                      No certificate tests available.
                    </div>
                  ) : (
                    <select
                      value={formData.assignmentId}
                      onChange={(e) => setFormData({ ...formData, assignmentId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">None (Manual Certificate)</option>
                      {certificateTests.map((test) => (
                        <option key={test._id} value={test._id}>
                          {test.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Certificate Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g. Certificate of Completion"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Score (%)
                  </label>
                  <input
                    type="number"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <DocumentCheckIcon className="h-5 w-5 mr-2" />
                  Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCertificates; 