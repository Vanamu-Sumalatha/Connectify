import { sendMessage } from './api';
import { Message } from './schema';

// Debug utility to test the Gemini API with different prompts
export const debugGeminiAPI = async (prompt: string, chatHistory: Message[] = []) => {
  console.log('🔍 Debugging Gemini API with prompt:', prompt);
  console.log('Chat history:', chatHistory);
  
  try {
    const startTime = Date.now();
    const response = await sendMessage({
      message: prompt,
      chatHistory
    });
    const endTime = Date.now();
    
    console.log(`⏱️ Response time: ${endTime - startTime}ms`);
    console.log('📝 Response:', response);
    
    return response;
  } catch (error) {
    console.error('❌ Debug error:', error);
    throw error;
  }
};

// Utility to format chat history for display
export const formatChatHistory = (messages: Message[]): string => {
  return messages.map(msg => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    return `${role} (${time}): ${msg.content}`;
  }).join('\n\n');
};

// Utility to check API key validity
export const checkAPIKeyValidity = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCnAn6zPWwL66uVk6EoJ7ELhb2uB2VRdsk');
    const data = await response.json();
    
    if (response.ok && data.models && data.models.length > 0) {
      console.log('✅ API key is valid');
      return true;
    } else {
      console.error('❌ API key is invalid or has insufficient permissions');
      console.error('API response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking API key:', error);
    return false;
  }
};

// Define the result type for rate limiting tests
interface RateLimitTestResult {
  success: boolean;
  error?: string;
  timestamp: number;
}

// Utility to test rate limiting
export const testRateLimiting = async (numRequests: number = 5, delayMs: number = 1000): Promise<void> => {
  console.log(`🧪 Testing rate limiting with ${numRequests} requests...`);
  
  const results: RateLimitTestResult[] = [];
  const startTime = Date.now();
  
  for (let i = 0; i < numRequests; i++) {
    try {
      console.log(`Request ${i + 1}/${numRequests}...`);
      const response = await sendMessage({
        message: `Test request ${i + 1}`,
        chatHistory: []
      });
      
      results.push({
        success: !response.error,
        error: response.error,
        timestamp: Date.now()
      });
      
      if (i < numRequests - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error: any) {
      results.push({
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`⏱️ Total time: ${totalTime}ms`);
  console.log('📊 Results:', results);
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Success rate: ${successCount}/${numRequests} (${(successCount / numRequests * 100).toFixed(1)}%)`);
}; 