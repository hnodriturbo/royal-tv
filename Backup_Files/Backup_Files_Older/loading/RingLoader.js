// File: components/RingLoader.js
// Purpose: Provides a reusable RingLoader component with small, medium, and large sizes.
// Dependency: react-spinners

import { RingLoader } from 'react-spinners'; // Import RingLoader from react-spinners

// RingLoader component
const CustomRingLoader = ({ size = 'medium', color = 'blue' }) => {
  const sizes = {
    small: 50, // Small size
    medium: 100, // Medium size
    large: 150, // Large size
  };

  return <RingLoader size={sizes[size]} color={color} />;
};

export default CustomRingLoader;
