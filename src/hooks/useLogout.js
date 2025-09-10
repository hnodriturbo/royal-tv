/**
 * src/hooks/useLogout
 * This file handles using the hook of logging out users
 */

'use client';
import { signOut } from 'next-auth/react';

const useLogout = () => {
  const logout = async () => {
    try {
      await signOut({ callbackUrl: '/auth/middlePage?logout=true' });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return logout;
};

export default useLogout;
