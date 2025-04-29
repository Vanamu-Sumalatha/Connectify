import fetch from 'node-fetch';

async function testApi() {
  try {
    console.log('Testing API endpoint...');
    const response = await fetch('http://192.168.30.126:5000/api/student/tests/test123/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with a valid token if needed
      },
      body: JSON.stringify({
        attemptId: 'test-attempt',
        answers: [],
        score: 85,
        totalPoints: 100,
        percentageScore: 85,
        correctAnswers: 17,
        totalQuestions: 20,
        passed: true,
        timeSpent: 1500,
        securityViolations: 0,
        completedAt: new Date().toISOString()
      })
    });

    const data = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('API is working!');
    } else {
      console.log('API returned an error status.');
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.log('API is not working or cannot be reached.');
  }
}

testApi(); 