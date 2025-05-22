// File: components/CustomClipLoader.js
// Purpose: Provides a reusable ClipLoader component with small, medium, and large sizes.
// Dependency: react-spinners

import { ClipLoader } from 'react-spinners'; // Import ClipLoader from react-spinners

// ClipLoader component
const CustomClipLoader = ({ size = 'medium', color = 'red' }) => {
  const sizes = {
    small: 30, // Small size (circle diameter in px)
    medium: 50, // Medium size
    large: 80, // Large size
  };

  return <ClipLoader size={sizes[size]} color={color} />;
};

export default CustomClipLoader;
