// File: components/Spinner.js
// Purpose: This file defines a reusable Spinner component to display a loading animation.
//          It uses Framer Motion for smooth rotation animation and Tailwind CSS for styling.
// Features: Accepts a `size` prop to render the spinner in small, medium, or large sizes.
// Dependencies: Framer Motion, Tailwind CSS

// Import necessary dependencies
'use client'; // Enabling client-side rendering
import { motion } from 'framer-motion';

// Define the Spinner component
const Spinner = ({ size = 'medium' }) => {
  // Map sizes to corresponding Tailwind classes for width and height
  const sizes = {
    small: 'w-6 h-6', // Small spinner
    medium: 'w-10 h-10', // Default size
    large: 'w-16 h-16', // Large spinner
  };

  return (
    // Animate the spinner with Framer Motion
    <motion.div
      className={`border-4 border-gray-200 border-t-blue-500 rounded-full ${sizes[size]}`}
      animate={{ rotate: 360 }} // Continuous rotation animation
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} // Smooth looping animation
    />
  );
};

export default Spinner; // Export the Spinner component for use in other parts of the app
