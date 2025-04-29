import React, { useState } from 'react';
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  const faqs = [
    {
      question: 'How do I enroll in a course?',
      answer:
        'To enroll in a course, navigate to the Courses section, browse through available courses, and click on the "Enroll" button for your chosen course. You may need to complete payment if the course has a fee.',
    },
    {
      question: 'How do I access my course materials?',
      answer:
        'Once enrolled, you can access your course materials through the "My Courses" section. All materials, including videos, documents, and assignments, will be available there.',
    },
    {
      question: 'How do I submit assignments?',
      answer:
        'Go to the specific course, find the assignment section, and click on the assignment you want to submit. You can upload files, type responses, or complete quizzes as required.',
    },
    {
      question: 'How do I track my progress?',
      answer:
        'Your progress is automatically tracked in the dashboard. You can view completed lessons, quiz scores, and overall course progress in the "Progress" section.',
    },
    {
      question: 'How do I contact my instructor?',
      answer:
        'You can contact your instructor through the course discussion forum or by sending a direct message through the messaging system.',
    },
  ];

  const helpCategories = [
    {
      title: 'Getting Started',
      icon: <BookOpenIcon className="w-6 h-6" />,
      items: [
        'Account Setup',
        'Course Navigation',
        'Profile Management',
        'Payment Methods',
      ],
    },
    {
      title: 'Learning Resources',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      items: [
        'Course Materials',
        'Video Lectures',
        'Assignments',
        'Quizzes and Tests',
      ],
    },
    {
      title: 'Communication',
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      items: [
        'Discussion Forums',
        'Direct Messaging',
        'Group Projects',
        'Instructor Contact',
      ],
    },
    {
      title: 'Technical Support',
      icon: <QuestionMarkCircleIcon className="w-6 h-6" />,
      items: [
        'Browser Requirements',
        'Video Playback',
        'File Upload Issues',
        'Account Recovery',
      ],
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {helpCategories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="text-blue-600 mr-3">{category.icon}</div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {category.title}
                </h2>
              </div>
              <ul className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="text-gray-600 hover:text-blue-600 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedSection(expandedSection === index ? null : index)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50"
                >
                  <span className="text-left font-medium text-gray-900">
                    {faq.question}
                  </span>
                  {expandedSection === index ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedSection === index && (
                  <div className="px-4 py-3 bg-gray-50">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Need More Help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <PhoneIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Phone Support</h3>
                <p className="text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Email Support</h3>
                <p className="text-gray-600">support@connectify.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help; 