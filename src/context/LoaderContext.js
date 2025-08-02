// Usages:
//
// showLoader('Some text', 2000);
// showLoader('Some text', 'green');
// showLoader('Text', 'red', 2000);
// showLoader({ text: 'Text', color: 'yellow', time: 4000 });
// showLoader(1500);

'use client';

import React, { createContext, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import RingLoader from '@/components/ui/Loader/RingLoader';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  if (!children) {
    throw new Error('LoaderProvider must be wrapped around components as its children.');
  }

  // let's test some text classes to choose the favorite:
  // 1️⃣ loader-text-glow | Neon blue glow for wow effect!
  // text-2xl font-bold text-center m-2 z-[100] text-blue-400 tracking-wide drop-shadow-glow

  const [isLoading, setIsLoading] = useState(false);
  const [loaderConfig, setLoaderConfig] = useState({
    text: 'Loading...',
    textClassName: 'text2xl text-wonderful-5 text-center m-2 z-[9999]',
    size: 'medium',
    color: 'blue',
    background: true
  });

  const timerRef = useRef(null);

  // 🟡 showLoader: This function can take different argument types to make it super flexible
  const showLoader = useCallback(
    (...loaderArguments) => {
      // 1️⃣ Set up a config object to store all our loader settings
      let config = {};
      // 2️⃣ 'time' will be the number of milliseconds to auto-hide the loader
      let time;

      // -------------------------
      // 🧠 Argument Handling Block
      // -------------------------
      // 👇 If only one argument, and it's an object (not an array), use it as the config
      if (
        loaderArguments.length === 1 &&
        typeof loaderArguments[0] === 'object' &&
        !Array.isArray(loaderArguments[0])
      ) {
        // Example: showLoader({ text: 'Loading...', color: 'red', time: 2000 })
        config = { ...loaderArguments[0] };
        time = config.time;
      } else {
        // 👇 Otherwise, treat arguments as (text, color, time) or (text, time)
        // First argument: could be text or a number (for time)
        if (typeof loaderArguments[0] === 'number') {
          // Example: showLoader(3000) - just a time, default text/color
          time = loaderArguments[0];
        } else if (typeof loaderArguments[0] === 'string') {
          // Example: showLoader('Saving data...')
          config.text = loaderArguments[0];
        }

        // Second argument: could be color or time
        if (typeof loaderArguments[1] === 'number') {
          // Example: showLoader('Saving...', 2000)
          time = loaderArguments[1];
        } else if (typeof loaderArguments[1] === 'string') {
          // Example: showLoader('Saving...', 'blue')
          config.color = loaderArguments[1];
        }

        // Third argument: time (for showLoader('Saving...', 'blue', 2000))
        if (typeof loaderArguments[2] === 'number') {
          // Example: showLoader('Saving...', 'blue', 2000)
          time = loaderArguments[2];
        }
      }

      // 3️⃣ Don't do anything if loader is already visible
      if (isLoading) return;

      // 4️⃣ If a timer is running, clear it (so timers don't stack)
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // 5️⃣ Update the loader config (text/color/etc)
      setLoaderConfig((prevConfig) => ({ ...prevConfig, ...config }));

      // 6️⃣ Show the loader!
      setIsLoading(true);

      // 7️⃣ If time is provided, auto-hide loader after that many ms
      if (typeof time === 'number' && time > 0) {
        timerRef.current = setTimeout(() => {
          setIsLoading(false);
          timerRef.current = null; // clean up
        }, time);
      }
    },
    [isLoading]
  );

  const hideLoader = useCallback(() => {
    setIsLoading(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, isLoading, loaderConfig }}>
      {children}
      {isLoading &&
        ReactDOM.createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center ${
              loaderConfig.background ? 'bg-black/50' : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center lg:ml-64">
              <RingLoader
                size={loaderConfig.size}
                color={loaderConfig.color}
                text={loaderConfig.text}
                textClassName={loaderConfig.textClassName}
              />
              {/* Text, if not inside RingLoader */}
            </div>
          </div>,
          document.body
        )}
    </LoaderContext.Provider>
  );
};

export { LoaderContext };
