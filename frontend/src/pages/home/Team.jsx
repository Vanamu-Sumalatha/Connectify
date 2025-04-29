import React from 'react';
import { motion } from 'framer-motion';
import { FaLinkedin, FaGithub, FaTwitter } from 'react-icons/fa';
import image1 from './Images/image.jpg';
import image2 from './Images/image (1).jpg';
import ravi from './Images/ravi.jpg';
import mouli from './Images/mouli.jpg';
import banner1 from './Images/banner1.jpg';
import logo from './Images/logo.jpg';

const teamMembers = [
 
  {
    name: 'Kuncherla Pavani',
    role: 'Frontend Developer',
    image: image2,
    socials: {
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      twitter: 'https://twitter.com'
    }
  },
  {
    name: 'Kuncherla Malathi',
    role: 'UI/UX Designer',
    image: banner1,
    socials: {
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      twitter: 'https://twitter.com'
    }
  },

  {
    name: 'D.LK Mouli',
    role: 'Backend Developer',
    image: mouli,
    socials: {
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      twitter: 'https://twitter.com'
    }
  },
  {
    name: 'Ravikumar',
    role: 'Project Lead & Full Stack Dev',
    image: ravi,
    socials: {
      linkedin: 'https://linkedin.com',
      github: 'https://github.com/u/Ravikumar-1032',
      twitter: 'https://twitter.com'
    }
  },
  {
    name: 'Putta Harinath',
    role: 'REST API Integration',
    image: image1,
    socials: {
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      twitter: 'https://twitter.com'
    }
  }
];

const TeamMemberCard = ({ member, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="flex-shrink-0 w-[300px] mx-4"
    >
      <div className="bg-white rounded-xl p-6 shadow-lg border border-vibrant-blue/10">
        <div className="relative mb-6 group">
          {/* Profile Image */}
          <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-vibrant-blue/20 
                        group-hover:border-vibrant-blue transition-colors duration-300">
            <motion.img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Glowing Effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-vibrant-blue/20 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300"
            initial={false}
            whileHover={{ scale: 1.2 }}
          />
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-vibrant-blue-text mb-1">
            {member.name}
          </h3>
          <p className="text-vibrant-blue-text/70 mb-4">
            {member.role}
          </p>
          
          {/* Social Links */}
          <div className="flex justify-center space-x-4">
            <motion.a
              href={member.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.2, color: '#0077B5' }}
              className="text-vibrant-blue-text/60 hover:text-vibrant-blue transition-colors"
            >
              <FaLinkedin size={20} />
            </motion.a>
            <motion.a
              href={member.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.2, color: '#333' }}
              className="text-vibrant-blue-text/60 hover:text-vibrant-blue transition-colors"
            >
              <FaGithub size={20} />
            </motion.a>
            <motion.a
              href={member.socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.2, color: '#1DA1F2' }}
              className="text-vibrant-blue-text/60 hover:text-vibrant-blue transition-colors"
            >
              <FaTwitter size={20} />
            </motion.a>
          </div>
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
          x: [0, -1500],
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
        {teamMembers.map((member, index) => (
          <TeamMemberCard key={`first-${index}`} member={member} index={index} />
        ))}
        {/* Duplicate set for seamless loop */}
        {teamMembers.map((member, index) => (
          <TeamMemberCard key={`second-${index}`} member={member} index={index} />
        ))}
      </motion.div>
    </div>
  );
};

const Team = () => {
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
            Meet Our Team
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-vibrant-blue-text/80 max-w-2xl mx-auto"
          >
            The passionate individuals behind Connectify who make learning accessible and enjoyable
          </motion.p>
        </div>

        {/* Team Members Carousel */}
        <InfiniteScroll />
      </div>
    </section>
  );
};

export default Team; 