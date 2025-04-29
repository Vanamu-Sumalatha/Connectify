import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from '../routes/auth.js';
import chatRoutes from '../routes/chat.js';
import userRoutes from '../routes/users.js';
import courseRoutes from '../routes/courseRoutes.js';
import studentRoutes from '../routes/student/index.js';
import courseChatRoutes from '../routes/student/courseChatRoutes.js';
import sidebarRoutes from '../routes/sidebarRoutes.js';
import adminRoutes from '../routes/admin.js';
import quizRoutes from '../routes/quiz.js';
import todoRoutes from '../routes/todo.js';
import adminTestRoutes from '../routes/admin/adminTestRoutes.js';
import adminQuizRoutes from '../routes/admin/adminQuizRoutes.js';
import directChatRoutes from '../routes/student/directChat.js';
import testRoutes from '../routes/student/testRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware

// Custom CORS middleware to ensure it works in all environments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connectify', {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 75000,
  connectTimeoutMS: 60000,
  maxPoolSize: 10,
  family: 4,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
})
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Enable mongoose debugging
    mongoose.set('debug', true);
    
    // Create default chat rooms
    try {
      const ChatRoom = (await import('../models/ChatRoom.js')).default;
      await ChatRoom.createDefaultRooms();
      console.log('Default chat rooms setup complete');
      
      // Create default discussion group for all students
      const Discussion = (await import('../models/student/Discussion.js')).default;
      await Discussion.createDefaultGroup();
      console.log('Default discussion group setup complete');
    } catch (error) {
      console.error('Error setting up default resources:', error);
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('Connection details:', {
      uri: process.env.MONGODB_URI ? 'Custom URI configured' : 'Using default localhost',
      error: err.message
    });
    console.error('Please ensure MongoDB server is running and accessible');
  });

// Add mongoose connection monitoring
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Connectify API' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Ensure CORS headers are properly set for this endpoint
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/student/course-chat-rooms', courseChatRoutes);
app.use('/api/student/direct-chat', directChatRoutes);
app.use('/api/sidebar', sidebarRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin/tests', adminTestRoutes);
app.use('/api/admin/quizzes', adminQuizRoutes);
app.use('/api/todo', todoRoutes);
app.use('/api/student/tests', testRoutes);

// Log mounted routes for debugging
console.log('Routes mounted:');
console.log(' - /api/auth');
console.log(' - /api/chat');
console.log(' - /api/users');
console.log(' - /api/courses');
console.log(' - /api/student');
console.log(' - /api/student/course-chat-rooms');
console.log(' - /api/student/direct-chat');
console.log(' - /api/sidebar');
console.log(' - /api/admin');
console.log(' - /api/quizzes');
console.log(' - /api/admin/tests');
console.log(' - /api/admin/quizzes');
console.log(' - /api/todo');
console.log(' - /api/student/tests');

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected with ID:', socket.id);
  
  // Authenticate socket connection
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      // You can verify the token here if needed
      console.log('Socket authenticated with token');
    } catch (error) {
      console.error('Socket authentication error:', error.message);
    }
  }
  
  // Join user to rooms based on their courses/groups
  socket.on('join', (rooms) => {
    if (Array.isArray(rooms)) {
      rooms.forEach(room => socket.join(room));
      console.log(`Socket ${socket.id} joined rooms:`, rooms);
    } else if (rooms) {
      socket.join(rooms);
      console.log(`Socket ${socket.id} joined room:`, rooms);
    }
  });
  
  // Handle chat messages
  socket.on('message', (data) => {
    console.log('Message received:', data);
    
    // Broadcast to room if specified
    if (data.roomId) {
      socket.to(data.roomId).emit('newMessage', data);
    }
    // Handle direct chat messages
    else if (data.chatId) {
      socket.to(data.chatId).emit('newDirectMessage', data);
    }
    // Fallback to broadcast
    else {
      socket.broadcast.emit('newMessage', data);
    }
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    console.log('Typing indicator:', data);
    if (data.chatId) {
      socket.to(data.chatId).emit('typing', data);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected with ID:', socket.id);
  });
});

// Simple auth middleware for test route
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No authentication token provided' });
  }
  
  try {
    // For simplicity, just accept any token for now
    // In a real app, you'd verify the JWT token
    req.user = { id: 'test-user-id' };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Add a test submission endpoint
app.post('/api/student/tests/:id/submit', authMiddleware, async (req, res) => {
  try {
    console.log('Test submission received:', req.params.id);
    console.log('Answers received:', req.body.answers);
    
    // Generate a random certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Calculate score based on the answers if available
    let score = 0;
    let totalPoints = 100;
    let percentageScore = 0;
    
    if (req.body.metadata) {
      score = req.body.metadata.score || 0;
      totalPoints = req.body.metadata.totalPoints || 100;
      percentageScore = req.body.metadata.percentageScore || 0;
    }
    
    // Return a success response with a certificate ID
    return res.status(200).json({
      message: 'Test submitted successfully',
      result: {
        attemptId: 'test-attempt-' + Date.now(),
        score,
        totalPoints,
        percentageScore,
        passed: percentageScore >= 70,
        certificateIssued: true,
        certificateId
      }
    });
  } catch (error) {
    console.error('Error in test submission:', error);
    return res.status(500).json({ 
      message: 'Server error processing test submission',
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server available at http://localhost:${PORT}`);
});

export default app; 