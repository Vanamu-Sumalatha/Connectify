import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaUserFriends, 
  FaLightbulb, 
  FaChalkboardTeacher, 
  FaHandsHelping,
  FaComments,
  FaLaptopCode
} from 'react-icons/fa';

const features = [
  {
    icon: FaUserFriends,
    title: 'Peer Learning',
    description: 'Learn and grow together with like-minded students from diverse backgrounds'
  },
  {
    icon: FaLightbulb,
    title: 'Knowledge Sharing',
    description: 'Share your expertise and learn from others in collaborative sessions'
  },
  {
    icon: FaChalkboardTeacher,
    title: 'Expert Mentorship',
    description: 'Get guidance from industry experts and experienced professionals'
  },
  {
    icon: FaHandsHelping,
    title: 'Project Collaboration',
    description: 'Work on real projects with peers and build your portfolio'
  },
  {
    icon: FaComments,
    title: 'Active Discussions',
    description: 'Engage in meaningful discussions and expand your understanding'
  },
  {
    icon: FaLaptopCode,
    title: 'Hands-on Practice',
    description: 'Apply your learning through practical exercises and workshops'
  }
];

const FeatureCard = ({ feature, index }) => {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      className="group"
    >
      <div className="relative p-6 bg-white rounded-xl shadow-lg border border-vibrant-blue/10 h-full">
        {/* Icon Container */}
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className="w-14 h-14 rounded-lg bg-gradient-to-br from-vibrant-blue to-vibrant-blue-dark 
                     flex items-center justify-center mb-4 group-hover:shadow-lg transform transition-all"
        >
          <Icon className="text-2xl text-white" />
        </motion.div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-vibrant-blue-text mb-3">
          {feature.title}
        </h3>
        <p className="text-vibrant-blue-text/70">
          {feature.description}
        </p>

        {/* Animated Border */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-vibrant-blue to-vibrant-blue-dark rounded-b-xl"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          transition={{ duration: 0.8, delay: index * 0.1 }}
          viewport={{ once: true }}
        />
      </div>
    </motion.div>
  );
};

const CommunityFeatures = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-vibrant-blue-bg/30 to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-vibrant-blue-text mb-4"
          >
            Community Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-vibrant-blue-text/80 max-w-2xl mx-auto"
          >
            Join our vibrant community and experience the power of collaborative learning
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <button className="bg-vibrant-blue text-white px-8 py-3 rounded-lg hover:bg-vibrant-blue-dark 
                           transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Join Our Community
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunityFeatures; 