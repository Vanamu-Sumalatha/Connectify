import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import studentApi from '../services/studentApi';
import { useAuth } from './AuthContext';

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }

        if (user.role !== 'student') {
            setLoading(false);
            return;
        }

        try {
            console.log('Setting up student data from user:', user);
            
            setStudent({
                _id: user._id,
                email: user.email,
                name: user.name,
                profile: user.profile || {
                    firstName: user.name?.split(' ')[0] || '',
                    lastName: user.name?.split(' ')[1] || '',
                    avatar: user.avatar || '',
                },
                notifications: user.notifications || [],
                dashboard: {
                    enrolledCourses: user.enrolledCourses || [],
                    recentActivities: user.recentActivities || [],
                    upcomingAssignments: user.upcomingAssignments || []
                },
                preferences: user.preferences || {}
            });
            
            setError(null);
        } catch (err) {
            console.error('Error setting up student data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    const updateProfile = async (profileData) => {
        if (!user || !user._id) {
            throw new Error('User not authenticated');
        }
        
        try {
            setLoading(true);
            const updatedProfile = { ...student.profile, ...profileData };
            setStudent(prev => ({ ...prev, profile: updatedProfile }));
            setError(null);
            return updatedProfile;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (settings) => {
        if (!user || !user._id) {
            throw new Error('User not authenticated');
        }
        
        try {
            setLoading(true);
            const updatedSettings = { ...student.preferences, ...settings };
            setStudent(prev => ({ ...prev, preferences: updatedSettings }));
            setError(null);
            return updatedSettings;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const markNotificationAsRead = async (notificationId) => {
        if (!user || !user._id) {
            throw new Error('User not authenticated');
        }
        
        try {
            setStudent(prev => ({
                ...prev,
                notifications: prev.notifications.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            }));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const value = {
        student,
        loading,
        error,
        updateProfile,
        updateSettings,
        markNotificationAsRead,
        logout: () => {}
    };

    return (
        <StudentContext.Provider value={value}>
            {children}
        </StudentContext.Provider>
    );
};

export const useStudent = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudent must be used within a StudentProvider');
    }
    return context;
}; 