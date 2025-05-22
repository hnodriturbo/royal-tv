import useLoaderHandler from '@/hooks/useLoaderHook';
import useMessageHandler from '@/hooks/useMessageHook';
import { useMemo } from 'react';

const useAppHandlers = () => {
  const loader = useLoaderHandler();
  const message = useMessageHandler();

  // Return with useMemo to memoize the return value so it doesnt trigger unintential re-renders
  return useMemo(() => ({ ...loader, ...message }), [loader, message]);
};

export default useAppHandlers;
