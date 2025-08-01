import { useState } from 'react';
import { paymentPackages } from '@/packages/data/packages';
import { useRouter } from 'next/navigation';

export default function UserSubscriptionDropdown() {
  const [selectedPackage, setSelectedPackage] = useState('');
  const router = useRouter();

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center my-10">
      <select
        value={selectedPackage}
        onChange={(e) => setSelectedPackage(e.target.value)}
        className="w-full mb-3 p-2 rounded-lg text-gray-900 text-center"
      >
        <option value="" disabled>
          -- Select a subscription package to buy --
        </option>
        {paymentPackages.map((pkg) => (
          <option key={pkg.slug} value={pkg.slug}>
            {pkg.order_description} - ${pkg.price}
          </option>
        ))}
      </select>
      <button
        onClick={() => router.push(`/packages/${selectedPackage}/buyNow`)}
        className="btn-primary w-2/3 mt-1 btn-lg btn-glow"
        disabled={!selectedPackage}
      >
        Buy Now
      </button>
    </div>
  );
}
