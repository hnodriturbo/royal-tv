// File: components/RoutingLoader.js
// Purpose: Display a loading spinner during route transitions in a Next.js application.
// Dependency: CustomRingLoader or any other loader component.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CustomRingLoader from '@components/CustomRingLoader'; // Import the RingLoader or any spinner

const RoutingLoader = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => setLoading(true); // Show loader on route start
    const handleComplete = () => setLoading(false); // Hide loader on route complete

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    // Cleanup event listeners on component unmount
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Conditionally render the loading spinner
  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <CustomRingLoader size="large" color="blue" />
    </div>
  );
};

export default RoutingLoader;
