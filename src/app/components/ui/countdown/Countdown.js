'use client';

import { useState, useEffect } from 'react';

const SimpleCountdown = ({ seconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  // Starting the useEffect on mounting the component
  useEffect(() => {
    // If timer completes or gets to zero then onComplete() runs to tell the timer it's done
    if (timeLeft <= 0) {
      if (onComplete) {
        onComplete();
        return;
      }
    }

    // Set the timer to countdown 1 second by second
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer); // Cleanup the interval on unmounting the component
  }, [timeLeft, onComplete]);

  return (
    <span>
      {timeLeft} second{timeLeft !== 1 && 's'} remaining...
    </span>
  );
};

// Export the default simple countdown timer
export default SimpleCountdown;
