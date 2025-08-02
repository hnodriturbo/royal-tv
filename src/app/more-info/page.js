/**
 * ==============================================
 * Royal TV — More Info Page
 * Shows: Thank you banner, full setup guide, and packages grid.
 * ==============================================
 */

'use client';

import Guide from '@/packages/data/guide'; // 🧭 Full guide steps and app recommendations
import PackagesGrid from '@/packages/data/packages'; // 📦 Full packages grid
import Link from 'next/link';
// If you use NextAuth, pass authenticated as a prop or fetch session here
import { useSession } from 'next-auth/react';

const MoreInfoPage = () => {
  // 👤 Auth status (optional for grid)
  const { data: session, status } = useSession();
  const authenticated =
    status === 'authenticated' && session?.user?.role && session.user.role !== 'guest';

  return (
    <div className="flex flex-col items-center w-full lg:mt-0 mt-12">
      {/* 🧭 Step-by-step Guide and app recommendations */}
      <Guide />

      {/* 📦 All packages for user to buy now */}
      <div className="mt-20 mb-12 w-full flex flex-col items-center">
        <div className="container-style mb-4 w-fit">
          {' '}
          <h2 className="text-4xl font-bold text-wonderful-5 mb-8 text-center drop-shadow-lg">
            Our Subscription Packages 👇
          </h2>
        </div>

        <PackagesGrid authenticated={authenticated} />
      </div>
    </div>
  );
};

export default MoreInfoPage;
