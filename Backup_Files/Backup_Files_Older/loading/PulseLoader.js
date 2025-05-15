// File: components/CustomPulseLoader.js
// Purpose: Provides a reusable PulseLoader component with small, medium, and large sizes.
// Dependency: react-spinners

import { PulseLoader } from 'react-spinners'; // Import PulseLoader from react-spinners

// PulseLoader component
const CustomPulseLoader = ({ size = 'medium', color = 'green' }) => {
  const sizes = {
    small: 8, // Small size (dot size in px)
    medium: 15, // Medium size
    large: 25, // Large size
  };

  return <PulseLoader size={sizes[size]} color={color} />;
};

export default CustomPulseLoader;
