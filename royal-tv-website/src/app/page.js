'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
// 📦 Packages Grid (Drop this wherever you want your packages to show on the homepage)
import { paymentPackages, packageFeatures } from '@/packages/data/packages';
/*
  HomePage component for Royal IPTV Service.
  - Displays a header encouraging registration.
  - Lists IPTV packages with details, contact, and buy buttons.
  - "Contact Now" button directs logged-in users to create a conversation;
    otherwise, it leads to a contact form.
  - Each package includes a "Details" button that routes to a dedicated details page.
*/

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
          <Link href="/auth/signup">
            <button className="my-btn-dark-box-shadow btn-secondary btn-lg text-xl font-bold tracking-wider shadow-lg transition duration-1000 hover:scale-110 uppercase">
              Register Now & Claim Your FREE 1-Day Trial Access!
            </button>
          </Link>
        </div>

        {/* 🎬 INSTRUCTIONS + IPTV APPS SECTION */}
        <div className="w-full flex flex-col items-center justify-center">
          <div className="container-style mb-8 py-8 bg-smooth-gradient-light-2">
            <ul className="list-disc list-inside space-y-6 text-lg font-semibold">
              Step 1:{' '}
              <li>
                <span className="text-yellow-300 font-bold">Register for a Royal TV account</span>.
                It’s quick, secure, and lets you unlock every exclusive feature—including a full day
                of free streaming!
                <br />
                <span className="text-cyan-400">
                  Sign up and join our rapidly growing community of happy streamers!
                </span>
              </li>
              Step 2:
              <li>
                <span className="text-green-400 font-bold">Request your free trial</span>. After
                registering, you’ll have to log in to your dashboard and click "Request My Free
                Trial" button
                <br />
                <span className="text-blue-200">
                  Our system works around the clock, so you never miss a moment of entertainment.
                </span>
              </li>
              Step 3:
              <li>
                <span className="text-pink-400 font-bold">Wait for your credentials.</span>
                Our system will notify you directly in your dashboard the moment your
                trial/subscription is ready.
                <br />
                <br />
                <span className="text-purple-200">
                  Everything is automated, super safe, and totally hassle-free!
                </span>
              </li>
            </ul>

            {/* IPTV apps guidance, more engaging */}
            <div className="mt-8">
              <h2 className="text-3xl font-extrabold underline text-cyan-300 drop-shadow-2xl mb-4">
                Prepare Your Streaming Setup:
              </h2>
              <div className="w-full flex flex-col md:flex-row gap-10 text-lg">
                {/* Smart TV column */}
                <div className="flex-1 flex flex-col items-center gap-3">
                  <h3 className="text-xl font-bold text-yellow-200 drop-shadow-lg">
                    Smart TV Apps 📺
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-cyan-100 drop-shadow">
                    <li>
                      <Link
                        className="text-blue-400 hover:text-pink-400 underline transition"
                        href="https://www.smartersiptvplayer.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        IPTV Smarters Player
                      </Link>
                    </li>
                    <li>
                      Just open your TV’s app store and search for the latest IPTV apps—dozens are
                      available for every brand!
                    </li>
                    <li>
                      Explore and find the player that fits your preferences—Royal TV works with
                      almost every modern app.
                    </li>
                  </ul>
                </div>
                {/* Android TV column */}
                <div className="flex-1 flex flex-col items-center gap-3">
                  <h3 className="text-xl font-bold text-green-200 drop-shadow-lg">
                    Android TV & More 🤖
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-green-100 drop-shadow">
                    <li>
                      <Link
                        className="text-blue-400 hover:text-pink-400 underline transition"
                        href="https://maxplayer.tv/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        MaxPlayer (our top pick!)
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-blue-400 hover:text-pink-400 underline transition"
                        href="https://tivimate.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        TiviMate (for Android, Firestick, Android TV)
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-blue-400 hover:text-pink-400 underline transition"
                        href="https://www.smartersiptvplayer.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Smarters TV Player (iOS, Android, Windows, Mac)
                      </Link>
                    </li>
                    <li>
                      Try any modern IPTV app—Royal TV is compatible with virtually all platforms
                      for double the viewing freedom!
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <h2 className="mt-8 text-xl font-bold text-center text-cyan-200">
              After you register, system will update you instantly in your dashboard the moment your
              subscription or free trial is ready.
              <br /> <br />
              Double the alerts. Double the streaming. Only at{' '}
              <span className="text-yellow-200 font-extrabold">Royal TV!</span>
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
          {paymentPackages.map((pkg) => (
            <div
              key={pkg.slug}
              className="
        relative bg-gradient-to-br from-wonderful-7 via-wonderful-10 to-wonderful-2
        border-2 border-wonderful-3/40
        container-style rounded-2xl p-8 flex flex-col items-center shadow-2xl
        transition-transform duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.40)]
        backdrop-blur-lg
      "
            >
              {/* 🏷️ Device Badge */}
              <div className="absolute top-4 right-4 bg-wonderful-4 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg uppercase">
                {pkg.devices === 1 ? 'Single Device' : '2 Devices'}
              </div>

              {/* 🏆 Name */}
              <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-xl">{pkg.name}</h3>

              {/* 💵 Price */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-3xl font-extrabold text-pink-400 drop-shadow-lg">
                  ${pkg.price}
                </span>
                <span className="text-lg font-semibold text-white/80">USD</span>
              </div>

              {/* ⏳ Duration */}
              <div className="mb-1 text-lg text-blue-200 font-bold tracking-wide uppercase">
                {pkg.duration}
              </div>

              {/* 🎁 Shared Features */}
              <ul className="mb-6 mt-2 text-cyan-100 text-base font-medium space-y-1 text-left w-full max-w-[260px]">
                {packageFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-wonderful-5">✔️</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* 🔗 Buttons */}
              <div className="flex flex-col gap-2 w-full mt-auto">
                {authenticated ? (
                  <Link href={pkg.buyNowUrl} className="w-full">
                    <button className="btn-primary w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl transition hover:scale-105">
                      Buy Now
                    </button>
                  </Link>
                ) : (
                  <Link href="/auth/signup" className="w-full">
                    <button className="btn-secondary w-full py-3 rounded-xl font-bold text-xl tracking-wide shadow-xl transition hover:scale-105">
                      Register to Buy
                    </button>
                  </Link>
                )}
                <Link href={pkg.detailsUrl} className="w-full">
                  <button className="btn-info w-full py-3 rounded-xl font-bold text-lg tracking-wide shadow-lg hover:scale-105">
                    More Info
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 📦 Packages Responsive Grid */}
        {/* <div className="lg:w-11/12 w-10/12 mb-8 px-2">
          <div
            className="
    grid 
    grid-cols-1 
    sm:grid-cols-2 
    xl:grid-cols-3 
    gap-6
    "
          >
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex">
                <div className="container-style flex flex-col justify-between items-center w-full">
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{pkg.title}</h3>
                    <p className="text-lg mb-4">{pkg.description}</p>
                    <p className="text-xl font-bold mb-4">{pkg.price}</p>
                  </div>
                  <div className="flex flex-col space-y-2 whitespace-nowrap w-full items-center">
                    {authenticated && user?.role === 'user' ? (
                      <>
                        <Link href="/user/liveChat/createConversation" className="w-full">
                          <button className="w-10/12 bg-green-500 py-2 px-4 rounded-xl hover:bg-green-600 transition whitespace-nowrap overflow-hidden text-ellipsis text-center">
                            Send message to admin
                          </button>
                        </Link>
                        <Link href={pkg.buyNow} className="w-full">
                          <button className="w-10/12 bg-red-500 py-2 px-4 rounded-xl hover:bg-red-600 transition whitespace-nowrap overflow-hidden text-ellipsis text-center">
                            Buy Now
                          </button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/signup" className="w-full">
                          <button className="w-10/12 bg-green-500 py-2 px-4 rounded-xl hover:bg-green-600 transition whitespace-nowrap overflow-hidden text-ellipsis text-center">
                            Register To Buy
                          </button>
                        </Link>
                        <Link href={pkg.detailsUrl} className="w-full">
                          <button className="w-10/12 bg-blue-500 py-2 px-4 rounded-xl hover:bg-blue-600 transition whitespace-nowrap overflow-hidden text-ellipsis text-center">
                            More Details
                          </button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div> */}

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
