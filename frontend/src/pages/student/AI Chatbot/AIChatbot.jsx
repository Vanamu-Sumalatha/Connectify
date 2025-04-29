import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, Avatar, Divider, useTheme } from '@mui/material';
import { 
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Menu as MenuIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { ChatProvider } from './ChatContext';
import Chatbot from './Chatbot';
import { useStudent } from '../../../context/StudentContext';

const AIChatbot = () => {
  const theme = useTheme();
  const { student } = useStudent();
  const [fullscreen, setFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  
  // Function to toggle the chat history sidebar
  const toggleHistory = () => {
    setShowHistory(prev => !prev);
  };

  // Get the first letter of the student's name or use a default
  const getInitial = () => {
    if (student?.firstName) {
      return student.firstName.charAt(0).toUpperCase();
    } else if (student?.name) {
      return student.name.charAt(0).toUpperCase();
    }
    console.log("Student object:", student); // Debug log
    return 'U';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '90vh',
      overflow: 'hidden',
      maxWidth: '100%',
      bgcolor: '#ffffff',
    }}>
      {/* Header with dropdown that mimics Gemini UI */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: 2,
          py: 1,
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={toggleHistory} 
            sx={{ 
              mr: 1,
              color: '#8e44ad'
            }}
            size="small"
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 500, 
              color: '#8e44ad',
              fontSize: '18px',
              mr: 0.5 
            }}
          >
            AI Chatbot
          </Typography>
          <KeyboardArrowDownIcon fontSize="small" />
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: '#34a853',
            fontSize: '16px'
          }}
        >
          {getInitial()}
        </Avatar>
      </Box>

      <Paper
        sx={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          borderRadius: 0,
          overflow: 'hidden',
          boxShadow: 'none'
        }}
      >
        <ChatProvider>
          <Chatbot showHistory={showHistory} toggleHistory={toggleHistory} />
        </ChatProvider>
      </Paper>
    </Box>
  );
};

export default AIChatbot; 