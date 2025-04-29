// src/components/CallToAction.tsx

import React from 'react';

const CallToAction = () => {
  return (
    <section className="py-20 bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-blue-700">
          Ready to level up your skills?
        </h2>
        <p className="text-lg md:text-xl mb-10 text-blue-600">
          Join our community of passionate learners today
        </p>
        <button className="inline-block bg-blue-600 text-white font-semibold text-lg px-8 py-3 rounded-xl shadow-md hover:bg-blue-700 transition duration-300">
          Get Started for Free
        </button>
      </div>
    </section>
  );
};

export default CallToAction;
