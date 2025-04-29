import React from 'react';

const QuizResults = ({ quiz, onClose }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 70) return 'Good job!';
    if (score >= 50) return 'Keep practicing!';
    return 'You might want to review the material.';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
          <p className="text-gray-600">{quiz.description}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-center items-center mb-4">
            <div
              className={`text-4xl font-bold ${getScoreColor(quiz.score)}`}
            >
              {quiz.score}%
            </div>
          </div>
          <p className="text-center text-lg mb-2">{getScoreMessage(quiz.score)}</p>
          <p className="text-center text-gray-600">
            Time spent: {Math.floor(quiz.timeSpent / 60)} minutes{' '}
            {quiz.timeSpent % 60} seconds
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults; 