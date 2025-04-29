import React from 'react';
import { motion } from 'framer-motion';
import { FaUserPlus, FaBookReader, FaUsers, FaCertificate } from 'react-icons/fa';

const steps = [
  {
    icon: FaUserPlus,
    title: 'Sign Up',
    description: 'Create your account & join our learning community'
  },
  {
    icon: FaBookReader,
    title: 'Choose Your Path',
    description: 'Select from our diverse range of learning domains'
  },
  {
    icon: FaUsers,
    title: 'Learn Together',
    description: 'Connect with peers and mentors in your field'
  },
  {
    icon: FaCertificate,
    title: 'Get Certified',
    description: 'Complete courses and earn recognized certificates'
  }
];

const StepCard = ({ step, index }) => {
  const Icon = step.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="flex-1 min-w-[250px]"
    >
      <div className="relative p-6">
        {/* Connector Line */}
        {index !== steps.length - 1 && (
          <div className="hidden md:block absolute top-1/2 right-0 w-full h-0.5 bg-gradient-to-r from-blue-300 to-blue-500 -z-10" />
        )}
        
        {/* Card Content */}
        <div className="relative bg-white rounded-xl p-6 shadow-lg border border-blue-100">
          <div className="flex flex-col items-center text-center">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4"
            >
              <Icon className="text-3xl text-blue-600" />
            </motion.div>
            <h3 className="text-xl font-semibold text-blue-700 mb-2">
              {step.title}
            </h3>
            <p className="text-blue-600/80">
              {step.description}
            </p>
          </div>
          
          {/* Bottom Highlight */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700 rounded-b-xl"
            initial={{ width: 0 }}
            whileInView={{ width: '100%' }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            viewport={{ once: true }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const HowItWorks = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-white to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-blue-700 mb-4"
          >
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
              How It Works
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-blue-700/80 max-w-2xl mx-auto"
          >
            Get started with Connectify in four simple steps
          </motion.p>
        </div>

        {/* Steps Container */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-4">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-200/30"
            style={{
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default HowItWorks; 