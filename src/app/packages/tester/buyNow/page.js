/**
 * /app/packages/tester/buyNow/page.js
 *
 * Renders the NowPayments payment widget via iframe,
 * and provides a button to open the widget in a new window.
 */

'use client';

import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import PaymentInstructions from '@/components/ui/paymentInstructions/PaymentInstructions';
export default function BuyNowPage() {
  const { data: session } = useSession();
  const router = useRouter();
  // 🚀 Check authentication
  const { isAllowed, redirect } = useAuthGuard('user');

  // ✅ Prevent rendering if user is NOT allowed (avoid UI flickering)
  useEffect(() => {
    if (!isAllowed && redirect) {
      router.replace(redirect); // ✅ Redirect safely in useEffect
    }
  }, [isAllowed, redirect, router]);

  const widgetUrl =
    'https://nowpayments.io/embeds/payment-widget?iid=5096394259';

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full">
        <PaymentInstructions />

        <div className="w-full flex flex-col items-center justify-center py-8 ">
          <div className="container-style justify-center items-center w-fit p-8">
            <iframe
              src={widgetUrl}
              width="410"
              height="696"
              className="border-0 overflow-hidden"
              style={{ overflowY: 'hidden' }}
              title="Payment Widget"
            >
              Can&apos;t load widget
            </iframe>
          </div>
        </div>
      </div>
    </>
  );
}
