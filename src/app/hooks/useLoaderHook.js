import { useContext } from 'react';
import { LoaderContext } from '@/context/LoaderContext';
import CustomRingLoader from '@/components/ui/Loader/RingLoader';

// Hook to use the loader functionality
const useLoaderHandler = () => {
  const { showLoader, hideLoader, isLoading, loaderConfig } =
    useContext(LoaderContext);

  /**
   * Executes an asynchronous function with the loader shown during execution.
   * @param {Function} asyncFunction - The async function to execute.
   * @param {Object} config - Loader configuration overrides.
   */
  const withLoader = async (asyncFunction, config = {}) => {
    try {
      showLoader(config);
      await asyncFunction();
    } finally {
      hideLoader();
    }
  };

  return {
    showLoader,
    hideLoader,
    withLoader,
    isLoading,
    loaderConfig,
    CustomRingLoader,
  };
};

export default useLoaderHandler;
