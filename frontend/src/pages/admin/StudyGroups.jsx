import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This is a redirect component since we migrated to AdminStudyGroups
const StudyGroups = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new AdminStudyGroups component
    navigate('/admin/study-groups', { replace: true });
  }, [navigate]);

  return null;
};

export default StudyGroups; 