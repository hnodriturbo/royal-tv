/**
 *   ===================== FreeTrialButton.js =====================
 * 🆓
 * FREE TRIAL BUTTON (status-only version)
 * - Shows correct UI for free trial status string.
 * ==============================================================
 * ⚙️ PROPS:
 *   freeTrialStatus: string|null // One of: null, 'pending', 'active', 'disabled', etc.
 *   loading: boolean
 *   error: string|null
 *   onClick: func
 * ==============================================================
 */

import Link from 'next/link';

export default function FreeTrialButton({ freeTrialStatus, loading, error, onClick }) {
  // 1️⃣ No trial exists: Show request button
  if (!freeTrialStatus) {
    return (
      <div>
        <button
          onClick={onClick}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg mb-4 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Requesting…' : 'Request My Free Trial'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  // 2️⃣ Pending status
  if (freeTrialStatus === 'pending') {
    return (
      <div className="px-4 py-3 bg-yellow-300 text-yellow-900 rounded-xl mb-4 w-2/3">
        {/* ⏳ Pending message */}
        <div>⏳ Your free trial request is pending. You’ll be notified within 24 hours.</div>
        <div className="mt-2 w-full">
          <Link href="/user/freeTrials" className="btn-success w-1/2">
            View Your Free Trial Status
          </Link>
        </div>
      </div>
    );
  }

  // 3️⃣ Active status
  if (freeTrialStatus === 'active') {
    return (
      <div className="px-4 py-3 bg-green-300 text-green-800 rounded-xl mb-4 w-2/3">
        {/* ✅ Active message */}
        <div>✅ Your free trial is active! Use the button below!.</div>
        <div className="mt-2 w-full">
          <Link href="/user/freeTrials" className="btn-success w-1/2">
            View Your Free Trial Credentials
          </Link>
        </div>
      </div>
    );
  }

  // 4️⃣ Disabled/Expired status
  if (freeTrialStatus === 'disabled') {
    return (
      <div className="px-4 py-3 bg-red-300 text-gray-600 rounded-xl mb-4 w-2/3">
        {/* ⏳ Expired message */}
        <div>🚫 Your free trial has expired.</div>
        <div className="mt-2 w-full">
          <Link href="/user/freeTrials" className="btn-success w-1/2">
            View Your Free Trial Info
          </Link>
        </div>
      </div>
    );
  }

  // 5️⃣ Fallback for unknown status
  return (
    <div className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl mb-4 w-2/3">
      {/* ⚠️ Unknown status */}
      <div>⚠️ Unknown free trial status.</div>
      <div className="mt-2 w-full">
        <Link href="/user/freeTrials" className="btn-success w-1/2">
          View Your Free Trial Info
        </Link>
      </div>
    </div>
  );
}
