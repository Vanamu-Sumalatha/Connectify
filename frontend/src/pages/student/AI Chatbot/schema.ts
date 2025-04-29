export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export interface Chat {
  id: string;
  studentId: string;
  title: string;
  messages: Message[];
  lastModified: Date;
  messageCount: number;
  isArchived: boolean;
  timestamp?: Date;
  _id?: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  currentChat: ChatHistory | null;
  chatHistory: ChatHistory[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export interface ChatRequest {
  message: string;
  chatId?: string;
} 