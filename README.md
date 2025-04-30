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

## 📸 Screenshots

![Screenshot 1](./Screenshot/Screenshot%20(149).png)
![Screenshot 2](./Screenshot/Screenshot%20(148).png)
![Screenshot 3](./Screenshot/Screenshot%20(147).png)
![Screenshot 4](./Screenshot/Screenshot%20(146).png)
![Screenshot 5](./Screenshot/Screenshot%20(145).png)
![Screenshot 6](./Screenshot/Screenshot%20(144).png)
![Screenshot 7](./Screenshot/Screenshot%20(143).png)
![Screenshot 8](./Screenshot/Screenshot%20(142).png)
![Screenshot 9](./Screenshot/Screenshot%20(141).png)
![Screenshot 10](./Screenshot/Screenshot%20(140).png)
![Screenshot 11](./Screenshot/Screenshot%20(139).png)
![Screenshot 12](./Screenshot/Screenshot%20(138).png)
![Screenshot 13](./Screenshot/Screenshot%20(137).png)
![Screenshot 14](./Screenshot/Screenshot%20(136).png)
![Screenshot 15](./Screenshot/Screenshot%20(135).png)
![Screenshot 16](./Screenshot/Screenshot%20(134).png)
![Screenshot 17](./Screenshot/Screenshot%20(133).png)
![Screenshot 18](./Screenshot/Screenshot%20(132).png)
![Screenshot 19](./Screenshot/Screenshot%20(131).png)
![Screenshot 20](./Screenshot/Screenshot%20(130).png)
![Screenshot 21](./Screenshot/Screenshot%20(128).png)
![Screenshot 22](./Screenshot/Screenshot%20(127).png)
![Screenshot 23](./Screenshot/Screenshot%20(125).png)
![Screenshot 24](./Screenshot/Screenshot%20(123).png)
![Screenshot 25](./Screenshot/Screenshot%20(121).png)
![Screenshot 26](./Screenshot/Screenshot%20(120).png)
![Screenshot 27](./Screenshot/Screenshot%20(119).png)
![Screenshot 28](./Screenshot/Screenshot%20(117).png)
![Screenshot 29](./Screenshot/Screenshot%20(116).png)
![Screenshot 30](./Screenshot/Screenshot%20(115).png)
![Screenshot 31](./Screenshot/Screenshot%20(114).png)
![Screenshot 32](./Screenshot/Screenshot%20(113).png)
![Screenshot 33](./Screenshot/Screenshot%20(112).png)
![Screenshot 34](./Screenshot/Screenshot%20(111).png)
![Screenshot 35](./Screenshot/Screenshot%20(110).png)
![Screenshot 36](./Screenshot/Screenshot%20(109).png)
![Screenshot 37](./Screenshot/Screenshot%20(108).png)
![Screenshot 38](./Screenshot/Screenshot%20(107).png)
![Screenshot 39](./Screenshot/Screenshot%20(105).png)
![Screenshot 40](./Screenshot/Screenshot%20(104).png)
![Screenshot 41](./Screenshot/Screenshot%20(103).png)
![Screenshot 42](./Screenshot/Screenshot%20(102).png)
![Screenshot 43](./Screenshot/Screenshot%20(101).png)
![Screenshot 44](./Screenshot/Screenshot%20(100).png)
![Screenshot 45](./Screenshot/Screenshot%20(99).png)
![Screenshot 46](./Screenshot/Screenshot%20(98).png)
![Screenshot 47](./Screenshot/Screenshot%20(97).png)
![Screenshot 48](./Screenshot/Screenshot%20(96).png)
![Screenshot 49](./Screenshot/Screenshot%20(93).png)
![Screenshot 50](./Screenshot/Screenshot%20(92).png)
![Screenshot 51](./Screenshot/Screenshot%20(91).png)
![Screenshot 52](./Screenshot/Screenshot%20(90).png)
![Screenshot 53](./Screenshot/Screenshot%20(89).png)
![Screenshot 54](./Screenshot/Screenshot%20(88).png)
![Screenshot 55](./Screenshot/Screenshot%20(87).png)
![Screenshot 56](./Screenshot/Screenshot%20(86).png)
![Screenshot 57](./Screenshot/Screenshot%20(85).png)

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
   cd backend
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
   npm run dev  # Backend
   npm run dev  # Frontend
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

npm run dev    # Run backend only
npm run dev    # Run frontend only

# Production
npm run build     # Build frontend
npm run start     # Start production server

```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email ravikumar1015@gmail.com or join our Slack channel. # Connectify
