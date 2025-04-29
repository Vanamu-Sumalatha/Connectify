import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Chat as ChatIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useStudent } from '../../../context/StudentContext';
import { ChatHistoryItem, fetchStudentChatHistory, renameChat, deleteChatHistory } from './chatHistorySchema';

interface ChatHistoryManagerProps {
  onSelectChat: (chat: ChatHistoryItem | null) => void;
  selectedChatId: string | null;
  refreshTrigger: number;
  onNewChat: () => void;
}

const ChatHistoryManager: React.FC<ChatHistoryManagerProps> = ({
  onSelectChat,
  selectedChatId,
  refreshTrigger,
  onNewChat
}) => {
  const { student } = useStudent();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<ChatHistoryItem | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Fetch chat history when component mounts or refreshTrigger changes
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        if (!student?._id) {
          console.warn('Missing student data, cannot fetch chat history');
          return;
        }
        
        setIsLoading(true);
        setError(null);
        
        const history = await fetchStudentChatHistory(student._id);
        
        if (history && Array.isArray(history)) {
          // Sort chats by modification date (newest first) within each category (active vs archived)
          const sortedHistory = [...history].sort((a, b) => {
            // First sort by archive status
            if (a.isArchived !== b.isArchived) {
              return a.isArchived ? 1 : -1;
            }
            
            // Then sort by last modified date (newest first)
            return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
          });
          
          setChatHistory(sortedHistory);
          console.log(`Retrieved ${sortedHistory.length} chats`);
        } else {
          console.warn('Invalid chat history data received', history);
          setChatHistory([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setError('Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatHistory();
  }, [student?._id, refreshTrigger]);

  // Handle renaming a chat
  const handleRenameClick = (e: React.MouseEvent, chat: ChatHistoryItem) => {
    // Stop propagation first to prevent parent click
    e.stopPropagation();
    
    // Check if the chat object is valid
    if (!chat) {
      console.error('Cannot rename: Chat object is undefined');
      setError('Cannot rename: Invalid chat');
      setShowError(true);
      return;
    }
    
    // Check if this is a valid MongoDB ObjectId
    if (!chat.id || !/^[0-9a-f]{24}$/i.test(chat.id)) {
      console.error('Invalid chat ID format - not a MongoDB ObjectId:', chat.id);
      setError('Cannot rename: Invalid chat ID format');
      setShowError(true);
      return;
    }

    setChatToRename(chat);
    setNewTitle(chat.title);
    setRenameDialogOpen(true);
    console.log(`Opening rename dialog for chat: ${chat.id} - ${chat.title}`);
  };

  // Handle confirming rename
  const handleRenameConfirm = async () => {
    if (!student?._id || !chatToRename?.id || !newTitle.trim()) {
      console.error('Missing data for rename:', {
        studentId: student?._id,
        chatId: chatToRename?.id,
        hasTitle: Boolean(newTitle.trim())
      });
      setError('Cannot rename: Missing required data');
      setShowError(true);
      return;
    }

    // No change in title, just close the dialog
    if (newTitle.trim() === chatToRename.title) {
      setRenameDialogOpen(false);
      return;
    }

    try {
      console.log(`Renaming chat ${chatToRename.id} from "${chatToRename.title}" to "${newTitle.trim()}"`);
      const updatedChat = await renameChat(student._id, chatToRename.id, newTitle.trim());
      
      // Update the chat in the history
      setChatHistory(prev => prev.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      ));
      
      // If the renamed chat is the selected one, update it
      if (selectedChatId === updatedChat.id) {
        onSelectChat(updatedChat);
      }
      
      setRenameDialogOpen(false);
      console.log(`Successfully renamed chat to: ${updatedChat.title}`);
    } catch (error) {
      console.error('Error renaming chat:', error);
      setError(`Failed to rename chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowError(true);
    }
  };

  // Handle deleting a chat
  const handleDeleteClick = async (chatId: string) => {
    if (!student?._id || !chatId) {
      return;
    }

    try {
      // Validate ObjectId format
      if (!/^[0-9a-f]{24}$/i.test(chatId)) {
        console.error('Invalid chat ID format - not a MongoDB ObjectId:', chatId);
        setError('Invalid chat ID format');
        setShowError(true);
        return;
      }
      
      const success = await deleteChatHistory(student._id, chatId);
      
      if (success) {
        console.log(`Successfully deleted chat: ${chatId}`);
        
        // Remove the chat from the history
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        
        // If the deleted chat was selected, clear the selection by passing null
        if (selectedChatId === chatId) {
          onSelectChat(null);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat');
      setShowError(true);
    }
  };

  // Function to handle clicking on a chat
  const handleChatClick = (chat: ChatHistoryItem) => {
    try {
      if (typeof onSelectChat === 'function') {
        console.log(`Selecting chat: ${chat.id} - ${chat.title}`);
        onSelectChat(chat);
      }
    } catch (error) {
      console.error('Error selecting chat:', error);
      setError('Failed to select chat. Please try again.');
      
      // Automatically retry after a delay
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Sort chats by last modified date (newest first) and filter out any chats without IDs
  const sortedChats = [...chatHistory]
    .filter(chat => chat && chat.id) // Filter out chats without IDs
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

  return (
    <Box key="chat-history-container" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box key="chat-history-header" sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Typography key="chat-history-title" variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666' }}>
          Chat History
        </Typography>
        <Tooltip key="new-chat-tooltip" title="New Chat">
          <IconButton key="new-chat-button" size="small" onClick={onNewChat}>
            <AddIcon key="new-chat-icon" fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Divider key="chat-history-divider" flexItem />
      
      {isLoading ? (
        <Box key="loading-container" sx={{ display: 'flex', justifyContent: 'center', p: 2, flexGrow: 1 }}>
          <CircularProgress key="loading-spinner" size={24} />
        </Box>
      ) : sortedChats.length > 0 ? (
        <List key="chat-list" sx={{ flexGrow: 1, overflow: 'auto', p: 0, maxHeight: 'calc(100% - 48px)' }}>
          {sortedChats.map((chat, index) => (
            <ListItem
              key={chat.id ? `chat-item-${chat.id}` : `chat-item-index-${index}`}
              sx={{
                py: 0.5,
                px: 1,
                cursor: 'pointer',
                bgcolor: selectedChatId === chat.id ? '#e3f2fd' : 'transparent',
                '&:hover': {
                  bgcolor: selectedChatId === chat.id ? '#e3f2fd' : '#f0f0f0',
                },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onClick={() => chat.id ? handleChatClick(chat) : null}
            >
              <Box key={chat.id ? `chat-item-content-${chat.id}` : `chat-item-content-index-${index}`} sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <ChatIcon key={chat.id ? `icon-${chat.id}` : `icon-index-${index}`} fontSize="small" sx={{ mr: 1, color: '#666' }} />
                <Box key={chat.id ? `content-${chat.id}` : `content-index-${index}`} sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    key={chat.id ? `title-${chat.id}` : `title-index-${index}`}
                    variant="body2"
                    sx={{
                      fontWeight: selectedChatId === chat.id ? 'bold' : 'normal',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '0.75rem',
                    }}
                  >
                    {chat.title || 'Untitled Chat'}
                  </Typography>
                  <Typography
                    key={chat.id ? `meta-${chat.id}` : `meta-index-${index}`}
                    variant="caption"
                    sx={{ color: '#999', fontSize: '0.65rem' }}
                  >
                    {chat.messageCount} messages • {new Date(chat.lastModified).toLocaleDateString()}
                  </Typography>
                </Box>
                {chat.id && (
                  <Box key={`actions-${chat.id}`}>
                    <Tooltip key={`rename-tooltip-${chat.id}`} title="Rename">
                      <IconButton
                        key={`rename-${chat.id}`}
                        size="small"
                        onClick={(e) => handleRenameClick(e, chat)}
                        sx={{ ml: 0.5 }}
                      >
                        <EditIcon key={`rename-icon-${chat.id}`} fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip key={`delete-tooltip-${chat.id}`} title="Delete">
                      <IconButton
                        key={`delete-${chat.id}`}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(chat.id);
                        }}
                        sx={{ ml: 0.5 }}
                      >
                        <DeleteIcon key={`delete-icon-${chat.id}`} fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box key="empty-state" sx={{ p: 2, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography key="empty-title" variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            No chat history yet
          </Typography>
          <Typography key="empty-subtitle" variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            Start a new chat to begin
          </Typography>
        </Box>
      )}

      {/* Rename Dialog */}
      <Dialog key="rename-dialog" open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle key="rename-dialog-title">Rename Chat</DialogTitle>
        <DialogContent key="rename-dialog-content">
          <TextField
            key="rename-text-field"
            autoFocus
            margin="dense"
            label="Chat Title"
            type="text"
            fullWidth
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions key="rename-dialog-actions">
          <Button key="rename-cancel-button" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button 
            key="rename-confirm-button"
            onClick={handleRenameConfirm} 
            variant="contained" 
            color="primary"
            disabled={!newTitle.trim() || newTitle === chatToRename?.title}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar 
        key="error-snackbar"
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          key="error-alert"
          onClose={() => setShowError(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatHistoryManager; 