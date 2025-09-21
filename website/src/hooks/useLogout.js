// hooks/useLogout.js
'use client';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

const useLogout = () => {
  const router = useRouter();
  const locale = useLocale();
  return () => {
    router.push(`/${locale}/auth/middlePage?logout=true`);
  };
};

export default useLogout;
