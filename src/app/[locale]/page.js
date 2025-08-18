/*
  HomePage component for Royal IPTV Service.
  - Displays a header encouraging registration.
  - Lists IPTV packages with details, contact, and buy buttons.
  - "Contact Now" button directs logged-in users to create a conversation;
    otherwise, it leads to a contact form.
  - Each package includes a "Details" button that routes to a dedicated details page.
*/

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/lib/language';
import UserSubscriptionPanel from '@/components/reusableUI/socket/UserSubscriptionPanel';
import FreeTrialPanel from '@/components/reusableUI/socket/FreeTrialPanel';
import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';

import PackagesGrid from '@/app/[locale]/packages/data/packages';
import Guide from '@/app/[locale]/packages/data/guide';

import { useT } from '@/lib/i18n/client'; // 🌐 i18n hook

export default function HomePage() {
  // 🔐 Session state
  const { data: session, status } = useSession();

  const authenticated =
    status === 'authenticated' && session?.user?.role && session.user.role !== 'guest';
  const user = authenticated ? session.user : null;

  // 🗣️ Translators
  const tHome = useT('app.home.page'); // 🏷️ hero + thank_you
  const tBody = useT('app.home.page.body'); // 🧵 body subgroup

  const freeTrialStatus = useFreeTrialStatus(user?.user_id);

  // ⏱️ Thank-you banner state
  const [showThankYou, setShowThankYou] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // 🔍 detect ?submitted=true
  const searchParams = useSearchParams();
  const submitted = searchParams.get('submitted');

  useEffect(() => {
    if (submitted === 'true') setShowThankYou(true);
  }, [submitted]);

  useEffect(() => {
    // ⏳ simple countdown
    if (showThankYou && countdown > 0) {
      const timer = setTimeout(() => setCountdown((previous) => previous - 1), 1000);
      return () => clearTimeout(timer);
    }
    // 📴 auto-hide when done
    if (countdown === 0) setShowThankYou(false);
  }, [showThankYou, countdown]);

  const featuredPackages = ['tester', '6m', '12m']; // 🎯 highlight SKUs if needed

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-12">
        {/* 🏆 HEADER HERO SECTION */}
        <div className="container-style mb-8 text-center">
          {/* 🖼️ Title */}
          <h1 className="text-5xl text-wonderful-5 drop-shadow-lg tracking-widest">
            {tHome('hero.title')}
          </h1>

          {/* 🧑‍🚀 Subtitle */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-wonderful-1 drop-shadow-md">
            {tHome('hero.subtitle')}
          </h2>

          {/* 📝 Blurbs */}
          <h3 className="text-2xl font-bold mb-4 text-blue-200">
            {tHome('hero.blurb_line1')} <br />
            {tHome('hero.blurb_line2')} <br />
            <br />
            <span className="text-pink-400 font-bold">{tHome('hero.blurb_line3')}</span>
          </h3>

          {/* 📣 Body */}
          <p className="my-2 text-lg md:text-xl text-cyan-100 font-semibold">
            {tBody('line1')} <br />
            {tBody('line2')} <br />
            {tBody('line3')} <strong>{tBody('fast_support')}</strong> {tBody('body_tail')}
          </p>

          {/* 🟢 CTA: register button for guests (translated) */}
          {!authenticated ? (
            <Link href="/auth/signup">
              <button className="my-btn-dark-box-shadow btn-secondary btn-lg text-xl font-bold tracking-wider shadow-lg transition duration-1000 hover:scale-110 uppercase">
                {tHome('cta_button')}
              </button>
            </Link>
          ) : (
            <>
              {freeTrialStatus === 'disabled' ||
              freeTrialStatus === 'expired' ||
              freeTrialStatus === 'pending' ? (
                <UserSubscriptionPanel />
              ) : (
                // Otherwise, show the trial request/status panel as usual
                <FreeTrialPanel user_id={user?.user_id} className="w-full" />
              )}
            </>
          )}
        </div>

        {/* 📘 Getting Started Guide (already translated internally) */}
        <Guide />

        {/* 🧱 Packages Grid (already translated internally) */}
        <PackagesGrid authenticated={authenticated} featured={featuredPackages} />

        {/* ✅ Thank you banner */}
        <div className="flex flex-col items-center justify-center w-full">
          {showThankYou && (
            <div className="container-style text-3xl mb-6 font-semibold">
              <p>{tHome('thank_you', { countdown })}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
