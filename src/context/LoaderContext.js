'use client';

import React, { createContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import RingLoader from '@/components/ui/Loader/RingLoader';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  if (!children) {
    throw new Error(
      'LoaderProvider must be wrapped around components as its children.',
    );
  }

  const [isLoading, setIsLoading] = useState(false);
  const [loaderConfig, setLoaderConfig] = useState({
    text: 'Loading...',
    textClassName: 'text-2xl font-semibold text-center m-2 z-40',
    size: 'medium',
    color: 'blue',
    background: true,
  });

  const showLoader = useCallback(
    (config = {}) => {
      if (isLoading) return; // Prevent re-triggering
      setLoaderConfig((prevConfig) => ({ ...prevConfig, ...config }));
      setIsLoading(true);
    },
    [isLoading],
  );

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <LoaderContext.Provider
      value={{ showLoader, hideLoader, isLoading, loaderConfig }}
    >
      {children}
      {isLoading &&
        ReactDOM.createPortal(
          <div
            className={`fixed inset-0 flex items-center justify-center z-40 ${
              loaderConfig.background ? 'bg-black bg-opacity-50' : ''
            }`}
          >
            <RingLoader
              size={loaderConfig.size}
              color={loaderConfig.color}
              text={loaderConfig.text}
              textClassName={loaderConfig.textClassName}
            />
          </div>,
          document.body,
        )}
    </LoaderContext.Provider>
  );
};

export { LoaderContext };
