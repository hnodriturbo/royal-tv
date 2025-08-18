/**
 * 💸 PaymentInstructions (i18n)
 * - Strings under app.payments.instructions.*
 */

'use client';

import React from 'react';
import { useT } from '@/lib/i18n/client';

export default function PaymentInstructions() {
  const t = useT('app.payments.instructions'); // 🏷️ scope

  return (
    <div className="container-style">
      {/* 🪙 Steps */}
      <h2 className="text-3xl font-bold mb-2">{t('title')}</h2>
      <hr className="border border-gray-400 w-full my-4" />

      <ol className="list-decimal list-inside ml-4 space-y-2 drop-shadow-md text-lg">
        <li>{t('steps.open_wallet')}</li>
        <li>{t('steps.tap_send')}</li>
        <li>{t('steps.copy_paste')}</li>
        <li>{t('steps.double_check')}</li>
      </ol>

      <hr className="border border-gray-400 w-full my-4" />

      {/* ⏳ What happens next */}
      <div className="mb-4 text-xl">
        <span className="font-bold">{t('wait_here')}</span>
        <br />
        <br />
        <span className="font-bold">{t('youll_get_confirmation')}</span>
        <br />
        <span className="font-bold">
          <br />
          <p className="text-green-500 font-extrabold tracking-widest">✅ {t('done')}</p>
          <br />
          {t('activated_when_complete')}
        </span>
      </div>

      <hr className="border border-gray-400 w-full my-4" />

      {/* 📱 QR tip */}
      <div className="mb-4 text-lg">
        📱 <span className="font-semibold">{t('qr_tip')}</span>
      </div>

      {/* 🆕 Beginner help */}
      <div className="mt-6 p-4 rounded-xl bg-smooth-gradient-light-2 drop-shadow text-center">
        <h3 className="text-xl font-bold mb-2">🆕 {t('beginner_title')}</h3>
        <ul className="list-disc mb-2 inline-block text-left text-xl">
          <li className="mb-3">
            <a
              href="https://www.coinbase.com/learn/crypto-basics/how-to-send-bitcoin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('link_coinbase')}
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://www.bitcoin.com/get-started/how-to-send-bitcoin/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('link_bitcoincom')}
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://wasabiwallet.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('link_wasabi')}
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://atomicwallet.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('link_atomic')}
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://www.trustwallet.com/bitcoin-wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('link_trust')}
            </a>
          </li>
        </ul>
        <p className="mt-2 text-4xl font-bold">{t('need_help')}</p>
      </div>
    </div>
  );
}
