import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    MessageSquare,
    Users,
    Bell,
    Settings,
    LogOut,
    Award,
    Medal,
    Video,
    User,
    HelpCircle,
    Compass,
    Beaker,
    MessageCircle,
    Cpu,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    CheckSquare,
    FileQuestion
} from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const StudentSidebar = ({ onCollapseChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef(null);
    const location = useLocation();
    const { student } = useStudent();
    const { user, logout } = useAuth();
    const [expandedSections, setExpandedSections] = useState({
        communication: false,
        learning: false,
        achievements: false
    });
    const baseUrl = 'http://localhost:5000';

    // Fetch enrolled courses that are in progress
    const { data: inProgressCourses } = useQuery({
        queryKey: ['inProgressCourses'],
        queryFn: async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return [];
                
                const response = await axios.get(`${baseUrl}/api/student/courses/enrolled`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Filter courses to only show in-progress ones
                return response.data.filter(course => course.status === 'in-progress');
            } catch (error) {
                console.error('Error fetching in-progress courses:', error);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000 // 5 minutes
    });

    // Update parent component when sidebar state changes
    useEffect(() => {
        if (onCollapseChange) {
            onCollapseChange(isCollapsed);
        }
    }, [isCollapsed, onCollapseChange]);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // If student data is not available, use user data directly
    const studentData = student || {
        profile: {
            firstName: user?.name?.split(' ')[0] || '',
            lastName: user?.name?.split(' ')[1] || ''
        },
        email: user?.email || '',
        notifications: []
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Main navigation items
    const mainNavigation = [
        { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
        { name: 'My Courses', href: '/student/courses', icon: BookOpen },
        { name: 'Assignments', href: '/student/assignments', icon: ClipboardList },
        { name: 'AI Assistant', href: '/student/ai-chat', icon: Cpu },
    ];

    // Create section headers with items
    const communicationItems = [
        { name: 'Chat Rooms', href: '/student/chat', icon: MessageSquare },
        { name: 'Discussions', href: '/student/discussions', icon: MessageCircle },
    ];

    const learningItems = [
        { name: 'Certification Tests', href: '/student/tests', icon: Beaker },
        { name: 'Learning Roadmap', href: '/student/roadmap', icon: Compass },
        { name: 'Webinars', href: '/student/webinars', icon: Video },
    ];

    const achievementItems = [
        { name: 'Achievements', href: '/student/achievements', icon: Award },
        { name: 'Certificates', href: '/student/certificates', icon: Medal },
    ];

    const accountItems = [
        { name: 'Profile', href: '/student/profile', icon: User },
        {
            name: 'Notifications',
            href: '/student/notifications',
            icon: Bell,
            badge: studentData.notifications?.length || 0
        },
        { name: 'Settings', href: '/student/settings', icon: Settings },
        { name: 'Help & Support', href: '/student/help', icon: HelpCircle },
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    const renderSectionHeader = (title, isExpanded, onToggle) => (
        <button 
            onClick={onToggle}
            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
        >
            <span>{!isCollapsed && title}</span>
            {!isCollapsed && (isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
            ))}
        </button>
    );

    return (
        <div className={`fixed top-0 left-0 h-screen ${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 flex flex-col z-10`}>
            {/* Fixed Header */}
            <div className="p-4 border-b bg-blue-600 text-white flex items-center justify-between">
                {!isCollapsed && <h1 className="text-xl font-bold">Student Portal</h1>}
                <button 
                    onClick={toggleSidebar}
                    className="p-1 rounded hover:bg-blue-700 focus:outline-none transition-colors"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-5 w-5 text-white" />
                    ) : (
                        <ChevronLeft className="h-5 w-5 text-white" />
                    )}
                </button>
            </div>

            {/* Scrollable Navigation */}
            <div className="flex-1 overflow-y-auto">
                <nav className="p-4 space-y-1">
                    {/* Main navigation items */}
                    {mainNavigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 rounded-lg transition-colors ${
                                isActive(item.href)
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            title={isCollapsed ? item.name : ''}
                        >
                            <item.icon className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    ))}

                    {/* In Progress Courses */}
                    {inProgressCourses && inProgressCourses.length > 0 && (
                        <div className="mt-6">
                            {!isCollapsed && (
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                                    CURRENT COURSES
                                </div>
                            )}
                            <div className="space-y-1 mt-1">
                                {inProgressCourses.slice(0, 5).map(course => (
                                    <Link
                                        key={course._id}
                                        to={`/student/courses/${course._id}`}
                                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 rounded-lg transition-colors ${
                                            isActive(`/student/courses/${course._id}`)
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                        title={isCollapsed ? course.title : ''}
                                    >
                                        <BookOpen className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
                                        {!isCollapsed && (
                                            <div className="flex-1 truncate">
                                                <span className="block truncate">{course.title}</span>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className="h-1.5 rounded-full bg-blue-500"
                                                        style={{ width: `${course.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Communication Section */}
                    <div className="mt-6">
                        {renderSectionHeader(
                            'Communication', 
                            expandedSections.communication, 
                            () => toggleSection('communication')
                        )}
                        
                        {(expandedSections.communication || isCollapsed) && (
                            <div className={`${!isCollapsed && 'ml-2'} mt-1 space-y-1`}>
                                {communicationItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 rounded-lg transition-colors ${
                                            isActive(item.href)
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <item.icon className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
                                        {!isCollapsed && <span>{item.name}</span>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Learning Section */}
                    <div className="mt-2">
                        {renderSectionHeader(
                            'Learning', 
                            expandedSections.learning, 
                            () => toggleSection('learning')
                        )}
                        
                        {(expandedSections.learning || isCollapsed) && (
                            <div className={`${!isCollapsed && 'ml-2'} mt-1 space-y-1`}>
                                {learningItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 rounded-lg transition-colors ${
                                            isActive(item.href)
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <item.icon className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
                                        {!isCollapsed && <span>{item.name}</span>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Achievements Section */}
                    <div className="mt-2">
                        {renderSectionHeader(
                            'Achievements', 
                            expandedSections.achievements, 
                            () => toggleSection('achievements')
                        )}
                        
                        {(expandedSections.achievements || isCollapsed) && (
                            <div className={`${!isCollapsed && 'ml-2'} mt-1 space-y-1`}>
                                {achievementItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 rounded-lg transition-colors ${
                                            isActive(item.href)
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <item.icon className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
                                        {!isCollapsed && <span>{item.name}</span>}
                            </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            {/* Fixed Profile & Logout */}
            <div className="p-4 border-t bg-white relative" ref={profileDropdownRef}>
                <button 
                    onClick={toggleProfileDropdown}
                    className="w-full text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                    {!isCollapsed ? (
                <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <span className="text-sm font-medium">
                            {studentData.profile?.firstName?.[0] || ''}
                            {studentData.profile?.lastName?.[0] || ''}
                        </span>
                    </div>
                    <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">
                            {studentData.profile?.firstName || ''} {studentData.profile?.lastName || ''}
                        </p>
                                <p className="text-xs text-gray-500">{studentData.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <span className="text-xs font-medium">
                                    {studentData.profile?.firstName?.[0] || ''}
                                </span>
                            </div>
                        </div>
                    )}
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && !isCollapsed && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden z-20 animate-in fade-in-50 duration-100">
                        <div className="py-2">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 mb-1 bg-gray-50">
                                Account
                            </div>
                            
                            {/* Account Items */}
                            {accountItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                    onClick={() => setIsProfileDropdownOpen(false)}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                    {item.badge && item.badge > 0 && (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                            
                            {/* Logout */}
                            <div className="mt-1 pt-1 border-t border-gray-200">
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Arrow pointer */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b border-gray-200 bg-white"></div>
                    </div>
                )}
                
                {/* Only show logout button when sidebar is collapsed */}
                {isCollapsed && (
                    <button
                        onClick={logout}
                        className="mt-2 p-2 flex justify-center text-red-600 hover:bg-red-50 rounded-full"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default StudentSidebar; 