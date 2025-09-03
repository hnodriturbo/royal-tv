'use client';

import { useRef, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useTranslations } from 'next-intl';

const useAuthGuard = (requiredRole) => {
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const router = useRouter();
  const t = useTranslations();

  const [isChecking, setIsChecking] = useState(status === 'loading');
  /* const [redirecting, setRedirecting] = useState(false); */
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (status === 'loading') {
      showLoader({ text: t('common.auth.checking') });
      setIsChecking(true);
    } else {
      if (!redirectingRef.current) hideLoader();
      setIsChecking(false);
    }
  }, [status, showLoader, hideLoader]);

  useEffect(() => {
    if (isChecking || redirectingRef.current) return;

    // No session means the user is considered a "guest"
    const userRole = session?.user?.role || 'guest';

    if (userRole === 'guest') {
      redirectingRef.current = true;
      router.replace('/auth/middlePage?notLoggedIn=true');
      return;
    }
    // 🛑 Role mismatch → send to middlePage with role error
    // If the user has a different role than required, redirect them
    if (requiredRole && userRole !== requiredRole) {
      redirectingRef.current = true;

      // Decide whether to route the user or admin to respective dashboards
      const query = requiredRole === 'admin' ? 'admin=false' : 'user=false';
      router.replace(`/auth/middlePage?${query}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, session, requiredRole, router]);

  const isAllowed = session?.user?.role === requiredRole;

  return {
    isAllowed
  };
};

export default useAuthGuard;
