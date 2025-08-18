/**
 * ===========================================
 * 📄 /packages/[slug]/seeMore/page.js
 * -------------------------------------------
 * One‑package details with add-ons.
 * - Finds package by slug
 * - Checkboxes: Adult, VPN, Extra Device (if available)
 * - Recalculates total price live
 * - If Extra Device is selected, switches to 2‑device plan (by slug)
 * - Sends adult/vpn/price to Buy Now (no 'extra' param)
 * - Embeds central <Guide /> (no duplication)
 * ===========================================
 */

'use client';

import { useParams } from 'next/navigation';
import { Link } from '@/lib/language';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { paymentPackages, packageFeatures } from '@/app/[locale]/packages/data/packages'; // 🧱 Central data
import Guide from '@/app/[locale]/packages/data/guide'; // 📘 Central guide component

export default function PackageSeeMorePage() {
  // 🏷️ pull slug from route
  const { slug } = useParams();

  // 🔎 find the base package by slug
  const selectedPackage = useMemo(
    () => paymentPackages.find((singlePackage) => singlePackage.slug === slug),
    [slug]
  );

  // 👤 check auth for CTA logic
  const { data: session, status } = useSession();
  const isAuthenticatedUser = status === 'authenticated' && Boolean(session?.user);

  // 🧯 handle unknown slug gracefully
  if (!selectedPackage) {
    return (
      <div className="container-style text-center py-16">
        {/* 🚫 not found message */}
        <h1 className="text-4xl font-bold text-red-400 mb-2">Package Not Found</h1>
        <p className="mt-4 text-lg text-cyan-100">
          Please return to the packages list and choose a valid package.
        </p>
        <Link href={`/packages`}>
          <button className="btn-primary mt-8 px-8 py-3 rounded-full text-xl shadow-xl hover:scale-105 transition">
            ← Back to Packages
          </button>
        </Link>
      </div>
    );
  }

  // 🧩 Add-on states
  const [isAdultSelected, setIsAdultSelected] = useState(false); // 🔞
  const [isVpnSelected, setIsVpnSelected] = useState(false); // 🛡️
  const [isExtraDeviceSelected, setIsExtraDeviceSelected] = useState(false); // 🖥️➕

  // 👫 find a 2‑device sibling (same package_id, devices=2)
  const twoDeviceSibling = useMemo(() => {
    if (selectedPackage.devices === 2) return null; // already 2 devices
    const sibling = paymentPackages.find(
      (candidate) =>
        candidate.package_id === selectedPackage.package_id &&
        candidate.devices === 2 &&
        candidate.slug !== selectedPackage.slug
    );
    return sibling || null;
  }, [selectedPackage]);

  // 🔀 effective plan (switch to 2‑device plan when extra device is checked)
  const effectivePackage =
    isExtraDeviceSelected && twoDeviceSibling ? twoDeviceSibling : selectedPackage;

  // 💵 total price = effective base + add‑ons
  const totalPrice =
    (effectivePackage.price ?? 0) + (isAdultSelected ? 10 : 0) + (isVpnSelected ? 10 : 0);

  // 🏷️ device label reflects effective plan
  const effectiveDevicesLabel = effectivePackage.devices === 2 ? '2 DEVICES' : 'SINGLE DEVICE';

  // 🔗 Buy Now URL with only adult/vpn/price (no 'extra' param)
  const buyNowUrlWithParams = `${effectivePackage.buyNowUrl}?adult=${
    isAdultSelected ? 1 : 0
  }&vpn=${isVpnSelected ? 1 : 0}&price=${totalPrice}`;

  return (
    <div className="flex flex-col items-center w-full min-h-screen lg:mt-0 mt-12">
      {/* 💳 package card */}
      <div
        className="
          container-style max-w-2xl w-full
          border-2 rounded-3xl shadow-2xl backdrop-blur-lg
          px-8 py-12 mb-10 relative
        "
      >
        {/* 🏷️ device badge */}
        <div className="absolute top-6 right-6 bg-wonderful-2 border border-black text-black px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-widest">
          {effectiveDevicesLabel}
        </div>

        {/* 🏆 title */}
        <h1 className="text-4xl md:text-5xl font-black text-yellow-300 drop-shadow-xl mb-3 tracking-tight text-center">
          {selectedPackage.order_description}
        </h1>

        {/* 💵 price */}
        <div className="mb-2 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-extrabold text-pink-400 drop-shadow-lg">
              ${totalPrice}
            </span>
            <span className="text-lg font-semibold text-white/70">USD</span>
          </div>
          {/* 🧾 breakdown */}
          <div className="text-sm text-cyan-300">
            Base ${effectivePackage.price}
            {isAdultSelected && <> + Adult $10</>}
            {isVpnSelected && <> + VPN $10</>}
          </div>
        </div>

        {/* 🧰 shared features */}
        <div className="mb-4 w-full">
          <ul className="list-disc list-inside text-lg text-cyan-100 space-y-1 mb-6 max-w-xs mx-auto text-left">
            {packageFeatures.map((singleFeature, indexNumber) => (
              <li key={indexNumber} className="flex gap-2 items-center">
                <span className="text-2xl">✔️</span> {singleFeature}
              </li>
            ))}
          </ul>
        </div>

        {/* 🖥️ devices line */}
        <div className="mb-6 text-cyan-200 text-lg text-center">
          {effectiveDevicesLabel === '2 DEVICES'
            ? 'Simultaneous viewing on two screens!'
            : 'Stream on 1 device at a time'}
        </div>

        {/* 🗳️ Add-on selectors */}
        <div className="flex flex-col max-w-md text-center w-full mx-auto bg-black/50 rounded-2xl p-6 shadow-xl mb-6">
          {/* 🔞 Adult */}
          <label className="flex items-center justify-center gap-2 text-pink-200">
            <input
              type="checkbox"
              checked={isAdultSelected}
              onChange={() => setIsAdultSelected(!isAdultSelected)}
            />
            Adult content (+$10)
          </label>

          {/* 🛡️ VPN */}
          <label className="flex items-center justify-center gap-2 text-cyan-200 mt-2">
            <input
              type="checkbox"
              checked={isVpnSelected}
              onChange={() => setIsVpnSelected(!isVpnSelected)}
            />
            VPN add-on (+$10)
          </label>
        </div>

        {/* 🚀 CTAs */}
        <div className="flex flex-col gap-3 w-full mt-6 justify-center items-center">
          {isAuthenticatedUser ? (
            <Link href={buyNowUrlWithParams} className="w-full">
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

      {/* 📘 central guide (no duplication) */}
      <Guide />

      {/* 🔙 back to list */}
      <div className="container-style w-fit mb-12">
        <Link href={`/packages`}>
          <button className="btn-info btn-lg px-8 py-3 rounded-full shadow-xl hover:scale-110 transition">
            ← Back to Packages
          </button>
        </Link>
      </div>
    </div>
  );
}
