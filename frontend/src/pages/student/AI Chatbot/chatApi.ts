import { Chat } from './schema';

// Update this with your backend URL
export const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async (response: Response, errorMessage: string) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`${errorMessage}:`, errorData);
    throw new Error(errorData.message || errorMessage);
  }
  return response.json();
};

// Fetch chat history for a user
export const fetchChatHistory = async (userId: string): Promise<Chat[]> => {
  try {
    console.log(`Fetching chat history for user: ${userId}`);
    const token = getAuthToken();
    if (!token) {
      console.log('No authentication token found');
      return [];
    }
    
    const response = await fetch(`${API_BASE_URL}/chats/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await handleResponse(response, 'Failed to fetch chat history');
    
    console.log(`Retrieved ${data.chats?.length || 0} chats`);
    return (data.chats || []).map((chat: any) => ({
      ...chat,
      timestamp: new Date(chat.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
};

// Save a new chat
export const saveChat = async (studentId: string, chat: Partial<Chat>): Promise<Chat> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${studentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(chat),
    });

    if (!response.ok) {
      throw new Error(`Error saving chat: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle both response formats: { chat: {...} } or directly the chat object
    const savedChat = data.chat || data;
    
    // Normalize _id to id if needed
    if (!savedChat.id && savedChat._id) {
      savedChat.id = savedChat._id;
    }
    
    if (!savedChat.id) {
      console.error('Server returned incomplete chat data:', savedChat);
      throw new Error('Server returned incomplete chat data');
    }
    
    return savedChat;
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
};

// Update an existing chat
export const updateChat = async (studentId: string, chatId: string, chatData: any): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`Updating chat ${chatId} for student ${studentId}`, chatData);

    // Check if this is a valid request with required data
    if (!chatId) {
      throw new Error('Chat ID is required for updating');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${studentId}/${chatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(chatData)
    });

    if (!response.ok) {
      // Better error handling with response details
      const errorText = await response.text().catch(() => '');
      throw new Error(`Failed to update chat: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    const updatedChat = data.chat || data;
    
    // Ensure we have either id or _id in the response
    if (!updatedChat || (!updatedChat.id && !updatedChat._id)) {
      console.error('Server returned incomplete chat data:', data);
      
      // Instead of throwing, return the original data we sent with the ID
      // This allows for graceful degradation when the server doesn't return proper data
      return {
        ...chatData,
        id: chatId,
        _id: chatId
      };
    }
    
    // Normalize _id to id if necessary
    if (!updatedChat.id && updatedChat._id) {
      updatedChat.id = updatedChat._id;
    }
    
    return updatedChat;
  } catch (error) {
    console.error('Error updating chat:', error);
    
    // For UI continuity, return a basic object with the ID in case of errors
    // This prevents the UI from breaking completely on server errors
    return {
      id: chatId,
      ...chatData
    };
  }
};

// Delete a chat
export const deleteChat = async (userId: string, chatId: string): Promise<boolean> => {
  try {
    if (!chatId) {
      throw new Error('Chat ID is required for deletion');
    }
    
    console.log(`Deleting chat ${chatId} for user: ${userId}`);
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/chats/${userId}/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    await handleResponse(response, 'Failed to delete chat');
    console.log(`Chat ${chatId} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

// Fetch chat history for a student
export const fetchStudentChatHistory = async (studentId: string): Promise<Chat[]> => {
  console.log('Fetching chat history for student:', studentId);
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${studentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching chat history: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw chat data received:', data);
    
    // The API might return { chats: [...] } or directly the array
    const chats = Array.isArray(data) ? data : data.chats || [];
    console.log(`Found ${chats.length} chats before normalization`);
    
    // Normalize _id to id for all chats and ensure proper date handling
    const normalizedChats = chats.map((chat: any) => {
      // Create a new object to avoid modifying the original
      const normalizedChat = { ...chat };
      
      // Handle MongoDB _id field
      if (!normalizedChat.id && normalizedChat._id) {
        console.log(`Normalizing _id to id for chat: ${normalizedChat._id}`);
        normalizedChat.id = normalizedChat._id;
      }
      
      // Ensure timestamps are Date objects
      if (normalizedChat.timestamp && typeof normalizedChat.timestamp === 'string') {
        normalizedChat.timestamp = new Date(normalizedChat.timestamp);
      }
      
      if (normalizedChat.lastModified && typeof normalizedChat.lastModified === 'string') {
        normalizedChat.lastModified = new Date(normalizedChat.lastModified);
      }
      
      return normalizedChat;
    });
    
    // Log any chats that don't have an ID after normalization
    const missingIds = normalizedChats.filter((chat: any) => !chat.id);
    if (missingIds.length > 0) {
      console.warn(`Found ${missingIds.length} chats with missing IDs:`, missingIds);
      console.log('First chat with missing ID:', missingIds[0]);
    }
    
    console.log(`Returning ${normalizedChats.length} normalized chats`);
    return normalizedChats;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Rename a chat
export const renameChat = async (studentId: string, chatId: string, newTitle: string): Promise<Chat> => {
  console.log(`Renaming chat ${chatId} to "${newTitle}" for student: ${studentId}`);
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${studentId}/${chatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: newTitle })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Error renaming chat: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    const updatedChat = data.chat || data;
    
    // Normalize _id to id if needed
    if (!updatedChat.id && updatedChat._id) {
      updatedChat.id = updatedChat._id;
    }
    
    if (!updatedChat.id) {
      console.error('Server returned incomplete chat data:', updatedChat);
      throw new Error('Server returned incomplete chat data');
    }
    
    console.log(`Chat renamed successfully:`, updatedChat);
    return updatedChat;
  } catch (error) {
    console.error('Error renaming chat:', error);
    throw error;
  }
};

// Fetch a single chat by ID
export const fetchChatById = async (studentId: string, chatId: string): Promise<Chat> => {
  console.log(`Fetching individual chat ${chatId} for student: ${studentId}`);
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Instead of trying to fetch a specific chat directly (which returns 404),
    // we'll fetch all chats and find the one we need
    console.log('Fetching all chats and filtering by ID');
    const allChats = await fetchStudentChatHistory(studentId);
    
    // Find the chat with the matching ID
    const chat = allChats.find(c => c.id === chatId);
    
    if (!chat) {
      throw new Error(`Chat with ID ${chatId} not found in student's chat history`);
    }
    
    console.log('Found chat in history:', chat);
    return chat;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
}; 