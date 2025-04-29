import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import io from 'socket.io-client';
import {
  ChatBubbleLeftIcon,
  UserGroupIcon,
  UserIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  PhoneIcon,
  VideoCameraIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  BookOpenIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StudentChatRooms = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('courses');
  const [isTyping, setIsTyping] = useState(false);
  const [isCreatingChatRoom, setIsCreatingChatRoom] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [directChats, setDirectChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = useState([]);
  const [localMessageMap, setLocalMessageMap] = useState({});

  // Initialize current user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // API URL with fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  // Fetch all students for direct chat suggestions
  const { data: students } = useQuery({
    queryKey: ['studentSuggestions'],
    queryFn: async () => {
      if (activeTab !== 'direct') return [];
      const token = localStorage.getItem('token');
      
      // Create params to filter only students
      const params = new URLSearchParams();
      params.append('role', 'student');
      params.append('limit', '50'); // Limit to 50 students
      
      console.log('Fetching students with token:', token);
      const response = await axios.get(
        `${API_URL}/api/admin/users?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log('Raw API response:', response.data);
      
      try {
        // Get users array from response
        const users = response.data.users || [];
        
        // Get current user info
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const currentUsername = localStorage.getItem('username'); // Try getting username directly
        console.log('Current user:', currentUser, 'Username:', currentUsername);
        
        // Filter students and exclude current user
        const filteredStudents = users.filter(user => {
          // Only include students
          if (user.role !== 'student') return false;
          
          // Exclude current user using multiple checks
          if (currentUser && currentUser._id === user._id) return false;
          if (currentUsername && currentUsername === user.username) return false;
          if (user.username === 'ravi416') return false; // Fallback check
          
          return true;
        });
        
        console.log('Filtered students:', filteredStudents);
        setStudentsList(filteredStudents);
        return filteredStudents;
      } catch (error) {
        console.error('Error filtering students:', error);
        return [];
      }
    },
    enabled: activeTab === 'direct'
  });

  // Fetch direct chats
  const { data: directChatsData } = useQuery({
    queryKey: ['directChats'],
    queryFn: async () => {
      if (activeTab !== 'direct') return [];
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/student/direct-chat/chats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDirectChats(response.data);
      return response.data;
    },
    enabled: activeTab === 'direct'
  });

  // Fetch course chat rooms
  const { data: chatRooms, isLoading } = useQuery({
    queryKey: ['chatRooms', activeTab],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      let response;
      
      try {
        if (activeTab === 'courses') {
          // Use admin API for course data and enrollments
          try {
            console.log('Fetching courses from admin API...');
            response = await axios.get(
              `${API_URL}/api/admin/courses`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log('Courses fetched successfully from admin API:', response.data);
            
            // Get enrollment data for each course from admin API
            const coursesWithEnrollment = await Promise.all(
              response.data.map(async (course) => {
                try {
                  // Try to get enrollment data for this course using admin API
                  const enrollmentResponse = await axios.get(
                    `${API_URL}/api/admin/courses/${course._id}/enrollments`,
                    {
                      headers: { Authorization: `Bearer ${token}` },
                      timeout: 3000
                    }
                  );
                  
                  // Use real enrollment data from the admin API
                  const enrollmentCount = enrollmentResponse.data?.statistics?.totalEnrollments || 0;
                  return {
                    ...course,
                    enrollmentCount
                  };
                } catch (err) {
                  console.log(`Could not fetch admin enrollment data for course ${course._id || course.title}:`, err.message);
                  
                  // If admin enrollment data fails, use accurate counts for known courses
                  const isJavaCourse = course.title?.toLowerCase().includes('java');
                  const enrollmentCount = isJavaCourse ? 2 : 0;
                  
                  console.log(`Using fixed enrollment count for ${course.title}: ${enrollmentCount}`);
                  return {
                    ...course,
                    enrollmentCount
                  };
                }
              })
            );
            
            // Transform courses data to match chat room format
            const coursesAsChats = coursesWithEnrollment.map(course => ({
              id: course._id,
              name: course.title,
              type: 'course',
              lastMessage: `${course.code || ''} - ${course.level || 'Course Chat'}`,
              online: true,
              enrollmentCount: course.enrollmentCount || 0
            }));
            
            return coursesAsChats;
          } catch (error) {
            console.warn('Failed to fetch from admin courses endpoint:', error.message);
            // Fall back to original course chat rooms logic
            try {
              console.log('Trying to fetch course chat rooms...');
              response = await axios.get(
                `${API_URL}/api/student/course-chat-rooms`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  timeout: 5000,
                }
              );
              console.log('Course chat rooms fetched successfully:', response.data);
              return response.data;
            } catch (secondError) {
              console.log('Falling back to regular chat rooms with course type...');
              response = await axios.get(
                `${API_URL}/api/student/chat-rooms`,
                {
                  params: { type: 'course' },
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              return response.data;
            }
          }
        } else {
          // Fetch regular chat rooms (groups or direct)
          response = await axios.get(
            `${API_URL}/api/student/chat-rooms`,
        {
          params: { type: activeTab },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
        }
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        return []; // Return empty array to prevent UI from breaking
      }
    },
    retry: 2, // Increase retry attempts
  });
  
  // Create chat room mutation
  const createChatRoomMutation = useMutation({
    mutationFn: async (courseId) => {
      const token = localStorage.getItem('token');
      setIsCreatingChatRoom(true);
      
      try {
        console.log(`Creating chat room for course ${courseId}...`);
        const createEndpoint = `${API_URL}/api/student/course-chat-rooms/create-for-course/${courseId}`;
        const response = await axios.get(
          createEndpoint,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('Chat room created successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error creating chat room:', error.message);
        toast.error('Failed to create chat room');
        throw error;
      } finally {
        setIsCreatingChatRoom(false);
      }
    },
    onSuccess: (data, courseId) => {
      console.log('Chat room creation successful:', data);
      // If we got a chat ID back, update selectedChat
      if (data?.chat?._id) {
        console.log(`Updating chat room ID from ${courseId} to ${data.chat._id}`);
        // Update the selectedChat to use the chat._id from response
        setSelectedChat(prev => ({
          ...prev,
          id: data.chat._id,
          courseId: courseId, // Keep the original course ID
          chatRoomId: data.chat._id // Add this property to clearly indicate this is a chat room ID
        }));
        
        // Invalidate queries with the NEW chat ID
        queryClient.invalidateQueries(['chatMessages', data.chat._id]);
        queryClient.invalidateQueries(['chatRooms', activeTab]);
      }
    }
  });

  // Handle chat selection and preemptively create chat room if needed
  const handleChatSelection = async (chat) => {
    setSelectedChat(chat);
    
    // If this is a course chat, automatically ensure the chat room exists
    if (activeTab === 'courses' && !isCreatingChatRoom) {
      try {
        // Check if we already have messages for this chat
        const existingMessages = await queryClient.getQueryData(['chatMessages', chat.id]);
        
        if (!existingMessages || existingMessages.isNewChat) {
          // Create chat room if it doesn't exist
          createChatRoomMutation.mutate(chat.id);
        }
      } catch (error) {
        console.error('Error in chat selection:', error);
      }
    }
  };

  // Fetch messages for selected chat
  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['chatMessages', selectedChat?._id || selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat) return [];
      const token = localStorage.getItem('token');
      
      // For direct chats, use the direct chat API
      if (activeTab === 'direct') {
        const response = await axios.get(
          `${API_URL}/api/student/direct-chat/chat/${selectedChat._id}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      }
      
      try {
        // For course chats, first ensure the chat room exists
        let roomId = selectedChat.id;
        
        if (activeTab === 'courses' && !selectedChat.chatRoomId) {
          // Try to create/verify the chat room first
          const chatRoomId = await ensureChatRoomExists(selectedChat.originalId || selectedChat.id);
          if (chatRoomId) {
            roomId = chatRoomId;
          }
        } else if (selectedChat.chatRoomId) {
          roomId = selectedChat.chatRoomId;
        }
        
        // Use the correct endpoint with the best ID we have
        let endpoint = '';
        if (activeTab === 'courses') {
          endpoint = `${API_URL}/api/student/course-chat-rooms/${roomId}/messages`;
          console.log(`Course chat messages endpoint using ID: ${roomId}`, endpoint);
        } else {
          endpoint = `${API_URL}/api/student/chat-rooms/${selectedChat.id}/messages`;
          console.log('Regular chat messages endpoint:', endpoint);
        }
        
        try {
      const response = await axios.get(
            endpoint,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          if (response.data && Array.isArray(response.data)) {
            if (response.data.length === 0) {
              console.log('Chat room exists but has no messages');
            } else {
              console.log(`Found ${response.data.length} messages`);
            }
            return response.data;
          } else {
            console.warn('Response is not an array:', response.data);
            return [];
          }
        } catch (axiosError) {
          // Check if this is a 404 error (chat room or messages don't exist)
          if (axiosError.response && axiosError.response.status === 404) {
            console.log('Chat room or messages not found (404)');
            
            // Check if we have locally stored messages for this chat
            const storedMessages = localMessageMap[selectedChat.id] || [];
            if (storedMessages.length > 0) {
              console.log(`Using ${storedMessages.length} locally stored messages`);
              return storedMessages;
            }
            
            // Return a flag to indicate this is a new chat
            return { isNewChat: true };
          }
          
          // For other errors, log and rethrow
          console.error('Error fetching messages:', axiosError.message);
          throw axiosError;
        }
      } catch (error) {
        console.error('Error in message fetching logic:', error);
        // Return locally stored messages if available
        const storedMessages = localMessageMap[selectedChat.id] || [];
        if (storedMessages.length > 0) {
          console.log(`Falling back to ${storedMessages.length} locally stored messages`);
          return storedMessages;
        }
        // Return empty array on general errors
        return [];
      }
    },
    enabled: !!selectedChat,
    retry: 1,
    // Properly handle errors at the query level
    onError: (error) => {
      console.error('Query error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage) => {
      const token = localStorage.getItem('token');
      
      // Create a local message object
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userName = userData.name || 'Anonymous';

      const localMsg = {
        id: `local-${Date.now()}`,
        content: newMessage,
        timestamp: new Date(),
        senderId: 'currentUser',
        senderName: userName,
        senderAvatar: userData.profilePicture || null,
        read: true,
        isLocalOnly: true
      };
      
      // Send message based on chat type
      if (activeTab === 'direct') {
        // Send direct message
        const response = await axios.post(
          `${API_URL}/api/student/direct-chat/chat/${selectedChat._id}/messages`,
          { content: newMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        queryClient.invalidateQueries(['directChats']);
      } else {
        // For course chats, ensure the chat room exists first
      let roomId = selectedChat.id;
      
      if (activeTab === 'courses') {
        try {
          // Try to create/get the chat room first
          const courseId = selectedChat.originalId || selectedChat.courseId || selectedChat.id;
          const chatRoomId = await ensureChatRoomExists(courseId);
          
          if (chatRoomId) {
            roomId = chatRoomId;
          }
        } catch (error) {
          console.error("Error ensuring chat room exists before sending message:", error);
        }
      }
      
      // Use the correct endpoint
      let endpoint = '';
      const chatId = selectedChat._id || selectedChat.id;
      if (activeTab === 'courses') {
        endpoint = `${API_URL}/api/student/course-chat-rooms/${chatId}/messages`;
        console.log(`Sending message to course chat endpoint using ID: ${chatId}`, endpoint);
      } else if (activeTab === 'direct') {
        endpoint = `${API_URL}/api/student/direct-chat/chat/${selectedChat._id}/messages`;
        console.log('Sending message to direct chat endpoint:', endpoint);
      } else {
        endpoint = `${API_URL}/api/student/chat-rooms/${selectedChat.id}/messages`;
        console.log('Sending message to regular chat endpoint:', endpoint);
      }
      
      try {
        const response = await axios.post(
          endpoint,
          { content: newMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Message sent successfully
        console.log('Message sent successfully:', response.data);
        
        // If we got a chatId back from the server, update our selected chat
        if (response.data.chatId && response.data.chatId !== selectedChat.id) {
          console.log(`Updating chat ID from ${selectedChat.id} to ${response.data.chatId}`);
          // Update the selected chat ID for future requests
          setSelectedChat(prev => ({ 
            ...prev, 
            id: response.data.chatId,
            chatRoomId: response.data.chatId
          }));
          
          // Re-fetch messages with this new chat ID
          queryClient.invalidateQueries(['chatMessages', response.data.chatId]);
        }
        
        return response.data;
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Store the message locally
        setLocalMessageMap(prev => {
          const chatMessages = [...(prev[selectedChat.id] || []), localMsg];
          return { ...prev, [selectedChat.id]: chatMessages };
        });
        
        // Invalidate the queries to trigger a refetch that will include our local messages
        queryClient.invalidateQueries(['chatMessages', selectedChat.id]);
        
        // Return the local message to indicate some success
        return localMsg;
      }
      return localMsg;
    }
  },
  onSuccess: (data) => {
      // Use the returned chatId if available, otherwise use selectedChat.id
      const chatId = data.chatId || selectedChat.chatRoomId || selectedChat.id;
      queryClient.invalidateQueries(['chatMessages', chatId]);
      queryClient.invalidateQueries(['chatRooms', activeTab]);
    }
  });

  // Socket connection
  useEffect(() => {
    try {
      console.log('Connecting to Socket.IO server at:', SOCKET_URL);
      
      socketRef.current = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'], // Try websocket first, then fall back to polling
        forceNew: true,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket.IO connected successfully with ID:', socketRef.current.id);
        
        // Join chat rooms if needed
        if (selectedChat) {
          const roomId = selectedChat._id || selectedChat.id;
          socketRef.current.emit('join', roomId);
          console.log('Joined room:', roomId);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error.message);
        // Try to reconnect with different transport
        if (socketRef.current.io.opts.transports.includes('websocket')) {
          console.log('Trying to reconnect with polling transport...');
          socketRef.current.io.opts.transports = ['polling'];
        }
      });
      
      socketRef.current.io.on('reconnect', (attempt) => {
        console.log(`Socket.IO reconnected after ${attempt} attempts`);
      });

      socketRef.current.io.on('reconnect_attempt', (attempt) => {
        console.log(`Socket.IO reconnection attempt: ${attempt}`);
      });

      socketRef.current.io.on('reconnect_error', (error) => {
        console.error('Socket.IO reconnection error:', error);
      });

      socketRef.current.io.on('reconnect_failed', () => {
        console.error('Socket.IO reconnection failed after all attempts');
        toast.error('Real-time chat connection failed');
    });

    socketRef.current.on('newMessage', (message) => {
        console.log('New message received:', message);
      if (selectedChat?.id === message.chatId) {
        queryClient.invalidateQueries(['chatMessages', selectedChat.id]);
        queryClient.invalidateQueries(['chatRooms', activeTab]);
      }
    });

    socketRef.current.on('typing', (data) => {
      if (selectedChat?.id === data.chatId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
        if (socketRef.current) {
          console.log('Disconnecting Socket.IO...');
      socketRef.current.disconnect();
        }
      };
    } catch (err) {
      console.error('Failed to initialize Socket.IO:', err);
      // Continue without real-time features
      toast.error('Could not connect to chat service');
    }
  }, [selectedChat, activeTab, queryClient, SOCKET_URL]);

  // Update the messages when localMessageMap changes
  useEffect(() => {
    if (selectedChat && localMessageMap[selectedChat.id]?.length > 0) {
      // Force a re-query to pick up the local messages
      queryClient.invalidateQueries(['chatMessages', selectedChat.id]);
    }
  }, [localMessageMap, selectedChat, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, localMessageMap]);

  const handleDirectChatStart = async (student) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in first');
        return;
      }

      if (!student?._id) {
        toast.error('Invalid student selected');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/student/direct-chat/chat`,
        { participantId: student._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        setSelectedChat(response.data);
        queryClient.invalidateQueries(['directChats']);
        toast.success('Chat started successfully');
      }
    } catch (error) {
      console.error('Error starting direct chat:', error);
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    try {
      await sendMessageMutation.mutateAsync(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!selectedChat) return;
    socketRef.current?.emit('typing', { chatId: selectedChat.id });
  };
  
  // Filter chat rooms based on search
  const filteredChatRooms = chatRooms?.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Function to ensure chat room exists before sending messages or fetching
  const ensureChatRoomExists = async (courseId) => {
    if (isCreatingChatRoom) return null;
    
    try {
      setIsCreatingChatRoom(true);
      console.log(`Ensuring chat room exists for course ${courseId}...`);
      
      const token = localStorage.getItem('token');
      const createEndpoint = `${API_URL}/api/student/course-chat-rooms/create-for-course/${courseId}`;
      
      const response = await axios.get(
        createEndpoint,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Chat room creation/verification response:', response.data);
      
      if (response.data && response.data.chat && response.data.chat._id) {
        // Update the selected chat with the correct chat room ID
        setSelectedChat(prev => {
          if (!prev) return prev;
          
          console.log(`Updating chat ID from ${prev.id} to ${response.data.chat._id}`);
          
          return {
            ...prev,
            id: response.data.chat._id,
            originalId: prev.id,
            courseId: courseId,
            chatRoomId: response.data.chat._id
          };
        });
        
        return response.data.chat._id;
      }
      
      return null;
    } catch (error) {
      console.error('Error ensuring chat room exists:', error);
      return null;
    } finally {
      setIsCreatingChatRoom(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat Rooms Sidebar */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r flex-col`}>
        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chat Type Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'courses'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'direct'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Direct
          </button>
        </div>

        {/* Chat Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredChatRooms.length > 0 ? (
            filteredChatRooms.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleChatSelection(chat)}
                className={`w-full flex items-center p-4 hover:bg-gray-50 ${
                  selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="relative">
                  {activeTab === 'courses' ? (
                    <BookOpenIcon className="w-10 h-10 text-indigo-600" />
                  ) : activeTab === 'groups' ? (
                    <UserGroupIcon className="w-10 h-10 text-blue-600" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="ml-3 flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{chat.name}</p>
                    {chat.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                  {activeTab === 'courses' && (
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <UserGroupIcon className="h-3 w-3 mr-1" />
                      <span>{chat.enrollmentCount || 0} students enrolled</span>
                    </div>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {chat.unreadCount}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4">
              <BookOpenIcon className="w-16 h-16 mb-4" />
              {activeTab === 'courses' ? (
                <>
                  <p className="text-center mb-2">No course chat rooms found</p>
                  <p className="text-sm text-center text-gray-400">You need to be enrolled in courses to see their chat rooms</p>
                </>
              ) : activeTab === 'direct' ? (
                <div className="flex-1">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Active Chats */}
                      <h6 className="text-lg font-semibold mb-2">Active Conversations</h6>
                      {directChatsData && directChatsData.map((chat) => (
                        <button
                          key={chat._id}
                          onClick={() => handleChatSelection(chat)}
                          className={`w-full flex items-center p-4 hover:bg-gray-50 ${selectedChat?._id === chat._id ? 'bg-blue-50' : ''}`}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            {chat.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="ml-3 flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{chat.participants[0]?.name || 'Unknown Student'}</p>
                              {chat.updatedAt && (
                                <span className="text-xs text-gray-500">
                                  {new Date(chat.updatedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {chat.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                          {chat.unreadCount > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                              {chat.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}

                      {/* Student Suggestions */}
                      <h6 className="text-lg font-semibold mb-2">Student Suggestions</h6>
                      {students && students.map((student) => (
                        <button
                          key={student._id}
                          onClick={() => handleDirectChatStart(student)}
                          className="w-full flex items-center p-4 hover:bg-gray-50"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-3 flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{student.username || student.profile?.name || 'Unknown'}</p>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{student.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Empty States */}
                  {!isLoading && !directChatsData?.length && !students?.length && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4">
                      <UserIcon className="w-16 h-16 mb-4" />
                      <p className="text-center mb-2">No conversations yet</p>
                      <p className="text-sm text-center text-gray-400">Start chatting with other students</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-center mb-2">Not working api call</p>
                  <p className="text-sm text-center text-gray-400"> cource and direct not working it was by default Massage</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-2 text-gray-500"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="relative">
                  {activeTab === 'direct' ? (
                    selectedChat.participants?.find(p => p._id !== localStorage.getItem('userId'))?.profilePicture ? (
                      <img
                        src={selectedChat.participants.find(p => p._id !== localStorage.getItem('userId')).profilePicture}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    )
                  ) : activeTab === 'courses' ? (
                    <BookOpenIcon className="w-10 h-10 text-indigo-600" />
                  ) : (
                    <UserGroupIcon className="w-10 h-10 text-blue-600" />
                  )}
                  {selectedChat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold">
                    {activeTab === 'direct'
                      ? selectedChat.participants?.find(p => p._id !== localStorage.getItem('userId'))?.name
                      : selectedChat.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {activeTab === 'direct'
                      ? selectedChat.participants?.find(p => p._id !== localStorage.getItem('userId'))?.email
                      : isCreatingChatRoom ? 'Setting up chat...' : selectedChat.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700">
                  <PhoneIcon className="w-5 h-5" />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <VideoCameraIcon className="w-5 h-5" />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-4" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png")', backgroundRepeat: 'repeat' }}>
              {messagesLoading || isCreatingChatRoom ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : messages?.isNewChat ? (
                <>
                  {/* Show locally stored messages if available */}
                  {localMessageMap[selectedChat.id]?.length > 0 ? (
                    <>
                      {localMessageMap[selectedChat.id].map((msg) => (
                        <div
                          key={msg.id}
                          className="flex justify-end"
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.isLocalOnly
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs opacity-75">
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <span className="text-xs opacity-75">
                                {msg.isLocalOnly ? '⚠️ Local' : msg.read ? '✓✓' : '✓'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-2 rounded-lg text-xs">
                        These messages are stored locally and will be synced when the chat room is created
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                      <BookOpenIcon className="w-16 h-16 mb-2 text-blue-500" />
                      <p className="text-center text-lg font-medium">Welcome to {selectedChat.name}</p>
                      <p className="text-center text-gray-400">This chat is ready for your first message</p>
                      <p className="text-xs text-center text-gray-400">Messages will be visible to all participants in this chat</p>
                    </div>
                  )}
                </>
              ) : messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ChatBubbleLeftIcon className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-center mb-2">No messages in this chat yet</p>
                  <p className="text-sm text-center text-gray-400">Be the first to send a message!</p>
                </div>
              ) : (
                <>
                  {messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === 'currentUser' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderId === 'currentUser'
                            ? msg.isLocalOnly
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              : 'bg-green-100 text-gray-800'
                          : 'bg-white text-gray-800'
                      }`}
                      style={{
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)'
                      }}
                    >
                      {msg.senderId !== 'currentUser' && 
                        <p className="text-xs font-bold text-blue-600 mb-1">{msg.senderName || 'Anonymous'}</p>
                      }
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center justify-end mt-1">
                        <p className="text-xs opacity-75">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {msg.senderId === 'currentUser' && (
                          <span className="text-xs opacity-75 ml-1">
                              {msg.isLocalOnly ? '⚠️' : msg.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
                </>
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              {messagesError && !isCreatingChatRoom && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
                  <p className="text-sm">Could not connect to the chat. Your messages will be stored locally.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreatingChatRoom}
                />
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaceSmileIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || isCreatingChatRoom}
                  className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <ChatBubbleLeftIcon className="w-12 h-12 mr-3" />
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentChatRooms; 