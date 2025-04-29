import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ChatState, ChatHistory, Message } from './schema';

type ChatAction =
  | { type: 'SET_CURRENT_CHAT'; payload: ChatHistory | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_CHAT_HISTORY'; payload: ChatHistory }
  | { type: 'DELETE_CHAT'; payload: string };

const initialState: ChatState = {
  currentChat: null,
  chatHistory: [],
  isLoading: false,
  error: null,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
    case 'ADD_MESSAGE':
      if (!state.currentChat) return state;
      return {
        ...state,
        currentChat: {
          ...state.currentChat,
          messages: [...state.currentChat.messages, action.payload],
          updatedAt: new Date(),
        },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_CHAT_HISTORY':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload],
      };
    case 'DELETE_CHAT':
      return {
        ...state,
        chatHistory: state.chatHistory.filter((chat) => chat.id !== action.payload),
        currentChat: state.currentChat?.id === action.payload ? null : state.currentChat,
      };
    default:
      return state;
  }
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
} | null>(null);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 