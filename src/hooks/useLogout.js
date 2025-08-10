import logger from '@/lib/core/logger';
import { signOut } from 'next-auth/react';

const useLogout = () => {
  const logout = async () => {
    try {
      await signOut({ callbackUrl: '/auth/middlePage?logout=true' });
    } catch (error) {
      logger.error('Error logging out:', error);
    }
  };

  return logout;
};

export default useLogout;
