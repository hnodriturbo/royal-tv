'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

  // Define available IPTV packages
  const packages = [
    {
      id: 'package-tester',
      title: 'Tester',
      description: 'Tester Payment',
      price: '$25',
      detailsUrl: '/packages/tester', // Dedicated details page (to be created)
      buyNow: '/packages/tester/buyNow'
    },
    {
      id: 'package-6m',
      title: '6 Months Plan',
      description:
        'Enjoy premium IPTV access for 6 months with reliable streaming and exclusive channels.',
      price: '$100',
      detailsUrl: '/packages/6m', // Dedicated details page (to be created)
      buyNow: '/packages/6m/buyNow'
    },
    {
      id: 'package-6m-extra',
      title: '6 Months Plan + Extra Device',
      description:
        'Double the convenience with an extra device for simultaneous streaming on multiple screens.',
      price: '$140',
      detailsUrl: '/packages/6m-extra', // Dedicated details page (to be created)
      buyNow: '/packages/6m-extra/buyNow'
    },
    {
      id: 'package-1y',
      title: '1 Year Plan',
      description:
        'A full year of uninterrupted IPTV service. Perfect for long-term entertainment and family viewing.',
      price: '$150',
      detailsUrl: '/packages/1y', // Dedicated details page (to be created)
      buyNow: '/packages/1y/buyNow'
    },
    {
      id: 'package-1y-extra',
      title: '1 Year Plan + Extra Device',
      description:
        'The ultimate convenience: one year of premium IPTV service with an additional device for your family.',
      price: '$220',
      detailsUrl: '/packages/1y-extra', // Dedicated details page (to be created)
      buyNow: '/packages/1y-extra/buyNow'
    }
  ];

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full">
        {/* Header Section */}
        <div className="container-style mb-4">
          <h1 className="text-4xl font-bold mb-4 text-outline-dark-1 text-glow-lightest">
            Welcome to Royal IPTV Service
          </h1>
          <h3 className="text-xl font-bold mb-4">Where you can watch over 20.000 tv stations</h3>
          <h3 className="text-2xl font-bold mb-4">
            ( including the ones that you need to pay for ) <br />
            Everything on this site in encrypted for your safety.
          </h3>
          <p className="mb-6">
            Experience high-quality streaming with our diverse IPTV packages. Choose the plan that
            best fits your needs and enjoy uninterrupted entertainment. Register now for exclusive
            deals and personalized support!
          </p>
          <Link href="/auth/signup">
            <button className="my-btn-dark-box-shadow bg-cyan-500 py-2 px-4 rounded-lg hover:bg-cyan-800 whitespace-nowrap overflow-hidden text-ellipsis text-center transition-all duration-900">
              Register Now and get a free trial for 1 day !
            </button>
          </Link>
        </div>
        {/*  Instructions list in centered container */}
        <div className="w-full flex flex-col items-center justify-center">
          <div className="container-style mb-4">
            <ul className="list-disc list-inside space-y-4">
              <li className="text-lg font-semibold">
                Register as a user. Fill out and submit the signup form above.
              </li>
              <li className="text-lg font-semibold">
                Request your free trial. We’ll process your trial request automatically.
              </li>
              <li className="text-lg font-semibold">
                Check your email. Within 24 hours you’ll receive subscription details.
              </li>
              {/* Prepare your IPTV apps section */}
              <div className="mt-6">
                <h2 className="text-2xl underline text-white drop-shadow-2xl mb-4">
                  Prepare your IPTV app:
                </h2>
                <div className="w-full flex lg:flex-row -flex-col gap-8 text-lg">
                  {/* Smart TV column */}
                  <div className="flex-1 flex lg:flex-row flex-col lg:items-start items-center gap-4">
                    <h2 className="text-xl font-bold text-white drop-shadow-lg">Smart TV:</h2>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-white drop-shadow-md">
                      <li>
                        <Link
                          className="text-blue-500 hover:text-blue-700 underline"
                          href="https://www.smartersiptvplayer.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          IPTV Smarters Player
                        </Link>
                      </li>
                      <li>Just search in your tv for applications</li>
                      <li>related to IPTV</li>
                    </ul>
                  </div>
                  {/* Android TV column */}
                  <div className="flex-1 flex lg:flex-row flex-col lg:items-start items-center gap-4">
                    <h2 className="text-xl font-bold drop-shadow-lg">Android TV Apps:</h2>
                    <ul className="list-disc list-inside ml-4 space-y-1 drop-shadow-md">
                      <li>
                        <Link
                          className="text-blue-500 hover:text-blue-700 underline"
                          href="https://maxplayer.tv/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          MaxPlayer
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="text-blue-500 hover:text-blue-700 underline"
                          href="https://tivimate.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          TiviMate
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="text-blue-500 hover:text-blue-700 underline"
                          href="https://www.smartersiptvplayer.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Smarters TV Player
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <h2 className="text-lg font-semibold">
                Watch for notifications. When your dashboard message arrives, you’ll get an email —
                and again when your subscription is active.
              </h2>
            </ul>
          </div>
        </div>
        {/* Packages Grid */}
        {/* 📦 Packages Flex Layout */}
        <div className="flex flex-wrap justify-center gap-6 lg:w-8/12 w-11/12 mb-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="w-full md:w-[48%] flex justify-center items-stretch">
              <div className="container-style flex flex-col justify-between items-center w-full">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">{pkg.title}</h3>
                  <p className="text-lg mb-4">{pkg.description}</p>
                  <p className="text-xl font-bold mb-4">{pkg.price}</p>
                </div>
                <div className="flex flex-col space-y-2 whitespace-nowrap w-full items-center">
                  {authenticated && user?.role === 'user' ? (
                    <>
                      <Link href="/user/liveChat/createConversation">
                        <button className="w-8/12 bg-green-500 py-2 px-4 rounded hover:bg-green-600 transition whitespace-nowrap overflow-hidden text-ellipsis text-center">
                          Send message to admin
                        </button>
                      </Link>
                      <Link href={pkg.buyNow}>
                        <button className="w-8/12 bg-red-500 py-2 px-4 rounded hover:bg-red-600 transition whitespace-nowrap overflow-hidden text-ellipsis text-center">
                          Buy Now
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/signup">
                        <button className="w-8/12 bg-green-500 py-2 px-4 rounded hover:bg-green-600 transition whitespace-nowrap overflow-hidden text-ellipsis text-center">
                          Register To Buy
                        </button>
                      </Link>
                      <Link href={pkg.detailsUrl}>
                        <button className="w-8/12 bg-blue-500 py-2 px-4 rounded hover:bg-blue-600 transition whitespace-nowrap overflow-hidden text-ellipsis text-center">
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
        {/* End grid */}

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
          <div className="container-style">
            {/* ✅ Section: Choose your IPTV app */}
            <h2 className="text-3xl font-bold mb-4">Choose Your IPTV App</h2>
            <p className="mb-4">
              We highly recommend that you explore the IPTV app you plan to use with your
              subscription or trial. Once we’re in contact, the process is quick and easy. After
              completing your purchase, we’ll send your login credentials.
            </p>
            <p className="mb-4">
              Our top recommendation is <strong>MaxPlayer</strong> (compatible with all devices).
            </p>
            <p className="mb-4">
              We also suggest <strong>TiviMate</strong> (works on Android, Firestick, and Android
              TV) and <strong>Smarters Player Lite</strong> (compatible with iOS, Android,
              Firestick, Windows, and macOS).
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
