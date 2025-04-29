import { Chat, Message } from './schema';
import { API_BASE_URL, getAuthToken } from './chatApi';

/**
 * Interface for chat history item with additional metadata
 */
export interface ChatHistoryItem {
  id: string;
  studentId: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  lastModified: Date;
  messageCount: number;
  isArchived: boolean; // Not optional, always defined
}

/**
 * Interface for chat history state
 */
export interface ChatHistoryState {
  chats: ChatHistoryItem[];
  isLoading: boolean;
  error: string | null;
  selectedChatId: string | null;
}

/**
 * Interface for chat rename request
 */
export interface ChatRenameRequest {
  newTitle: string;
}

/**
 * Fetch the complete chat history for a student
 * @param studentId The ID of the student
 * @returns Promise with the chat history
 */
export const fetchStudentChatHistory = async (studentId: string): Promise<ChatHistoryItem[]> => {
  try {
    console.log(`Fetching chat history for student: ${studentId}`);
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${studentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const chats = data.chats || [];
    
    // Log the raw chat data to help debug
    console.log('Raw chat data from server:', JSON.stringify(chats.slice(0, 1)));
    console.log(`Total chats received: ${chats.length}`);
    
    // Count chats with missing IDs (neither id nor _id)
    const missingIds = chats.filter((chat: any) => !chat || (!chat.id && !chat._id)).length;
    if (missingIds > 0) {
      console.warn(`Found ${missingIds} chats with missing IDs`);
    }

    // Transform the chats to include additional metadata and validate
    const validChats = chats
      .filter((chat: any) => {
        if (!chat) {
          console.warn('Filtering out null chat object');
          return false;
        }
        // Accept either id or _id (MongoDB ObjectId)
        if (!chat.id && !chat._id) {
          console.warn('Filtering out chat with missing ID:', chat);
          return false;
        }
        return true;
      })
      .map((chat: any) => {
        const messageCount = chat.messages?.length || 0;
        // Use either id or _id, preferring id if both exist
        const chatId = chat.id || chat._id;
        
        return {
          id: chatId, // Use either the native id or MongoDB's _id
          studentId: studentId,
          title: chat.title || 'Untitled Chat',
          timestamp: new Date(chat.timestamp || Date.now()),
          lastModified: new Date(chat.lastModified || chat.timestamp || Date.now()),
          messageCount: messageCount,
          isArchived: Boolean(chat.isArchived), // Ensure it's always a boolean
          messages: (chat.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp || Date.now())
          }))
        };
      });

    console.log(`Processed ${validChats.length} valid chats (filtered from ${chats.length} total)`);
    if (validChats.length > 0) {
      console.log('First valid chat example:', JSON.stringify(validChats[0]));
    }
    
    return validChats;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Rename a chat
 * @param studentId The ID of the student
 * @param chatId The ID of the chat to rename
 * @param newTitle The new title for the chat
 * @returns Promise with the updated chat
 */
export const renameChat = async (studentId: string, chatId: string, newTitle: string): Promise<ChatHistoryItem> => {
  try {
    // Check if this is a valid MongoDB ObjectId
    if (!/^[0-9a-f]{24}$/i.test(chatId)) {
      console.warn(`Attempted to rename chat with invalid MongoDB ObjectId: ${chatId}`);
      throw new Error(`Invalid MongoDB ObjectId format: ${chatId}`);
    }
    
    console.log(`Renaming chat ${chatId} to "${newTitle}"`);
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
      throw new Error(`Failed to rename chat: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      studentId: studentId,
      title: data.title,
      timestamp: new Date(data.timestamp),
      lastModified: new Date(data.lastModified || data.timestamp),
      messageCount: data.messages?.length || 0,
      isArchived: Boolean(data.isArchived), // Ensure it's always a boolean
      messages: (data.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    };
  } catch (error) {
    console.error('Error renaming chat:', error);
    throw error;
  }
};

/**
 * Delete a chat permanently
 * @param studentId The ID of the student
 * @param chatId The ID of the chat to delete
 * @returns Promise with success status
 */
export const deleteChatHistory = async (studentId: string, chatId: string): Promise<boolean> => {
  try {
    // Check if this is a valid MongoDB ObjectId
    if (!/^[0-9a-f]{24}$/i.test(chatId)) {
      console.warn(`Attempted to delete chat with invalid MongoDB ObjectId: ${chatId}`);
      throw new Error(`Invalid MongoDB ObjectId format: ${chatId}`);
    }
    
    console.log(`Deleting chat ${chatId}`);
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${studentId}/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }

    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

/**
 * Archive a chat (soft delete)
 * @param studentId The ID of the student
 * @param chatId The ID of the chat to archive
 * @returns Promise with the updated chat
 */
export const archiveChat = async (studentId: string, chatId: string): Promise<ChatHistoryItem> => {
  try {
    console.log(`Archiving chat ${chatId}`);
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${studentId}/${chatId}/archive`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isArchived: true })
    });

    if (!response.ok) {
      throw new Error('Failed to archive chat');
    }

    const data = await response.json();
    return {
      ...data,
      id: data.id,
      title: data.title,
      timestamp: new Date(data.timestamp),
      lastModified: new Date(data.lastModified || data.timestamp),
      messageCount: data.messages?.length || 0,
      isArchived: true,
      messages: (data.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    };
  } catch (error) {
    console.error('Error archiving chat:', error);
    throw error;
  }
};

/**
 * Restore an archived chat
 * @param studentId The ID of the student
 * @param chatId The ID of the chat to restore
 * @returns Promise with the updated chat
 */
export const restoreChat = async (studentId: string, chatId: string): Promise<ChatHistoryItem> => {
  try {
    console.log(`Restoring chat ${chatId}`);
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/chats/${studentId}/${chatId}/archive`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isArchived: false })
    });

    if (!response.ok) {
      throw new Error('Failed to restore chat');
    }

    const data = await response.json();
    return {
      ...data,
      id: data.id,
      title: data.title,
      timestamp: new Date(data.timestamp),
      lastModified: new Date(data.lastModified || data.timestamp),
      messageCount: data.messages?.length || 0,
      isArchived: false,
      messages: (data.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    };
  } catch (error) {
    console.error('Error restoring chat:', error);
    throw error;
  }
}; 