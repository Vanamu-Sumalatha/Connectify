import React, { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

/**
 * Confetti component that shows celebration animation
 * @param {boolean} show - Whether to show the confetti
 * @param {number} duration - How long to show the confetti in ms
 */
const Confetti = ({ show = false, duration = 5000 }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Set up window dimensions for confetti
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Handle showing and hiding confetti based on props
  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      
      // Hide confetti after duration
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [show, duration]);
  
  if (!showConfetti) return null;
  
  return (
    <ReactConfetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.2}
      colors={[
        '#FF0000', // Red
        '#00FF00', // Green
        '#0000FF', // Blue
        '#FFFF00', // Yellow
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
        '#FFA500', // Orange
        '#800080'  // Purple
      ]}
    />
  );
};

export default Confetti; 