import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, Alert, Snackbar, List, ListItem, ListItemText, IconButton, Divider, CircularProgress, Card, Grid, Container, Avatar, ListItemButton } from '@mui/material';
import { 
  Send as SendIcon, 
  Delete as DeleteIcon, 
  Chat as ChatIcon, 
  Menu as MenuIcon, 
  Close as CloseIcon, 
  Add as AddIcon, 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon, 
  Mic as MicIcon, 
  Image as ImageIcon, 
  LightbulbOutlined, 
  CodeOutlined, 
  RestaurantOutlined, 
  EngineeringOutlined, 
  KeyboardDoubleArrowUp as UpArrowIcon
} from '@mui/icons-material';
import { Message, Chat } from './schema';
import { sendMessage } from './api';
import { fetchChatHistory, saveChat, updateChat, deleteChat, API_BASE_URL, getAuthToken, fetchStudentChatHistory, fetchChatById } from './chatApi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useStudent } from '../../../context/StudentContext';
import ChatHistoryManager from './ChatHistoryManager';
import { ChatHistoryItem } from './chatHistorySchema';

interface ChatbotProps {
  showHistory: boolean;
  toggleHistory: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ showHistory, toggleHistory }) => {
  const { student } = useStudent();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(270);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat history on component mount and when student changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!student?._id) {
        console.log('Waiting for student data...');
        return;
      }

      setIsLoadingHistory(true);
      try {
        console.log('Fetching chat history for student:', student._id);
        const history = await fetchChatHistory(student._id);
        console.log('Raw chat history received:', history);
        
        if (history && history.length > 0) {
          // Convert to Chat type and normalize MongoDB _id to id
          const formattedHistory: Chat[] = history
            .map(chat => {
              // Check for MongoDB _id field and use it as id if needed
              if (!chat.id && chat._id) {
                console.log(`Converting MongoDB _id to id: ${chat._id}`);
                return {
                  id: chat._id,
                  studentId: student._id,
                  title: chat.title,
                  messages: chat.messages || [],
                  lastModified: new Date(chat.timestamp || Date.now()),
                  messageCount: chat.messages ? chat.messages.length : 0,
                  isArchived: false,
                  timestamp: chat.timestamp
                };
              } else if (!chat.id) {
                console.error('Found chat without any ID (neither id nor _id):', chat);
                return null;
              } else {
                return {
                  id: chat.id,
                  studentId: student._id,
                  title: chat.title,
                  messages: chat.messages || [],
                  lastModified: new Date(chat.timestamp || Date.now()),
                  messageCount: chat.messages ? chat.messages.length : 0,
                  isArchived: false,
                  timestamp: chat.timestamp
                };
              }
            })
            .filter(Boolean) as Chat[]; // Remove null items
          
          console.log('Formatted chat history:', formattedHistory);
          setChatHistory(formattedHistory);
          
          if (formattedHistory[0]) {
            setSelectedChat(formattedHistory[0]);
            setMessages(formattedHistory[0].messages || []);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setError('Failed to load chat history');
        setShowError(true);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [student?._id]);

  // Add a useEffect to log student info for debugging
  useEffect(() => {
    if (student) {
      console.log("Student info:", student);
    }
  }, [student]);

  // Handle creating a new chat
  const handleNewChat = async () => {
    if (!student?._id) {
      console.error('No student ID available');
      setError('Please log in to create a new chat');
      setShowError(true);
      return;
    }

    try {
      setIsLoading(true);
      
      // First create the chat on the server to get a valid ObjectId
      const currentTime = new Date();
      const newChatData = {
        title: 'New Chat',
        timestamp: currentTime,
        messages: []
      };
      
      console.log(`Creating new chat for student: ${student._id}`);
      
      // Create the chat on the server first to get a real MongoDB ObjectId
      // Cast to any to avoid TypeScript errors with the simplified object
      const savedChat = await saveChat(student._id, newChatData as any);
      
      if (!savedChat) {
        throw new Error('Empty response from server when creating chat');
      }
      
      if (!savedChat.id) {
        throw new Error('Server did not return a valid ID for the new chat');
      }
      
      console.log(`Successfully created new chat with ID: ${savedChat.id}`);
      
      // Create a fully formed chat object with the server-assigned ID
      const finalChat: Chat = {
        id: savedChat.id,
        studentId: student._id,
        title: 'New Chat',
        messages: [],
        lastModified: currentTime,
        messageCount: 0,
        isArchived: false,
        timestamp: currentTime
      };
      
      setSelectedChat(finalChat);
      setMessages([]);
      setChatHistory(prev => [finalChat, ...prev]);
      setRefreshHistory(prev => prev + 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating new chat:', error);
      setError(`Failed to create new chat: ${errorMessage}`);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a chat
  const handleSelectChat = async (chat: ChatHistoryItem | null) => {
    if (!chat) {
      setSelectedChat(null);
      setMessages([]);
      return;
    }

    // Check if chat ID is defined (either id or _id)
    const chatId = chat.id || (chat as any)._id;
    if (!chatId) {
      console.error('Invalid chat object:', chat);
      setError('Invalid chat: missing ID');
      setShowError(true);
      return;
    }

    setIsLoadingHistory(true);
    
    try {
      if (!student || !student._id) {
        throw new Error('Student information not available');
      }
      
      // Log the chat details for debugging
      console.log(`Attempting to load chat details for ID: ${chatId}`, chat);
      
      // Use our new function to fetch the latest version of the chat
      const updatedChat = await fetchChatById(student._id, chatId);
      
      console.log(`Successfully loaded chat data for ID: ${updatedChat.id}`);
      
      const normalizedChat: Chat = {
        id: updatedChat.id || (updatedChat as any)._id,
        studentId: updatedChat.studentId || student._id,
        title: updatedChat.title,
        messages: updatedChat.messages || [],
        lastModified: updatedChat.lastModified || new Date(),
        messageCount: updatedChat.messages?.length || 0,
        isArchived: Boolean(updatedChat.isArchived),
        timestamp: updatedChat.timestamp
      };
      
      setSelectedChat(normalizedChat);
      setMessages(normalizedChat.messages);
      
      // Update the chat in the history with the latest data
      setChatHistory(prev => prev.map(c => 
        (c.id === chatId || (c as any)._id === chatId) ? normalizedChat : c
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error loading chat:', error);
      setError(`Failed to load chat details: ${errorMessage}`);
      setShowError(true);
      
      // Fallback: Use the chat data we already have
      const fallbackChat: Chat = {
        id: chatId,
        studentId: student?._id || '',
        title: chat.title,
        messages: chat.messages || [],
        lastModified: chat.lastModified || new Date(),
        messageCount: chat.messages?.length || 0,
        isArchived: Boolean(chat.isArchived),
        timestamp: chat.timestamp
      };
      
      setSelectedChat(fallbackChat);
      setMessages(fallbackChat.messages);
    } finally {
      setIsLoadingHistory(false);
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    // Validate input
    if (!input.trim()) {
      setError('Please enter a message');
      setShowError(true);
      return;
    }

    // Validate selected chat
    if (!selectedChat) {
      setError('Please select a chat or create a new one');
      setShowError(true);
      return;
    }

    // Validate student ID
    if (!student?._id) {
      setError('Please log in to send messages');
      setShowError(true);
      return;
    }

    // Validate chat ID
    if (!selectedChat.id) {
      setError('Chat ID is missing');
      setShowError(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Update chat title if this is the first message
    if (messages.length === 0 && selectedChat.title === 'New Chat') {
      // Create a title from the first message (truncate if too long)
      const titleFromMessage = input.length > 30 
        ? input.substring(0, 30) + '...' 
        : input;
      
      // Update the chat title in the UI
      const updatedChat = { ...selectedChat, title: titleFromMessage };
      setSelectedChat(updatedChat);
      
      // Update the chat title in the chat history
      setChatHistory(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, title: titleFromMessage }
          : chat
      ));
      
      // Only update in the database if we have a valid MongoDB ObjectId
      // MongoDB ObjectIds are 24 character hex strings
      if (selectedChat.id && /^[0-9a-f]{24}$/i.test(selectedChat.id)) {
        try {
          await updateChat(student._id, selectedChat.id, {
            title: titleFromMessage
          });
        } catch (error) {
          console.error('Error updating chat title:', error);
        }
      }
    }

    try {
      // Show a temporary "thinking" message while waiting for the API
      const thinkingMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thinking...",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages([...newMessages, thinkingMessage]);
      
      const response = await sendMessage({ 
        message: input,
        chatHistory: messages
      });
      
      // Remove the thinking message
      setMessages(newMessages);
      
      if (response.error) {
        setError(response.error);
        setShowError(true);
        
        // Add a fallback message to the chat
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.message || "I'm having trouble connecting right now. Please try again later.",
          role: 'assistant',
          timestamp: new Date(),
        };
        
        const updatedMessages = [...newMessages, fallbackMessage];
        setMessages(updatedMessages);
        
        // Update chat history with new messages
        setChatHistory(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, messages: updatedMessages, messageCount: updatedMessages.length }
            : chat
        ));
        
        // Update the chat in the database (only if we have a valid MongoDB ObjectId)
        if (selectedChat.id && /^[0-9a-f]{24}$/i.test(selectedChat.id)) {
          await updateChat(student._id, selectedChat.id, {
            messages: updatedMessages,
            timestamp: new Date(),
          });
        } else {
          console.log('Skipping server update - Chat ID is not a valid MongoDB ObjectId:', selectedChat.id);
        }
        
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      
      // Update chat history with new messages
      setChatHistory(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { 
              ...chat, 
              messages: updatedMessages, 
              messageCount: updatedMessages.length,
              lastModified: new Date()
            }
          : chat
      ));

      // Update the chat in the database (only if we have a valid MongoDB ObjectId)
      if (selectedChat.id && /^[0-9a-f]{24}$/i.test(selectedChat.id)) {
        await updateChat(student._id, selectedChat.id, {
          messages: updatedMessages,
          timestamp: new Date(),
        });
      } else {
        console.log('Skipping server update - Chat ID is not a valid MongoDB ObjectId:', selectedChat.id);
      }

      setRefreshHistory(prev => prev + 1); // Increment to trigger history refresh

    } catch (error) {
      console.error('Error in handleSend:', error);
      setError('An unexpected error occurred. Please try again.');
      setShowError(true);
      
      // Add a fallback message to the chat
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      const updatedMessages = [...newMessages, fallbackMessage];
      setMessages(updatedMessages);
      
      // Update chat history with new messages
      setChatHistory(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, messages: updatedMessages, messageCount: updatedMessages.length }
          : chat
      ));

      // Only try to update if we have a valid MongoDB ObjectId
      if (student?._id && selectedChat?.id && /^[0-9a-f]{24}$/i.test(selectedChat.id)) {
        try {
          await updateChat(student._id, selectedChat.id, {
            messages: updatedMessages,
            timestamp: new Date(),
          });
        } catch (updateError) {
          console.error('Error updating chat after error:', updateError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  // Add a retry button for rate limit errors
  const renderRetryButton = () => {
    if (error && (error.includes('Rate limit exceeded') || error.includes('API error'))) {
      return (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => {
            setError(null);
            setShowError(false);
            // Wait a few seconds before allowing another request
            setTimeout(() => {
              if (input.trim()) {
                handleSend();
              }
            }, 3000);
          }}
          sx={{ mt: 1 }}
        >
          Retry in 3 seconds
        </Button>
      );
    }
    return null;
  };

  // Add a message to show when the API is being rate limited
  const renderRateLimitMessage = () => {
    if (isLoading && error && error.includes('Rate limit exceeded')) {
      return (
        <Box key="rate-limit-message" sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          p: 2,
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderRadius: 1,
          my: 1
        }}>
          <Typography key="rate-limit-text" variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            The AI service is currently busy. Your message will be processed shortly...
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Function to format message content with code blocks and text styling
  const formatMessageContent = (content: string) => {
    // Split content by code blocks (text between triple backticks)
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code from code block
        const codeBlock = part.slice(3, -3);
        const firstLine = codeBlock.split('\n')[0];
        const language = firstLine.trim();
        const code = codeBlock.slice(firstLine.length).trim();
        
        return (
          <Box key={`code-${index}`} sx={{ 
            my: 1,
            '& pre': {
              margin: 0,
              borderRadius: '8px',
              fontSize: '0.85rem',
              maxHeight: '400px',
              overflow: 'auto',
              backgroundColor: '#1E1E1E !important',
              padding: '1rem !important'
            }
          }}>
            <SyntaxHighlighter
              key={`syntax-${index}`}
              language={language || 'plaintext'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '8px',
                fontSize: '0.85rem',
                maxHeight: '400px',
                overflow: 'auto',
                backgroundColor: '#1E1E1E',
                padding: '1rem'
              }}
            >
              {code}
            </SyntaxHighlighter>
          </Box>
        );
      }
      
      // For regular text, handle markdown formatting
      if (!part.trim()) return null;

      // Process different markdown elements
      const processText = (text: string) => {
        // Create React elements for different parts
        const elements: JSX.Element[] = [];
        
        // Split by double newlines to handle paragraphs
        const paragraphs = text.split(/\n\n+/);
        
        paragraphs.forEach((paragraph, pIndex) => {
          // Check if this is a header
          if (paragraph.match(/^#+\s+/)) {
            const match = paragraph.match(/^(#+)\s+(.*)/);
            if (match) {
              const level = Math.min(match[1].length, 6); // h1 to h6
              const content = match[2];
              
              elements.push(
                <Box 
                  key={`h-${pIndex}`} 
                  sx={{ 
                    fontSize: level === 1 ? '1.6rem' : 
                             level === 2 ? '1.4rem' : 
                             level === 3 ? '1.2rem' : 
                             level === 4 ? '1.1rem' : 
                             level === 5 ? '1rem' : '0.9rem',
                    fontWeight: level <= 2 ? 600 : 500,
                    my: 1.5,
                    borderBottom: level <= 2 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                    pb: level <= 2 ? 0.5 : 0
                  }}
                >
                  {processInlineFormatting(content)}
                </Box>
              );
              return;
            }
          }
          
          // Check if this is a bullet point list
          if (paragraph.match(/^\s*[\*\-]\s+/m)) {
            const listItems = paragraph
              .split(/\n/)
              .filter(line => line.trim())
              .map(line => {
                // Calculate indentation level
                const indentMatch = line.match(/^(\s*)/);
                const indent = indentMatch ? indentMatch[1].length : 0;
                const level = Math.floor(indent / 2);
                
                // Extract content
                return {
                  content: line.replace(/^\s*[\*\-]\s+/, '').trim(),
                  level
                };
              });
            
            // Create nested lists
            const createNestedList = (items: { content: string, level: number }[], startIndex: number, currentLevel: number): [JSX.Element[], number] => {
              const listItems: JSX.Element[] = [];
              let i = startIndex;
              
              while (i < items.length && items[i].level >= currentLevel) {
                if (items[i].level === currentLevel) {
                  // Check if this item has children (next item has higher level)
                  if (i + 1 < items.length && items[i + 1].level > currentLevel) {
                    // Process this item and its children
                    const item = (
                      <Box component="li" key={`li-${pIndex}-${i}`} sx={{ mb: 0.5 }}>
                        {processInlineFormatting(items[i].content)}
                        <Box component="ul" sx={{ pl: 2, mt: 0.5, listStyleType: 'circle' }}>
                          {/* Recursively process children */}
                          {createNestedList(items, i + 1, currentLevel + 1)[0]}
                        </Box>
                      </Box>
                    );
                    listItems.push(item);
                    
                    // Skip processed children
                    while (i + 1 < items.length && items[i + 1].level > currentLevel) {
                      i++;
                    }
                  } else {
                    // Simple item with no children
                    listItems.push(
                      <Box component="li" key={`li-${pIndex}-${i}`} sx={{ mb: 0.5 }}>
                        {processInlineFormatting(items[i].content)}
                      </Box>
                    );
                  }
                }
                i++;
              }
              
              return [listItems, i];
            };
            
            elements.push(
              <Box component="ul" key={`ul-${pIndex}`} sx={{ pl: 2, my: 1, listStyleType: 'disc' }}>
                {createNestedList(listItems, 0, 0)[0]}
              </Box>
            );
          } 
          // Check if this is a numbered list
          else if (paragraph.match(/^\s*\d+\.\s+/m)) {
            const listItems = paragraph
              .split(/\n/)
              .filter(line => line.trim())
              .map(line => line.replace(/^\s*\d+\.\s+/, '').trim());
            
            elements.push(
              <Box component="ol" key={`ol-${pIndex}`} sx={{ pl: 2, my: 1 }}>
                {listItems.map((item, liIndex) => (
                  <Box component="li" key={`li-${pIndex}-${liIndex}`} sx={{ mb: 0.5 }}>
                    {processInlineFormatting(item)}
                  </Box>
                ))}
              </Box>
            );
          }
          // Regular paragraph
          else {
            const lines = paragraph.split(/\n/);
            elements.push(
              <Box key={`p-${pIndex}`} sx={{ mb: 1 }}>
                {lines.map((line, lineIndex) => (
                  <React.Fragment key={`line-${pIndex}-${lineIndex}`}>
                    {processInlineFormatting(line)}
                    {lineIndex < lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </Box>
            );
          }
        });
        
        return elements;
      };
      
      // Process inline formatting like bold, italic, code
      const processInlineFormatting = (text: string) => {
        // Handle different formatting patterns with regex
        // Process bold text
        let processedText = text.replace(
          /\*\*(.*?)\*\*/g, 
          (_, match) => `<strong>${match}</strong>`
        );
        
        // Process italic text (ensuring we don't match within bold)
        processedText = processedText.replace(
          /\*([^\*]*?)\*/g,
          (_, match) => `<em>${match}</em>`
        );
        
        // Process inline code
        processedText = processedText.replace(
          /`([^`]*?)`/g,
          (_, match) => `<code>${match}</code>`
        );
        
        // Create a document fragment to parse the HTML
        const temp = document.createElement('div');
        temp.innerHTML = processedText;
        
        // Convert HTML to React elements
        const convertNode = (node: Node): React.ReactNode => {
          if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
          }
          
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const children = Array.from(element.childNodes).map(convertNode);
            
            switch (element.tagName.toLowerCase()) {
              case 'strong':
                return <strong>{children}</strong>;
              case 'em':
                return <em>{children}</em>;
              case 'code':
                return <code style={{ 
                  backgroundColor: 'rgba(0,0,0,0.05)', 
                  padding: '0.1em 0.3em', 
                  borderRadius: '3px',
                  fontFamily: 'monospace'
                }}>{children}</code>;
              default:
                return <>{children}</>;
            }
          }
          
          return null;
        };
        
        return <>{Array.from(temp.childNodes).map(convertNode)}</>;
      };
      
      return (
        <Box key={`text-${index}`} sx={{ fontSize: '0.9rem', textAlign: 'left' }}>
          {processText(part)}
        </Box>
      );
    });
  };

  // Add a handler for sidebar toggling
  const toggleSidebar = () => {
    if (sidebarWidth > 0) {
      setSidebarWidth(0); // Collapse
    } else {
      setSidebarWidth(270); // Expand
    }
  };

  // Add handlers for resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartXRef.current;
      const newWidth = Math.max(0, Math.min(350, dragStartWidthRef.current + deltaX));
      setSidebarWidth(newWidth);
    }
  };

  const handleResizeEnd = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    // If width is very small after dragging, collapse completely
    if (sidebarWidth < 50) {
      setSidebarWidth(0);
    }
  };

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  // Suggestion cards for the welcome screen
  const suggestionCards = [
    {
      title: "Improve the readability",
      description: "of the following code",
      icon: <CodeOutlined sx={{ fontSize: 24 }} />
    },
    {
      title: "Help explain a concept",
      description: "in a kid-friendly way",
      icon: <LightbulbOutlined sx={{ fontSize: 24 }} />
    },
    {
      title: "Come up with a recipe",
      description: "for an upcoming event",
      icon: <RestaurantOutlined sx={{ fontSize: 24 }} />
    },
    {
      title: "Explain how something works",
      description: "like an engineer",
      icon: <EngineeringOutlined sx={{ fontSize: 24 }} />
    }
  ];

  // Welcome screen component
  const renderWelcomeScreen = () => {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          padding: '0 20px',
          textAlign: 'center'
        }}
      >
        <Typography 
          variant="h2" 
          sx={{ 
            fontSize: '42px', 
            fontWeight: 'normal',
            color: 'text.primary',
            mb: 0.5
          }}
        >
          Hello, <span style={{ color: '#8e44ad' }}>{student?.firstName || student?.name || 'User'}.</span>
        </Typography>
        
        <Typography 
          variant="h4" 
          sx={{ 
            fontSize: '36px', 
            fontWeight: 'normal',
            color: 'text.secondary',
            mb: 6
          }}
        >
          How can I help you today?
        </Typography>

        <Grid container spacing={2} sx={{ maxWidth: '750px' }}>
          {suggestionCards.map((card, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card 
                onClick={() => setInput(card.title + " " + card.description)}
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  '&:hover': {
                    boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
                    bgcolor: 'rgba(0,0,0,0.02)'
                  }
                }}
              >
                <Box sx={{ mr: 2, color: 'text.secondary' }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Render chat messages
  const renderChatMessages = () => {
    return (
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {messages.map((message, index) => (
          <Box 
            key={message.id} 
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              maxWidth: '750px',
              mx: 'auto',
              width: '100%',
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            {message.role === 'assistant' && (
              <Avatar 
                src="/gemini-icon.svg" 
                alt="AI" 
                sx={{ 
                  mr: 2, 
                  bgcolor: '#8e44ad',
                  width: 32,
                  height: 32
                }}
              >
                G
              </Avatar>
            )}
            
            {message.role === 'user' && (
              <Avatar 
                sx={{ 
                  ml: 2, 
                  bgcolor: '#34a853',
                  width: 32,
                  height: 32,
                  fontSize: '14px'
                }}
              >
                {student?.firstName ? student.firstName.charAt(0).toUpperCase() : 
                 student?.name ? student.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            )}
            
            {message.role === 'user' ? (
              <Box sx={{ 
                flexGrow: 1,
                mr: 0,
                ml: 2,
                bgcolor: 'rgba(142, 68, 173, 0.08)',
                p: 2,
                borderRadius: '12px 12px 0 12px',
                '& ul, & ol': { pl: 2, my: 1 },
                '& li': { my: 0.5 },
                '& p': { my: 0.5 },
                '& strong': { fontWeight: 600 },
                '& em': { fontStyle: 'italic' },
                '& code': { 
                  backgroundColor: 'rgba(0, 0, 0, 0.05)', 
                  padding: '0.1em 0.3em', 
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                }
              }}>
                <Typography 
                  variant="body1" 
                  component="div"
                  sx={{ whiteSpace: 'pre-wrap' }}
                >
                  {formatMessageContent(message.content)}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                flexGrow: 1,
                mr: 2,
                ml: 0,
                bgcolor: 'rgba(0, 0, 0, 0.03)',
                p: 2,
                borderRadius: '12px 12px 12px 0',
                '& ul, & ol': { pl: 2, my: 1 },
                '& li': { my: 0.5 },
                '& p': { my: 0.5 },
                '& strong': { fontWeight: 600 },
                '& em': { fontStyle: 'italic' },
                '& code': { 
                  backgroundColor: 'rgba(0, 0, 0, 0.05)', 
                  padding: '0.1em 0.3em', 
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                }
              }}>
                <Typography 
                  variant="body1" 
                  component="div"
                  sx={{ whiteSpace: 'pre-wrap' }}
                >
                  {formatMessageContent(message.content)}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
        
        {isLoading && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              maxWidth: '750px',
              mx: 'auto',
              width: '100%'
            }}
          >
            <Avatar 
              src="/gemini-icon.svg"
              alt="AI" 
              sx={{ 
                mr: 2, 
                bgcolor: '#8e44ad',
                width: 32,
                height: 32
              }}
            >
              G
            </Avatar>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
    );
  };

  // Chat history sidebar
  const renderChatHistorySidebar = () => {
    return (
      <Box 
        sx={{ 
          width: 280, 
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8f9fa',
          height: '100%',
          overflowY: 'auto',
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Chat History
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            size="small" 
            onClick={handleNewChat}
            sx={{ bgcolor: 'rgba(142, 68, 173, 0.1)' }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <List sx={{ p: 1 }}>
          {isLoadingHistory ? (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : chatHistory.length === 0 ? (
            <Typography variant="body2" sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
              No chat history yet
            </Typography>
          ) : (
            // Filter out any chats without an ID
            chatHistory
              .filter(chat => Boolean(chat.id || (chat as any)._id))
              .map(chat => {
                const chatId = chat.id || (chat as any)._id;
                return (
                <ListItemButton
                  key={chatId}
                  selected={selectedChat?.id === chatId || (selectedChat as any)?._id === chatId}
                  onClick={() => handleSelectChat(chat)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(142, 68, 173, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(142, 68, 173, 0.15)',
                      }
                    }
                  }}
                >
                  <ChatIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />
                  <ListItemText
                    primary={chat.title}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontSize: '0.875rem',
                      fontWeight: selectedChat?.id === chatId ? 'medium' : 'normal'
                    }}
                    secondary={new Date(chat.lastModified).toLocaleDateString()}
                    secondaryTypographyProps={{
                      noWrap: true,
                      fontSize: '0.75rem'
                    }}
                  />
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Check if chat ID is defined before attempting to delete
                      const chatId = chat.id || (chat as any)._id;
                      if (!chatId) {
                        console.error('Invalid chat object:', chat);
                        setError('Cannot delete chat: missing ID');
                        setShowError(true);
                        return;
                      }
                      
                      console.log('Attempting to delete chat with ID:', chatId);
                      
                      if (window.confirm('Delete this chat?')) {
                        if (!student || !student._id) {
                          setError('Student ID is missing, cannot delete chat');
                          setShowError(true);
                          return;
                        }
                        
                        deleteChat(student._id, chatId)
                          .then(() => {
                            console.log('Successfully deleted chat with ID:', chatId);
                            setChatHistory(prev => prev.filter(c => c.id !== chatId && (c as any)._id !== chatId));
                            if (selectedChat?.id === chatId || (selectedChat as any)?._id === chatId) {
                              setSelectedChat(null);
                              setMessages([]);
                            }
                            setRefreshHistory(prev => prev + 1);
                          })
                          .catch(err => {
                            console.error('Error deleting chat:', err);
                            setError(`Failed to delete chat: ${err.message || 'Unknown error'}`);
                            setShowError(true);
                          });
                      }
                    }}
                    sx={{ 
                      opacity: 0.6,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              );
            })
          )}
        </List>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Chat History Sidebar */}
      {showHistory && renderChatHistorySidebar()}
      
      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        flexGrow: 1,
        overflow: 'hidden'
      }}>
        {/* Messages or Welcome Screen */}
        {messages.length > 0 ? (
          renderChatMessages()
        ) : (
          renderWelcomeScreen()
        )}
        
        {/* Input Area */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(0,0,0,0.1)', 
          backgroundColor: 'white',
          position: 'sticky',
          bottom: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%', 
            maxWidth: '750px',
            position: 'relative'
          }}>
            <TextField
              placeholder="Enter a prompt here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              multiline
              maxRows={5}
              variant="outlined"
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  backgroundColor: '#f8f9fa',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8e44ad',
                    borderWidth: '1px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.2)',
                  },
                  pr: '84px',
                },
                '& .MuiInputBase-input': {
                  padding: '12px 16px',
                },
              }}
            />
            
            <Box sx={{ 
              position: 'absolute', 
              right: '8px', 
              display: 'flex',
              alignItems: 'center'
            }}>
              <IconButton
                color="primary"
                sx={{ p: '8px' }}
              >
                <MicIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                color="primary"
                sx={{ p: '8px' }}
              >
                <ImageIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                sx={{ 
                  p: '8px', 
                  bgcolor: Boolean(input.trim()) ? '#8e44ad' : 'transparent',
                  color: Boolean(input.trim()) ? 'white' : '#8e44ad',
                  '&:hover': {
                    bgcolor: Boolean(input.trim()) ? '#7d3c98' : 'rgba(0,0,0,0.04)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'transparent',
                    color: 'rgba(0,0,0,0.26)',
                  }
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {error}
          {renderRetryButton()}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chatbot; 