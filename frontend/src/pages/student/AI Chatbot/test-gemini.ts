import { sendMessage } from './api';

// Test function to verify Gemini API integration
export const testGeminiAPI = async () => {
  console.log('Testing Gemini API integration...');
  
  try {
    const response = await sendMessage({
      message: 'Hello, can you tell me about yourself?',
      chatHistory: []
    });
    
    console.log('Gemini API Test Response:', response);
    
    if (response.error) {
      console.error('Gemini API Test Error:', response.error);
      return false;
    }
    
    console.log('Gemini API Test Successful!');
    return true;
  } catch (error) {
    console.error('Gemini API Test Failed:', error);
    return false;
  }
};

// Function to run the test from the browser console
export const runGeminiTest = async () => {
  const result = await testGeminiAPI();
  if (result) {
    console.log('✅ Gemini API integration test passed!');
  } else {
    console.error('❌ Gemini API integration test failed!');
  }
  return result;
}; 