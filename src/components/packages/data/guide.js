/**
 * =======================================
 * Royal TV — Subscription & Setup Guide 🛎️✨
 * ---------------------------------------
 * Explains registration, payment, activation,
 * and setup steps for Royal TV. Includes app
 * recommendations by platform.
 *
 * Import this in any page:
 * import Guide from '@/app/[locale]/packages/data/guide';
 * <Guide />
 * =======================================
 */

'use client';

import { useTranslations } from 'next-intl';

export default function Guide() {
  // 🌐 Always use full-path keys
  const t = useTranslations();

  return (
    <div className="container-style border-2 mx-auto p-6 mt-12 mb-12">
      {/* 🎉 Steps Section */}
      <h2 className="text-4xl md:text-5xl font-bold text-wonderful-5 mb-6 text-center drop-shadow-lg">
        {t('app.packages.guide.title')}
      </h2>

      <ul className="list-decimal list-inside space-y-8 text-lg md:text-xl font-semibold text-cyan-100">
        <li>
          <span className="font-bold text-yellow-300">
            {t('app.packages.guide.steps.register.title')}
          </span>
          <br />
          {t('app.packages.guide.steps.register.detail')}
        </li>
        <li>
          <span className="font-bold text-green-400">
            {t('app.packages.guide.steps.request_trial.title')}
          </span>
          <br />
          {t('app.packages.guide.steps.request_trial.detail')}
        </li>
        <li>
          <span className="font-bold text-orange-400">
            {t('app.packages.guide.steps.already_had.title')}
          </span>
          <br />
          {t('app.packages.guide.steps.already_had.detail')}
        </li>
        <li>
          <span className="font-bold text-blue-400">
            {t('app.packages.guide.steps.pay_btc.title')}
          </span>
          <br />
          {t('app.packages.guide.steps.pay_btc.detail')}
        </li>
        <li>
          <span className="font-bold text-pink-400">
            {t('app.packages.guide.steps.instant_activation')}
          </span>
        </li>
        <li>
          <span className="font-bold text-purple-400">
            {t('app.packages.guide.steps.setup.title')}
          </span>
          <br />
          {t('app.packages.guide.steps.setup.detail')}
          <br />
          <br />
          <span className="text-cyan-200">{t('app.packages.guide.steps.done')}</span>
        </li>
      </ul>

      {/* 📱 IPTV App Recommendations */}
      <div className="mt-14">
        <h2 className="text-3xl font-extrabold text-green-500 text-shadow-dark-2 mb-8 text-center">
          {t('app.packages.guide.apps.title')}
        </h2>

        <div className="w-full flex flex-col md:flex-row gap-10 text-lg">
          {/* 🤖 Android Apps */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <h3 className="text-xl font-bold text-green-200 drop-shadow-lg mb-2">
              {t('app.packages.guide.apps.android.title')}
            </h3>
            <ul className="list-disc list-inside ml-4 space-y-2 text-green-100 drop-shadow">
              <li>
                <a
                  className="text-blue-400 hover:text-pink-400 underline transition"
                  href="https://maxplayer.tv/"
                  target="_blank"
                  rel="noopener noreferrer">
                  
                  {t('app.packages.guide.apps.android.maxplayer')}
                </a>
              </li>
              <li>
                <a
                  className="text-blue-400 hover:text-pink-400 underline transition"
                  href="https://tivimate.com/"
                  target="_blank"
                  rel="noopener noreferrer">
                  
                  {t('app.packages.guide.apps.android.tivimate')}
                </a>
              </li>
              <li>
                <a
                  className="text-blue-400 hover:text-pink-400 underline transition"
                  href="https://www.smartersiptvplayer.com/"
                  target="_blank"
                  rel="noopener noreferrer">
                  
                  {t('app.packages.guide.apps.android.smarters')}
                </a>
              </li>
              <li>{t('app.packages.guide.apps.android.any_app')}</li>
            </ul>
          </div>

          {/* 📺 Smart TV Apps */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <h3 className="text-xl font-bold text-yellow-200 drop-shadow-lg mb-2">
              {t('app.packages.guide.apps.smarttv.title')}
            </h3>
            <ul className="list-disc list-inside ml-4 space-y-2 text-cyan-100 drop-shadow">
              <li>
                <a
                  className="text-blue-400 hover:text-pink-400 underline transition"
                  href="https://maxplayer.tv/"
                  target="_blank"
                  rel="noopener noreferrer">
                  
                  {t('app.packages.guide.apps.smarttv.maxplayer')}
                </a>
              </li>
              <li>
                <a
                  className="text-blue-400 hover:text-pink-400 underline transition"
                  href="https://www.smartersiptvplayer.com/"
                  target="_blank"
                  rel="noopener noreferrer">
                  
                  {t('app.packages.guide.apps.smarttv.smarters')}
                </a>
              </li>
              <li>{t('app.packages.guide.apps.smarttv.any_app')}</li>
            </ul>
          </div>

          {/* 🌐 Cross-Platform Apps */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <h3 className="text-xl font-bold text-pink-200 drop-shadow-lg mb-2">
              {t('app.packages.guide.apps.cross.title')}
            </h3>
            <ul className="list-disc list-inside ml-4 space-y-2 text-cyan-100 drop-shadow">
              <li>
                <a
                  className="text-blue-400 hover:text-pink-400 underline transition"
                  href="https://maxplayer.tv/"
                  target="_blank"
                  rel="noopener noreferrer">
                  
                  {t('app.packages.guide.apps.cross.maxplayer')}
                </a>
              </li>
              <li>
                <a
                  className="text-blue-400 hover:text-pink-400 underline transition"
                  href="https://www.smartersiptvplayer.com/"
                  target="_blank"
                  rel="noopener noreferrer">
                  
                  {t('app.packages.guide.apps.cross.smarters')}
                </a>
              </li>
              <li>{t('app.packages.guide.apps.cross.any_app')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>);

}