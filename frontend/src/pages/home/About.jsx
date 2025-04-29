import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { FaBookOpen, FaUsers, FaLayerGroup } from 'react-icons/fa';
import banner1 from './Images/banner1.jpg';
import image1 from './Images/image.jpg';
import image2 from './Images/image (1).jpg';

const StatCard = ({ end, duration = 2, label, icon: Icon }) => {
  const [count, setCount] = React.useState(0);
  const counterRef = useRef(null);
  const isInView = useInView(counterRef, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / (duration * 1000);

        if (progress < 1) {
          setCount(Math.floor(end * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return (
    <motion.div
      ref={counterRef}
      className="relative overflow-hidden"
      whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(37, 99, 235, 0.2)" }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="p-6 rounded-2xl bg-white shadow-lg border border-blue-100">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600">
            <Icon size={32} />
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-700 flex items-baseline">
              {count}
              <span className="text-xl ml-1">+</span>
            </div>
            <div className="text-lg font-medium text-blue-800/80">{label}</div>
          </div>
        </div>
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-blue-600"
          initial={{ width: 0 }}
          animate={isInView ? { width: "100%" } : { width: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};

const FeatureCard = ({ title, description, imageSrc }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 10px 30px -10px rgba(37, 99, 235, 0.2)",
      }}
      className="relative overflow-hidden group"
    >
      <div className="p-6 rounded-xl bg-white shadow-lg border border-blue-100">
        <div className="mb-6 relative">
          <div className="w-full h-48 rounded-lg overflow-hidden">
            <img 
              src={imageSrc} 
              alt={title}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-blue-700 mb-3">
          {title}
        </h3>
        <p className="text-blue-800/80">
          {description}
        </p>
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-blue-600"
          initial={{ width: 0 }}
          animate={isInView ? { width: "100%" } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};

const About = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [controls, isInView]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="py-20 bg-blue-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="space-y-16"
        >
          {/* About Content */}
          <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-blue-700 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                About Connectify
              </span>
            </h2>
            <p className="text-lg text-blue-800/80 mb-8">
              We're building a vibrant community where students can connect, share knowledge,
              and grow together. Our platform brings together learners and experts from
              various domains to create an enriching learning environment.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <StatCard 
                end={50} 
                label="Active Domains" 
                icon={FaLayerGroup}
                duration={2.5}
              />
              <StatCard 
                end={1000} 
                label="Members Joined" 
                icon={FaUsers}
                duration={2.5}
              />
              <StatCard 
                end={500} 
                label="Resources Shared" 
                icon={FaBookOpen}
                duration={2.5}
              />
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <FeatureCard
                title="Focused Learning"
                description="Structured learning paths and domain-specific resources to help you master your field."
                imageSrc={banner1}
              />
              <FeatureCard
                title="Community Support"
                description="Connect with peers and mentors who share your passion for learning and growth."
                imageSrc={image1}
              />
              <FeatureCard
                title="Rich Resources"
                description="Access a growing library of curated learning materials and practical examples."
                imageSrc={image2}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About; 