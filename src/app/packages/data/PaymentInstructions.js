/**
 * 💸 PaymentInstructions Component
 * Shows step-by-step guide for Bitcoin payment.
 * Includes links for Bitcoin beginners!
 */

import React from 'react';

const PaymentInstructions = () => {
  return (
    <div className="container-style">
      {/* 🪙 Quick Payment Steps */}
      <h2 className="text-3xl font-bold mb-2">How to Pay with Bitcoin</h2>
      <hr className="border border-gray-400 w-full text-center items-center justify-center my-4" />

      <ol className="list-decimal list-inside ml-4 space-y-2 drop-shadow-md text-lg">
        <li>
          <span className="font-semibold">Open your Bitcoin wallet</span> (on your phone or
          computer).
        </li>
        <li>
          Tap <span className="font-semibold">&quot;Send&quot;</span> or{' '}
          <span className="font-semibold">&quot;Transfer&quot;</span>.
        </li>
        <li>
          <span className="font-semibold">Copy & paste the address</span> and the exact Bitcoin
          amount shown below.
        </li>
        <li>
          Double-check all info, then tap <span className="font-semibold">Send</span>.
        </li>
      </ol>

      <hr className="border border-gray-400 w-full text-center items-center justify-center my-4" />

      {/* ⏳ What happens next? */}
      <div className="mb-4 text-xl">
        ✅{' '}
        <span className="font-bold">
          Done ? <br />
          Just wait Here on this page and don't close it until paymnet is 100% complete..
        </span>
        <br />
        <span className="font-bold">
          Sometimes it takes the payment up to 1 hour to be fully complete.
        </span>
        <br />
        <br />
        <span className="font-bold">
          You’ll get a confirmation notification and email as soon as payment is completed and admin
          will activate your subscription within 24 hours.
        </span>
        <br />
        <span className="font-bold">
          You will also get notification on your dashboard and email upon activation.
        </span>
      </div>

      <hr className="border border-gray-400 w-full text-center items-center justify-center my-4" />

      {/* 📱 QR Code instructions */}
      <div className="mb-4 text-lg">
        📱{' '}
        <span className="font-semibold">
          Tip: You can also scan the QR code below with your wallet app—this fills in everything
          automatically!
        </span>
      </div>

      {/* 💡 Beginner help and resources */}
      <div className="mt-6 p-4 rounded-xl bg-smooth-gradient-light-2 drop-shadow text-center">
        <h3 className="text-xl font-bold mb-2">🆕 New to Bitcoin?</h3>
        {/* Center ul with inline-block and remove text-center on ul */}
        <ul className="list-disc mb-2 inline-block text-left text-xl">
          <li className="mb-3">
            <a
              href="https://www.coinbase.com/learn/crypto-basics/how-to-send-bitcoin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              How to send Bitcoin (Coinbase Guide)
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://www.bitcoin.com/get-started/how-to-send-bitcoin/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              Step-by-step: How to send Bitcoin (bitcoin.com)
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://wasabiwallet.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              Download Wasabi Wallet (privacy-focused desktop wallet)
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://atomicwallet.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              Download Atomic Wallet (multi-crypto desktop/mobile)
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://www.trustwallet.com/bitcoin-wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              Download Trust Wallet (easy mobile wallet)
            </a>
          </li>
        </ul>
        <p className="mt-2 text-4xl font-bold">
          Need help? Message support in your dashboard anytime!
        </p>
      </div>
    </div>
  );
};

export default PaymentInstructions;
