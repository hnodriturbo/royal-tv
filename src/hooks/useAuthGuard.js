'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import useAppHandlers from '@/hooks/useAppHandlers';

/**
 * useAuthGuard(requiredRole)
 *
 * - Keeps the same return API: { isAllowed, redirect }
 * - isAllowed is:
 *     null   → still loading (don’t render, loader shown automatically)
 *     true   → authenticated + role OK
 *     false  → blocked (redirect available)
 * - redirect gives the path to replace() with if blocked
 */
export default function useAuthGuard(requiredRole /* 'admin' | 'user' */) {
  const { status, data } = useSession();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();
  const { showLoader, hideLoader } = useAppHandlers();

  const isLoading = status === 'loading';
  const isAuthed = status === 'authenticated';
  const role = (data?.user?.role ?? 'guest').toLowerCase();

  // role logic
  const roleAllows = useMemo(() => {
    if (!isAuthed) return false;
    if (!requiredRole) return true;
    if (requiredRole === 'admin') return role === 'admin';
    if (requiredRole === 'user') return role === 'user';
    return false;
  }, [isAuthed, requiredRole, role]);

  // loader control
  const loaderShown = useRef(false);
  useEffect(() => {
    if (isLoading && !loaderShown.current) {
      const text = t('common.loader.loading', { default: 'Loading...' });
      showLoader({ text });
      loaderShown.current = true;
    }
    if (!isLoading && loaderShown.current) {
      hideLoader();
      loaderShown.current = false;
    }
  }, [isLoading, showLoader, hideLoader, t]);

  // redirect target
  let redirect = null;
  if (!isLoading) {
    if (!isAuthed) {
      redirect = `/${locale}/auth/signin?redirectTo=${encodeURIComponent(pathname)}`;
    } else if (!roleAllows) {
      redirect = `/${locale}/`;
    }
  }

  // normalize isAllowed for consumers
  let isAllowed = null;
  if (isLoading) {
    isAllowed = null; // pending
  } else {
    isAllowed = isAuthed && roleAllows;
  }

  return { isAllowed, redirect };
}
