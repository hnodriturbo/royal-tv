'use client';

import React from 'react';
import useAppHandlers from '@/hooks/useAppHandlers';

const ExamplePage = () => {
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  const handleSuccessMessage = () =>
    displayMessage('Operation successful!', 'success', 3);
  const handleErrorMessage = () =>
    displayMessage('An error occurred.', 'error', 3);
  const handleWarningMessage = () =>
    displayMessage('This is a warning!', 'warning', 3);

  const handleLoaderSmall = () => {
    showLoader({ text: 'Processing...', size: 'small', color: 'blue' });
    setTimeout(hideLoader, 2000);
  };

  const handleLoaderMedium = () => {
    showLoader({
      text: 'Loading medium task...',
      size: 'medium',
      color: 'green',
    });
    setTimeout(hideLoader, 3000);
  };

  const handleLoaderLarge = () => {
    showLoader({
      text: 'Performing large operation...',
      size: 'large',
      color: 'red',
    });
    setTimeout(hideLoader, 5000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-gray-100">
      <h1 className="text-3xl font-bold">Unified Handlers Demo</h1>
      <div className="grid grid-cols-1 gap-4 pc:grid-cols-3">
        {/* Message Buttons */}
        <button
          onClick={handleSuccessMessage}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Show Success Message
        </button>
        <button
          onClick={handleErrorMessage}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Show Error Message
        </button>
        <button
          onClick={handleWarningMessage}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Show Warning Message
        </button>

        {/* Loader Buttons */}
        <button
          onClick={handleLoaderSmall}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Small Loader
        </button>
        <button
          onClick={handleLoaderMedium}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Medium Loader
        </button>
        <button
          onClick={handleLoaderLarge}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Large Loader
        </button>
      </div>
    </div>
  );
};

export default ExamplePage;
