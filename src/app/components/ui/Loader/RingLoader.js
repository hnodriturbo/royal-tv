'use client';

import React from 'react';
import { RingLoader as Spinner } from 'react-spinners'; // Renamed to avoid conflicts

const CustomRingLoader = ({
  size = 'medium',
  color = 'blue',
  text = '',
  textClassName = '',
}) => {
  const sizeMap = {
    small: 30,
    medium: 60,
    large: 90,
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Spinner size={sizeMap[size]} color={color} />
      {text && <p className={`mt-4 ${textClassName}`}>{text}</p>}
    </div>
  );
};

export default CustomRingLoader;
