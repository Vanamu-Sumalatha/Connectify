import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaLaptopCode,
  FaChalkboardTeacher,
  FaBrain,
  FaRocket
} from 'react-icons/fa';
import image1 from './Images/image.jpg';
import image2 from './Images/image (1).jpg';
import banner1 from './Images/banner1.jpg';

const events = [
  {
    title: 'Web Dev Workshop',
    date: '2024-04-15',
    time: '10:00 AM - 2:00 PM',
    location: 'Virtual Event',
    type: 'Workshop',
    icon: FaLaptopCode,
    image: image1,
    attendees: 150,
    description: 'Learn modern web dev techniques from industry experts'
  },
  {
    title: 'AI/ML Masterclass',
    date: '2024-04-20',
    time: '3:00 PM - 6:00 PM',
    location: 'Tech Hub',
    type: 'Masterclass',
    icon: FaBrain,
    image: image2,
    attendees: 100,
    description: 'Deep dive into artificial intelligence and machine learning concepts'
  },
  {
    title: 'Career Growth Summit',
    date: '2024-04-25',
    time: '9:00 AM - 5:00 PM',
    location: 'Innovation Center',
    type: 'Summit',
    icon: FaRocket,
    image: banner1,
    attendees: 200,
    description: 'Accelerate your career with insights from industry expert leaders'
  },
  {
    title: 'Mentorship Program',
    date: '2024-05-01',
    time: '2:00 PM - 4:00 PM',
    location: 'Virtual Event',
    type: 'Program',
    icon: FaChalkboardTeacher,
    image: image1,
    attendees: 75,
    description: 'One-on-one mentorship sessions with experienced professionals'
  }
];

const EventCard = ({ event, index }) => {
  const Icon = event.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-vibrant-blue/10">
        {/* Event Image */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          <div className="absolute top-4 left-4">
            <div className="bg-vibrant-blue text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
              <Icon className="text-base" />
              <span>{event.type}</span>
            </div>
          </div>
        </div>

        {/* Event Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-vibrant-blue-text mb-3">
            {event.title}
          </h3>
          <p className="text-vibrant-blue-text/70 mb-4">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2">
            <div className="flex items-center text-vibrant-blue-text/70">
              <FaCalendarAlt className="mr-2" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center text-vibrant-blue-text/70">
              <FaClock className="mr-2" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-vibrant-blue-text/70">
              <FaMapMarkerAlt className="mr-2" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center text-vibrant-blue-text/70">
              <FaUsers className="mr-2" />
              <span>{event.attendees} attendees</span>
            </div>
          </div>

          {/* Register Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 bg-vibrant-blue text-white py-2 px-4 rounded-lg hover:bg-vibrant-blue-dark 
                     transition-colors duration-300 flex items-center justify-center space-x-2"
          >
            <span>Register Now</span>
          </motion.button>
        </div>

        {/* Bottom Progress Bar */}
        <motion.div
          className="h-1 bg-gradient-to-r from-vibrant-blue to-vibrant-blue-dark"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          transition={{ duration: 0.8, delay: index * 0.1 }}
          viewport={{ once: true }}
        />
      </div>
    </motion.div>
  );
};

const Events = () => {
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
            Upcoming Events
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-vibrant-blue-text/80 max-w-2xl mx-auto"
          >
            Join our exciting events and enhance your learning journey
          </motion.p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {events.map((event, index) => (
            <EventCard key={index} event={event} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Events; 