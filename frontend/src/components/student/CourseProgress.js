import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CircularProgress, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const ProgressContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
}));

const ProgressBar = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 10,
  backgroundColor: theme.palette.grey[200],
  borderRadius: 5,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  overflow: 'hidden',
}));

const ProgressFill = styled(Box)(({ theme, progress }) => ({
  width: `${progress}%`,
  height: '100%',
  backgroundColor: progress >= 100 ? theme.palette.success.main : theme.palette.primary.main,
  transition: 'width 0.3s ease-in-out',
}));

const CourseProgress = ({ onProgressUpdate }) => {
  const { courseId } = useParams();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('not-started');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await axios.get(`/api/student/courses/${courseId}/progress`);
        setProgress(response.data.progress);
        setStatus(response.data.status);
        setLoading(false);
      } catch (err) {
        setError('Failed to load course progress');
        setLoading(false);
      }
    };

    fetchProgress();
  }, [courseId]);

  const handleLessonComplete = async (lessonId) => {
    try {
      const response = await axios.put(`/api/student/courses/${courseId}/progress`, {
        lessonId,
        completed: true
      });
      
      setProgress(response.data.progress);
      setStatus(response.data.status);
      
      if (onProgressUpdate) {
        onProgressUpdate(response.data.progress, response.data.status);
      }
    } catch (err) {
      setError('Failed to update progress');
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <ProgressContainer>
      <Typography variant="h6" gutterBottom>
        Course Progress
      </Typography>
      
      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>
      
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="textSecondary">
          {progress}% Complete
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </Typography>
      </Box>
    </ProgressContainer>
  );
};

export default CourseProgress; 