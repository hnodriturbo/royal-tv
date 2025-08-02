/**
 * =====================================
 * 📦 /packages/[slug]/page.js
 * -------------------------------------
 * Premium info page for ONE Royal TV package.
 * - Gradient/glass design, device badge, bold price.
 * - Uses slug to get all data.
 * - Buy Now for logged-in only.
 * - Back to All Packages = /packages/[slug]/seeMore
 * =====================================
 */

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { paymentPackages, packageFeatures } from '@/packages/data/packages'; // 🎁 Centralized data
import Guide from '@/packages/data/guide';

export default function PackageSlugPage() {
  // 🏷️ Get slug from URL
  const { slug } = useParams();

  // 🔍 Find the correct package
  const selectedPackage = paymentPackages.find((pkg) => pkg.slug === slug);

  // 👤 Auth check
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && session?.user;

  // 🚫 Show error if package is not found
  if (!selectedPackage) {
    return (
      <div className="container-style text-center py-16">
        <h1 className="text-4xl font-bold text-red-400 mb-2">Package Not Found!</h1>
        <p className="mt-4 text-lg text-cyan-100">
          The package you are looking for does not exist.
          <br />
          Please select a valid package below.
        </p>
        <Link href={`/packages/${slug}/seeMore`}>
          <button className="btn-primary mt-8 px-8 py-3 rounded-full text-xl shadow-xl hover:scale-105 transition">
            ← Back to All Packages
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen lg:mt-0 mt-12">
      {/* 🦄 Card wrapper */}
      <div
        className="
        border-2
        container-style
        rounded-3xl
        shadow-2xl
        backdrop-blur-lg
        px-8 py-12
        flex flex-col items-center
        max-w-2xl
        relative
        mb-10
        "
      >
        {/* 📱 Device badge */}
        <div className="absolute top-6 right-6 bg-wonderful-2 border border-black text-black px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-widest">
          {selectedPackage.devices === 1 ? 'SINGLE DEVICE' : '2 DEVICES'}
        </div>

        {/* 🏷️ Name */}
        <h1 className="text-4xl md:text-5xl font-black text-yellow-300 drop-shadow-xl mb-3 tracking-tight">
          {selectedPackage.name}
        </h1>

        {/* ⏳ Duration */}
        {/*         <div className="text-xl text-blue-200 mb-2 font-bold uppercase tracking-wide">
          {selectedPackage.duration}
        </div> */}

        {/* 💵 Price */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-4xl font-extrabold text-pink-400 drop-shadow-lg">
            ${selectedPackage.price}
          </span>
          <span className="text-lg font-semibold text-white/70">USD</span>
        </div>

        {/* 💻 Devices Info */}
        <div className="mb-6 text-cyan-200 text-lg">
          {selectedPackage.devices === 1
            ? 'Stream on 1 device at a time'
            : 'Simultaneous viewing on two screens!'}
        </div>

        {/* 🎁 Shared Features */}
        <div className="mb-4 w-full">
          <h3 className="text-xl font-semibold underline text-cyan-200 mb-3 text-center">
            All subscriptions include:
          </h3>
          <ul className="list-disc list-inside text-lg text-cyan-100 space-y-1 mb-6 max-w-xs mx-auto text-left">
            {packageFeatures.map((feature, idx) => (
              <li key={idx} className="flex gap-2 items-center">
                <span className="text-wonderful-5">✔️</span> {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* 💳 Buy Now Button */}
        <div className="flex flex-col gap-3 w-full mt-6 justify-center items-center">
          {isAuthenticated ? (
            <Link href={selectedPackage.buyNowUrl} className="w-full">
              <button className="btn-success btn-lg btn-glow w-2/3 rounded-xl text-xl font-bold shadow-xl transition">
                Buy Now
              </button>
            </Link>
          ) : (
            <Link href="/auth/signup" className="w-full">
              <button className="btn-secondary btn-lg btn-glow w-2/3 rounded-xl text-xl font-bold shadow-xl transition">
                Register to Buy
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* The guide from packages/data/guide.js */}
      <Guide />

      {/* 🏠 Back to All Packages */}
      <div className="container-style w-fit mb-12">
        <Link href={`/`}>
          <button className="btn-info btn-lg px-8 py-3 rounded-full shadow-xl hover:scale-110 transition">
            ← Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
