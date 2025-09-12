import SignInForm from '@/components/ui/SignInForm/SignInForm';
/* import axiosInstance from '@/lib/core/axiosInstance'; */
import { useTranslations } from 'next-intl';
/* import { LOCALES } from '@/i18n/config'; */

export default function SignInPage() {
  const t = useTranslations('app.signin');
  return (
    <main>
      <h1>{t('title')}</h1>
      <SignInForm />
    </main>
  );
}
