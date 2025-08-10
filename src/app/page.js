/*
  HomePage component for Royal IPTV Service.
  - Displays a header encouraging registration.
  - Lists IPTV packages with details, contact, and buy buttons.
  - "Contact Now" button directs logged-in users to create a conversation;
    otherwise, it leads to a contact form.
  - Each package includes a "Details" button that routes to a dedicated details page.
*/

'use client';

import logger from '@/lib/core/logger';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import UserSubscriptionDropdown from '@/components/reusableUI/UserSubscriptionDropdown';

// 📦 Packages Grid (Drop this wherever you want your packages to show on the homepage)
import PackagesGrid from '@/packages/data/packages';

import Guide from '@/packages/data/guide';

export default function HomePage() {
  // 🌐 Fetch current session and status clearly from NextAuth
  const { data: session, status } = useSession();

  // 🔑 Determine if the user is authenticated clearly
  const authenticated =
    status === 'authenticated' && session?.user?.role && session.user.role !== 'guest';

  // 👤 Extract user info safely (defaults to null if not authenticated)
  const user = authenticated ? session.user : null;

  // The states for thank you message
  const [showThankYou, setShowThankYou] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Get the free trial status for the logged in user
  /* const { freeTrialStatus } = useFreeTrialStatus(session?.user?.user_id); */

  // Search parameters to check if user came through the form page
  const searchParams = useSearchParams();
  const submitted = searchParams.get('submitted');

  useEffect(() => {
    if (submitted === 'true') {
      setShowThankYou(true);
    }
  }, [submitted]);

  useEffect(() => {
    // Create a timer that counts from 10 to 0
    if (showThankYou && countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }

    // Hide the countdown container after the countdown
    if (countdown === 0) {
      setShowThankYou(false);
    }
  }, [showThankYou, countdown]);

  const featuredPackages = ['tester', '6m', '12m'];

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full lg:mt-0 mt-12">
        {/* 🏆 HEADER HERO SECTION */}
        <div className="container-style mb-8 text-center">
          <h1 className="text-5xl text-wonderful-5 drop-shadow-lg tracking-widest">
            Welcome to Royal TV, the Ultimate IPTV Experience! 🌟👑
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-wonderful-1 drop-shadow-md">
            Watch over 20,000 premium TV stations from all around the world—right from your screen,
            wherever you are!
          </h2>
          <h3 className="text-2xl font-bold mb-4 text-blue-200">
            (That’s every major sports, movie, and entertainment channel—plus tons more you never
            knew you needed.) <br />
            All traffic is fully encrypted for your total peace of mind. <br />
            <span className="text-pink-400 font-bold">
              Enjoy Royal TV’s exclusive secure streaming, available day and night, every single
              day!
            </span>
          </h3>
          <p className="mb-8 text-lg md:text-xl text-cyan-100 font-semibold">
            Experience a new era of streaming with Royal TV! <br />
            Dive into high-quality shows, blockbuster movies, non-stop kids programming, and the
            world’s top international channels. <br />
            With our range of flexible packages, you get unbeatable variety,{' '}
            <strong>super-fast</strong> support, and deals you won’t find anywhere else—only at
            Royal TV! <br />
            Register now and unlock a universe of entertainment. Double the value, double the fun,
            double the satisfaction—guaranteed!
          </p>
          {/* 🟢 Switch: If NOT authenticated, show register button. If authenticated, show free trial logic. */}
          {/*           {!authenticated ? (
            <Link href="/auth/signup">
              <button className="my-btn-dark-box-shadow btn-secondary btn-lg text-xl font-bold tracking-wider shadow-lg transition duration-1000 hover:scale-110 uppercase">
                Register Now & Claim Your FREE 1-Day Trial Access!
              </button>
            </Link>
          ) : (
            <>
         
              {freeTrialStatus === 'disabled' || freeTrialStatus === 'expired' ? (
                <UserSubscriptionDropdown />
              ) : (
                // Otherwise, show the trial request/status panel as usual
                <FreeTrials user_id={user?.user_id} className="w-full" />
              )}
            </>
          )} */}
        </div>

        {/* The guide from packages/data/guide.js */}
        <Guide />

        {/* Packages Grid using packages/data/packages.js */}
        <PackagesGrid authenticated={authenticated} />

        <div className="flex flex-col items-center justify-center w-full">
          {/* ✅ Thank you banner */}
          {showThankYou && (
            <div className="container-style text-3xl mb-6 font-semibold">
              <p>
                Thank you for contacting us! We’ll get back to you as soon as possible. ({countdown}
                )
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
