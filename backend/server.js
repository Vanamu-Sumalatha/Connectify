// Import the application from src/index.js
import app from './src/index.js';

// Import routes
import studentQuizRoutes from './routes/student/quizRoutes.js';
import quizRoutes from './routes/quiz.js';
import chatRoutes from './routes/chat.js';
// Only import if we need to mount it differently
// import courseChatRoutes from './routes/student/courseChatRoutes.js';

// This file serves as the entry point referenced in package.json
// All application logic is in src/index.js 

// Use routes
app.use('/api/student/quizzes', studentQuizRoutes); 
app.use('/api/chats', chatRoutes);

// Prevent double-mounting the course chat routes since they're already mounted in index.js
// and that's causing conflicts between the two different implementations
// app.use('/api/student/course-chat-rooms', courseChatRoutes);

// Mount the same routes at the alternate path for frontend compatibility
app.use('/api/quiz/student', quizRoutes);

// Add a diagnostic endpoint to show all routes
app.get('/api/routes', (req, res) => {
  console.log('Diagnostic endpoint accessed');
  
  const routes = [];
  
  // Get routes from the Express app
  app._router.stack.forEach(middleware => {
    if (middleware.route) { // routes registered directly on the app
      routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') { // router middleware
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const path = handler.route.path;
          const method = Object.keys(handler.route.methods)[0].toUpperCase();
          routes.push(`${method} ${middleware.regexp} ${path}`);
        }
      });
    }
  });
  
  res.json({
    routes,
    message: 'Routes diagnostic information',
    timestamp: new Date().toISOString()
  });
});

// Don't try to start the server if it's already listening
// The server is likely already started in src/index.js
console.log('Routes mounted, server should be running on port 5000'); 