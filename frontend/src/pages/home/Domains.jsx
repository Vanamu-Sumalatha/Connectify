import React from 'react';
import { motion } from 'framer-motion';
import banner1 from './Images/banner1.jpg';
import image1 from './Images/image.jpg';
import image2 from './Images/image (1).jpg';
import { FaCode, FaRobot, FaBrain, FaComments, FaChartLine, FaPaintBrush, FaBook, FaMobileAlt } from 'react-icons/fa';

const domains = [
  {
    name: 'Web Development',
    icon: FaCode,
    description: 'Master modern web technologies and frameworks',
    image: banner1
  },
  {
    name: 'AI/ML',
    icon: FaRobot,
    description: 'Explore artificial intelligence and machine learning',
    image: image1
  },
  {
    name: 'Aptitude Training',
    icon: FaBrain,
    description: 'Enhance your logical and analytical skills',
    image: image2
  },
  {
    name: 'Communication Skills',
    icon: FaComments,
    description: 'Develop effective communication abilities',
    image: banner1
  },
  {
    name: 'Finance',
    icon: FaChartLine,
    description: 'Learn financial management and analysis',
    image: image1
  },
  {
    name: 'UI/UX Design',
    icon: FaPaintBrush,
    description: 'Create beautiful and functional interfaces',
    image: image2
  },
  {
    name: 'Non-IT Essentials',
    icon: FaBook,
    description: 'Essential skills for non-IT professionals',
    image: banner1
  },
  {
    name: 'Mobile Development',
    icon: FaMobileAlt,
    description: 'Build native and cross-platform mobile apps',
    image: image1
  }
];

const DomainCard = ({ domain }) => {
  const Icon = domain.icon;
  
  return (
    <motion.div
      className="flex-shrink-0 w-[300px] mx-4"
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-lg group">
        <div className="relative h-40 overflow-hidden">
          <img 
            src={domain.image} 
            alt={domain.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center space-x-2">
              <Icon className="text-2xl" />
              <h3 className="text-xl font-semibold">{domain.name}</h3>
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-vibrant-blue-text/80 mb-4">
            {domain.description}
          </p>
          <button className="w-full bg-vibrant-blue text-white py-2 px-4 rounded-lg hover:bg-vibrant-blue-dark transition-colors duration-300">
            Enroll Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const InfiniteScroll = () => {
  return (
    <div className="relative overflow-hidden w-full">
      <motion.div
        className="flex"
        animate={{
          x: [0, -1920],
        }}
        transition={{
          x: {
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {/* First set of cards */}
        {domains.map((domain, index) => (
          <DomainCard key={`first-${index}`} domain={domain} />
        ))}
        {/* Duplicate set for seamless loop */}
        {domains.map((domain, index) => (
          <DomainCard key={`second-${index}`} domain={domain} />
        ))}
      </motion.div>
    </div>
  );
};

const Domains = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-vibrant-blue-bg/30 to-white" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2 
            className="text-4xl font-bold text-vibrant-blue-text mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Popular Domains
          </motion.h2>
          <motion.p 
            className="text-lg text-vibrant-blue-text/80"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Explore our diverse range of learning domains and start your journey today
          </motion.p>
        </div>
        
        <InfiniteScroll />
      </div>
    </section>
  );
};

export default Domains; 