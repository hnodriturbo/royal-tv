/**
 * 💸 PaymentInstructions (i18n)
 * - Strings under app.payments.instructions.*
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function PaymentInstructions() {
  const t = useTranslations();

  return (
    <div className="container-style">
      {/* 🪙 Steps */}
      <h2 className="text-3xl font-bold mb-2">{t('app.payments.instructions.title')}</h2>
      <hr className="border border-gray-400 w-full my-4" />

      <ol className="list-decimal list-inside ml-4 space-y-2 drop-shadow-md text-lg">
        <li>{t('app.payments.instructions.steps.open_wallet')}</li>
        <li>{t('app.payments.instructions.steps.tap_send')}</li>
        <li>{t('app.payments.instructions.steps.copy_paste')}</li>
        <li>{t('app.payments.instructions.steps.double_check')}</li>
      </ol>

      <hr className="border border-gray-400 w-full my-4" />

      {/* ⏳ What happens next */}
      <div className="mb-4 text-xl">
        <span className="font-bold">{t('app.payments.instructions.wait_here')}</span>
        <br />
        <br />
        <span className="font-bold">{t('app.payments.instructions.youll_get_confirmation')}</span>
        <br />
        <span className="font-bold">
          <br />
          <p className="text-green-500 font-extrabold tracking-widest">
            ✅ {t('app.payments.instructions.done')}
          </p>
          <br />
          {t('app.payments.instructions.activated_when_complete')}
        </span>
      </div>

      <hr className="border border-gray-400 w-full my-4" />

      {/* 📱 QR tip */}
      <div className="mb-4 text-lg">
        📱 <span className="font-semibold">{t('app.payments.instructions.qr_tip')}</span>
      </div>

      {/* 🆕 Beginner help */}
      <div className="mt-6 p-4 rounded-xl bg-smooth-gradient-light-2 drop-shadow text-center">
        <h3 className="text-xl font-bold mb-2">
          🆕 {t('app.payments.instructions.beginner_title')}
        </h3>
        <ul className="list-disc mb-2 inline-block text-left text-xl">
          <li className="mb-3">
            <a
              href="https://www.coinbase.com/learn/crypto-basics/how-to-send-bitcoin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('app.payments.instructions.link_coinbase')}
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://www.bitcoin.com/get-started/how-to-send-bitcoin/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('app.payments.instructions.link_bitcoincom')}
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://wasabiwallet.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('app.payments.instructions.link_wasabi')}
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://atomicwallet.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('app.payments.instructions.link_atomic')}
            </a>
          </li>
          <li className="mb-3">
            <a
              href="https://www.trustwallet.com/bitcoin-wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-pink-400"
            >
              {t('app.payments.instructions.link_trust')}
            </a>
          </li>
        </ul>
        <p className="mt-2 text-4xl font-bold">{t('app.payments.instructions.need_help')}</p>
      </div>
    </div>
  );
}
