'use client';

import { createContext, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import RingLoader from '@/components/ui/Loader/RingLoader';
import { useTranslations } from 'next-intl';
import { SafeString } from '@/lib/ui/SafeString';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const t = useTranslations();
  if (!children) throw new Error('LoaderProvider must be wrapped around components.');

  const [isLoading, setIsLoading] = useState(false);
  const [loaderConfig, setLoaderConfig] = useState({
    text: t('common.loader.loading'),
    textClassName: 'text-2xl text-wonderful-5 text-center m-2 z-[9999]',
    size: 'medium',
    color: 'blue',
    background: true
  });

  const timerRef = useRef(null);

  const showLoader = useCallback(
    (...args) => {
      let config = {};
      let time;

      if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
        config = { ...args[0] };
        time = config.time;
      } else {
        if (typeof args[0] === 'number') time = args[0];
        else if (typeof args[0] === 'string') config.text = args[0];

        if (typeof args[1] === 'number') time = args[1];
        else if (typeof args[1] === 'string') config.color = args[1];

        if (typeof args[2] === 'number') time = args[2];
      }

      if (isLoading) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setLoaderConfig((prev) => ({ ...prev, ...config }));
      setIsLoading(true);

      if (typeof time === 'number' && time > 0) {
        timerRef.current = setTimeout(() => {
          setIsLoading(false);
          timerRef.current = null;
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
                text={SafeString(loaderConfig.text || t('common.loader.loading'), 'Loader')}
                textClassName={loaderConfig.textClassName}
              />
            </div>
          </div>,
          document.body
        )}
    </LoaderContext.Provider>
  );
};

export { LoaderContext };
