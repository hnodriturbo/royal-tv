'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Updated for App Router compatibility

const CountdownRedirect = ({
  seconds,
  redirectTo,
  message,
  messageSize = 'text-3xl', // Default size for the message
  counterSize = 'text-2xl', // Default size for the counter
  children,
}) => {
  const [counter, setCounter] = useState(seconds);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          clearInterval(interval); // Stop the interval
          // Use a separate function for navigation to avoid updating state while rendering
          setTimeout(() => router.push(redirectTo), 0);
          return 0;
        }
        return prev - 1; // Decrement the counter
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [redirectTo, router]);

  return (
    <div className="flex items-center justify-center flex-col min-h-screen">
      <div className="flex items-center justify-center">
        <div className="container-style p-6 items-center justify-center">
          <h2 className={`${messageSize} font-bold text-center`}>{message}</h2>
          <p className={`${counterSize} mt-3 items-center text-center`}>
            Redirecting in {counter} second{counter !== 1 && 's'}...
          </p>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CountdownRedirect;
