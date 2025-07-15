/**
 *   ========================= PackageDetails.js =========================
 * 📦
 * IPTV Package Details Page:
 * - Responsive design for all screens.
 * - Shows title, features, payment widget, recommended apps, and support info.
 * =======================================================================
 * ⚙️
 * PROPS:
 *   title: string // Package title (e.g. "6 Month Plan")
 *   description: string // Full marketing description for the plan
 *   price: string // Display price (e.g. "$99")
 *   widgetInvoiceId: string // The NowPayments invoice_id to show in the widget
 * =======================================================================
 * 📌
 * USAGE:
 *   <PackageDetails title="Tester" description="..." price="$25" widgetInvoiceId="..."/>
 * =======================================================================
 */

'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useAuthGuard from '@/hooks/useAuthGuard';

export default function PackageDetails({ title, description, price, widgetInvoiceId }) {
  // 🔒 Authenticated users only
  const { data: session } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');

  useEffect(() => {
    if (!isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [isAllowed, redirect, router]);

  // 💳 NowPayments widget URL, with correct invoice ID
  const widgetUrl = `https://nowpayments.io/embeds/payment-widget?iid=${widgetInvoiceId}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800">
      {/* 1️⃣ Package Details Card */}
      <div className="container-style w-full lg:w-8/12 mb-6">
        <div className="bg-gray-700 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-3 text-wonderful-1">{title}</h1>
          <p className="text-lg mb-3 text-white">{description}</p>
          <p className="text-2xl font-bold mb-4 text-green-400">Price: {price}</p>
        </div>
      </div>

      {/* 2️⃣ Payment Widget Card */}
      <div className="container-style w-full lg:w-8/12 mb-6">
        <div className="bg-gray-700 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2 text-white">Secure Payment via NowPayments</h2>
          {/* Payment widget iframe */}
          <iframe
            src={widgetUrl}
            width="410"
            height="696"
            className="border-0 overflow-hidden mb-4 rounded-xl shadow-md"
            style={{ overflowY: 'hidden', background: '#222' }}
            title="Payment Widget"
          >
            Can't load widget
          </iframe>
          {/* Open widget in new window */}
          <Link href={widgetUrl} target="_blank">
            <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded transition">
              Open Payment Widget in New Window
            </button>
          </Link>
        </div>
      </div>

      {/* 3️⃣ Benefits & FAQ */}
      <div className="container-style w-full lg:w-8/12 mb-6">
        <div className="bg-gray-700 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Why Choose Royal IPTV?</h2>
          <ul className="list-disc pl-6 text-white mb-4">
            <li>⚡ Over 14,000 TV channels, movies, and series – from every country.</li>
            <li>
              📺 Sports, news, documentaries, kids, movies, and more – including premium and paid
              channels.
            </li>
            <li>🔒 Secure, encrypted streaming for your privacy.</li>
            <li>🌍 Works worldwide – all you need is internet.</li>
            <li>🕐 Subscription delivered in under 24 hours (usually much faster!)</li>
            <li>🛠️ Live support 24/7, with free trial available for new users.</li>
          </ul>
          <h3 className="text-xl font-bold mt-4 text-white">Frequently Asked Questions</h3>
          <ul className="list-disc pl-6 text-white">
            <li>
              What devices are supported?{' '}
              <span className="text-gray-300">
                Any Smart TV, Android, iPhone, Windows, macOS, Firestick, and more.
              </span>
            </li>
            <li>
              Can I get a free trial?{' '}
              <span className="text-gray-300">
                Yes – just register and request it from your dashboard.
              </span>
            </li>
            <li>
              How do I renew?{' '}
              <span className="text-gray-300">Just visit this page or contact support!</span>
            </li>
            <li>
              Do you offer refunds?{' '}
              <span className="text-gray-300">
                Due to digital nature, no refunds, but we recommend starting with a trial!
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4️⃣ IPTV App Recommendations */}
      <div className="container-style w-full lg:w-8/12 mb-6">
        <div className="bg-gray-700 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Recommended IPTV Apps</h2>
          <ul className="list-disc pl-6 text-white">
            <li>
              <strong>MaxPlayer:</strong> Universal compatibility across all devices.
            </li>
            <li>
              <strong>TiviMate:</strong> Ideal for Android, Firestick, and Android TV.
            </li>
            <li>
              <strong>Smarters Player Lite:</strong> Supports iOS, Android, Firestick, Windows,
              macOS.
            </li>
          </ul>
        </div>
      </div>

      {/* 5️⃣ Support Card */}
      <div className="container-style w-full lg:w-8/12 mb-12">
        <div className="bg-gray-700 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Need Help?</h2>
          <p className="text-white text-center mb-2">
            Contact our support team via live chat or email. We are available 24/7 to assist you!
          </p>
          <Link href="/user/liveChat/createConversation">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded transition">
              Start Live Chat
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
