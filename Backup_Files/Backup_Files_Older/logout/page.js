// /auth/logout/page.js
'use client';

import React, { useEffect } from 'react';
import { signOut } from 'next-auth/react'; // import signOut
import useAppRedirectHandlers from '@/hooks/useAppRedirectHandlers';

const LogoutPage = () => {
  const { redirectWithMessage } = useAppRedirectHandlers();

  useEffect(() => {
    (async () => {
      // Sign out from NextAuth without auto redirect
      await signOut({ redirect: false });
      // Then display logout message and loader before redirecting
      redirectWithMessage({
        target: '/', // Home page
        message: 'Logout successful. Redirecting to Home Page...',
        loaderText: 'Logging you out...',
        pageDelay: 5000, // 5-second delay
        color: 'success',
      });
    })();
  }, [redirectWithMessage]);

  return null;
};

export default LogoutPage;
