// 📌 CountdownBanner.jsx - shows a thank you message and hides it after countdown

'use client';

import { useEffect, useState } from 'react';

const CountdownBanner = ({ seconds = 10, onComplete, message = 'Thank you!' }) => {
  const [countdown, setCountdown] = useState(seconds);

  // ⏳ Start the countdown when mounted
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((number) => number - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete?.(); // ✅ Call the optional onComplete callback
    }
  }, [countdown, onComplete]);

  // ✅ Render countdown banner
  return (
    <div className="container-style p-6 text-3xl text-center mb-6 font-semibold lg:w-8/12 w-11/12">
      <p>
        {message} ({countdown})
      </p>
    </div>
  );
};

export default CountdownBanner;
