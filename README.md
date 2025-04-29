# Connectify Like Minds

A comprehensive learning platform with role-based access control for students and administrators, designed to facilitate seamless learning experiences and community engagement.

## 🚀 Features

### Core Features
- **Role-based Access Control**
  - Admin dashboard with comprehensive analytics
  - Student learning interface
  - Secure authentication system

### Learning Management
- Course management system with progress tracking
- Interactive learning materials
- Assignment submission and grading
- Certification tests with online proctoring
- Learning analytics and insights

### Community Features
- Real-time chat and discussions
- Study groups and collaboration tools
- AI-powered chatbot assistance
- User management system

## 🛠️ Tech Stack

### Frontend
- React.js with Vite
- TailwindCSS for styling
- Material-UI components
- React Query for data fetching
- Socket.io for real-time features

### Backend
- Node.js with Express.js
- MongoDB for database
- JWT for authentication
- Socket.io for real-time communication
- Multer for file uploads

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ravikumar1032/Connectify.git
   cd Connectify
   ```

2. **Install Dependencies**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Backend Configuration
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   
   # Frontend Configuration
   VITE_API_URL=http://localhost:5000
   ```

4. **Start Development Servers**
   ```bash
   # Run both frontend and backend
   npm run dev

   # Or run separately
   npm run server  # Backend
   npm run client  # Frontend
   ```

## 📁 Project Structure

```
Connectify Like Minds/
├── backend/                    # Backend server
│   ├── controllers/           # Route controllers
│   │   ├── adminController.js
│   │   ├── studentController.js
│   │   └── ...
│   ├── models/                # Database models
│   │   ├── admin/
│   │   ├── student/
│   │   └── common/
│   ├── routes/                # API routes
│   │   ├── admin.js
│   │   ├── student.js
│   │   └── ...
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js
│   │   └── ...
│   ├── utils/                 # Utility functions
│   ├── scripts/               # Utility scripts
│   ├── src/                   # Source files
│   ├── uploads/               # File uploads directory
│   ├── data/                  # Data files
│   ├── server.js              # Server entry point
│   ├── app.js                 # Express app configuration
│   └── package.json
├── frontend/                  # Frontend application
│   ├── public/                # Static files
│   │   ├── index.html
│   │   └── ...
│   ├── src/                   # Source files
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   │   ├── admin/        # Admin pages
│   │   │   ├── student/      # Student pages
│   │   │   └── ...
│   │   ├── context/          # React context
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utility functions
│   │   ├── assets/           # Static assets
│   │   ├── services/         # API services
│   │   ├── App.jsx           # Main App component
│   │   └── main.jsx          # Entry point
│   ├── node_modules/         # Dependencies
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── postcss.config.js     # PostCSS configuration
│   └── INSTALL.md            # Installation guide
├── scripts/                   # Project scripts
├── .gitignore                # Git ignore file
├── README.md                 # Project documentation
└── package.json              # Root package.json
```

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev        # Run both frontend and backend
npm run server    # Run backend only
npm run client    # Run frontend only

# Production
npm run build     # Build frontend
npm run start     # Start production server

# Testing
npm run test      # Run tests
npm run lint      # Run linter
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@connectify.com or join our Slack channel. # Connectify
