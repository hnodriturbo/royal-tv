'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import useAppHandlers from '@/hooks/useAppHandlers';

const useAuthGuard = (requiredRole) => {
  const { data: session, status } = useSession();
  const { showLoader, hideLoader } = useAppHandlers();
  const _router = useRouter();
  const t = useTranslations();
  const locale = useLocale(); // ✅ top-level (not inside effects)

  const [isChecking, setIsChecking] = useState(status === 'loading');

  // show/hide loader while session is loading
  useEffect(() => {
    if (status === 'loading') {
      showLoader({ text: t('common.auth.checking') });
      setIsChecking(true);
    } else {
      hideLoader();
      setIsChecking(false);
    }
  }, [status, showLoader, hideLoader, t]);

  const userRole = session?.user?.role || 'guest';
  const isAllowed = requiredRole ? userRole === requiredRole : Boolean(session);

  // compute redirect URL for the caller to use
  const redirect = useMemo(() => {
    if (isChecking) return null;

    if (userRole === 'guest') {
      return `/${locale}/auth/middlePage?notLoggedIn=true`;
    }

    if (requiredRole && userRole !== requiredRole) {
      const query = requiredRole === 'admin' ? 'admin=false' : 'user=false';
      return `/${locale}/auth/middlePage?${query}`;
    }

    return null;
  }, [isChecking, userRole, requiredRole, locale]);

  return { isAllowed, redirect };
};

export default useAuthGuard;
