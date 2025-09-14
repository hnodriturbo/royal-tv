'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import UserSubscriptionPanel from '@/components/reusableUI/socket/UserSubscriptionPanel';
import FreeTrialPanel from '@/components/reusableUI/socket/FreeTrialPanel';
import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';
import { useTranslations, useLocale } from 'next-intl';

// ✅ Show packages grid and the guide on the homepage
import PackagesGrid from '@/components/packages/data';
import Guide from '@/components/packages/data/guide';

export default function HomeClient() {
  const { data: session, status } = useSession();
  const authenticated =
    status === 'authenticated' && session?.user?.role && session.user.role !== 'guest';
  const user = authenticated ? session.user : null;

  const t = useTranslations();
  const locale = useLocale();
  const freeTrialStatus = useFreeTrialStatus(user?.user_id);

  return (
    <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-12">
      {/* 🏆 HEADER HERO SECTION */}
      <div className="container-style mb-8 text-center">
        <h1 className="text-5xl text-wonderful-5 drop-shadow-lg tracking-widest">
          {t('app.home.page.hero.title')}
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-wonderful-1 drop-shadow-md">
          {t('app.home.page.hero.subtitle')}
        </h2>
        <h3 className="text-2xl font-bold mb-4 text-blue-200">
          {t('app.home.page.hero.blurb_line1')} <br />
          {t('app.home.page.hero.blurb_line2')} <br />
          <br />
          <span className="text-pink-400 font-bold">{t('app.home.page.hero.blurb_line3')}</span>
        </h3>
        <p className="my-2 text-lg md:text-xl text-cyan-100 font-semibold">
          {t('app.home.page.body.line1')} <br />
          {t('app.home.page.body.line2')} <br />
          {t('app.home.page.body.line3')} <strong>{t('app.home.page.body.fast_support')}</strong>{' '}
          {t('app.home.page.body.body_tail')}
        </p>

        {/* 🟢 CTA or Panels for Authenticated Users */}
        {authenticated ? (
          freeTrialStatus && user?.user_id ? (
            freeTrialStatus === 'disabled' ||
            freeTrialStatus === 'expired' ||
            freeTrialStatus === 'pending' ? (
              <UserSubscriptionPanel user_id={session?.user?.user_id} />
            ) : (
              <FreeTrialPanel user_id={user.user_id} className="w-full" />
            )
          ) : null
        ) : (
          <div className="flex justify-center">
            <Link
              href={`/${locale}/auth/signup`}
              className="my-btn-dark-box-shadow btn-info btn-lg text-xl font-bold tracking-wider shadow-lg transition duration-1000 hover:scale-102 uppercase w-8/12"
            >
              {t('app.home.page.cta_button')}
            </Link>
          </div>
        )}
      </div>

      {/* 📘 Getting Started Guide */}
      <Guide />

      {/* 🧱 Packages Grid */}
      <PackagesGrid authenticated={authenticated} />
    </div>
  );
}
