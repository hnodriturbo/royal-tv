'use client';

/**
 * UserSubscriptionPanel.jsx
 * ------------------------------------------------------------
 * • Self-styled card (no external container required)
 * • Status color map (text + badge background)
 * • Read-only: shows current sub or lets user pick & buy
 * • Locale-aware, socket + REST fallback preserved
 * ------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

import { paymentPackages } from '@/components/packages/data/packages';
import { SafeString } from '@/lib/ui/SafeString';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useSocketHub from '@/hooks/socket/useSocketHub';

// 🎨 Status → styles (badge + text). Keep names stable.
const STATUS_STYLES = {
  active: {
    badge: 'bg-green-700 text-shadow-none ring-1 ring-green-500/30'
  },
  pending: {
    badge: 'bg-amber-200 text-shadow-none ring-1 ring-amber-500/30'
  },
  expired: { badge: 'bg-rose-200 text-shadow-none ring-1 ring-rose-500/30' },
  disabled: { badge: 'bg-gray-300 text-shadow-none ring-1 ring-gray-500/30' },
  unknown: { badge: 'bg-slate-200 text-shadow-none ring-1 ring-slate-500/30' }
};

function StatusPill({ statusKey, label }) {
  const key = STATUS_STYLES[statusKey] ? statusKey : 'unknown';
  const { badge } = STATUS_STYLES[key];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 ${badge}`}>
      <span aria-hidden className="mr-1">
        ●
      </span>
      {label}
    </span>
  );
}

/**
 * Props
 * @param {{ user_id?: string, userId?: string, role?: 'user'|'admin'|'guest' }} props
 */
export default function UserSubscriptionPanel(props) {
  const { user_id, userId: userIdProp, role: roleProp } = props || {};

  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { data: session } = useSession();
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();
  const { fetchSubscriptions, onSubscriptionsList, socketConnected } = useSocketHub();

  // ✅ Resolve identity & role (props override session)
  const userId = user_id ?? userIdProp ?? session?.user?.user_id ?? null;
  const role = roleProp ?? session?.user?.role ?? (userId ? 'user' : 'guest');
  const isGuest = role === 'guest' || !userId;

  // Packages (exclude trials)
  const plans = useMemo(() => (paymentPackages || []).filter((p) => !p.isTrial), []);

  const toLocalized = useCallback(
    (value) => {
      if (value && typeof value === 'object') {
        const key = String(locale).toLowerCase().startsWith('is') ? 'is' : 'en';
        if (value[key]) return value[key];
      }
      return value ?? '';
    },
    [locale]
  );

  const [selectedSlug, setSelectedSlug] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Live subscriptions via socket
  useEffect(() => {
    if (!fetchSubscriptions || !onSubscriptionsList) return;

    const offList = onSubscriptionsList((payload) => {
      const list = Array.isArray(payload) ? payload : payload?.subscriptions;
      if (Array.isArray(list)) setSubscriptions(list);
      setLoading(false);
    });

    if (socketConnected) fetchSubscriptions();

    return () => {
      if (typeof offList === 'function') offList();
    };
  }, [fetchSubscriptions, onSubscriptionsList, socketConnected]);

  // ── REST fallback (authoritative)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/user/subscriptions');
        const list = res?.data?.subscriptions;
        if (alive && Array.isArray(list)) setSubscriptions(list);
      } catch (err) {
        // Keep silent but not empty (lint-safe)
        console.debug('subscriptions REST fallback failed', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const current = useMemo(() => {
    if (!Array.isArray(subscriptions)) return null;
    return subscriptions.find((s) => s?.status === 'active') || subscriptions[0] || null;
  }, [subscriptions]);

  // Normalize status key for styling + i18n
  const statusKey = useMemo(() => {
    const key = String(current?.status || 'unknown').toLowerCase();
    return ['active', 'pending', 'expired', 'disabled'].includes(key) ? key : 'unknown';
  }, [current]);

  const statusLabel = useMemo(() => {
    const i18nKey = statusKey;
    return t(`socket.ui.subscriptions.status.${i18nKey}`);
  }, [statusKey, t]);

  const startPurchase = useCallback(async () => {
    if (!selectedSlug) {
      displayMessage(t('socket.ui.subscriptions.select_package'), 'warning');
      return;
    }
    try {
      showLoader({ text: t('socket.ui.subscriptions.loading') });
      router.push(`/${locale}/packages/${selectedSlug}/buyNow`);
    } catch (err) {
      displayMessage(t('socket.ui.subscriptions.checkout_failed'), 'error');
      console.error('startPurchase failed', err);
    } finally {
      hideLoader();
    }
  }, [selectedSlug, router, locale, showLoader, hideLoader, displayMessage, t]);

  // ──────────────────────────────────────────────────────────
  // Render (self-styled card)
  // ──────────────────────────────────────────────────────────

  // Guest: sign-up CTA only (no Buy Now UI)
  if (isGuest) {
    return (
      <div
        className="
          w-full max-w-3xl mx-auto
          rounded-2xl border border-white/10
          bg-gradient-to-br from-slate-900/10 to-slate-600/10
          shadow-lg p-6 md:p-8 text-center
        "
      >
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          {t('socket.ui.subscriptions.none_title')}
        </h2>
        <p className="text-sm text-gray-300 mb-5">{t('socket.ui.subscriptions.none_blurb')}</p>
        <Link href={`/${locale}/auth/signup`} className="btn-primary inline-flex">
          {t('socket.ui.subscription.create_account', { default: 'Create Account' })}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-style w-full max-w-3xl mx-auto shadow-lg p-4 text-center">
      {/* Title */}
      <header className="mb-4">
        <h2 className="text-2xl font-bold">
          {current
            ? t('socket.ui.subscriptions.have_one')
            : t('socket.ui.subscriptions.none_title')}
        </h2>
      </header>

      {loading ? (
        <div className="animate-pulse text-sm text-gray-300">
          {t('socket.ui.subscriptions.loading')}
        </div>
      ) : current ? (
        // ✅ Has subscription → status + CTA
        <div className="w-full text-center">
          <div className="mb-4">
            <span className="mr-2 font-medium">{t('socket.ui.subscriptions.status_label')}</span>
            <StatusPill statusKey={statusKey} label={statusLabel} />
          </div>

          <Link href={`/${locale}/user/subscriptions`} className="btn-success inline-flex">
            {t('socket.ui.subscriptions.view_yours')}
          </Link>
        </div>
      ) : (
        // ❌ No subscription → purchase flow
        <div className="w-full">
          <p className="text-sm text-gray-300 mb-4">{t('socket.ui.subscriptions.none_blurb')}</p>

          {/* Package selector */}
          <div className="mb-4">
            <label htmlFor="plan" className="block text-sm mb-1 text-gray-300">
              {t('socket.ui.subscriptions.select_package')}
            </label>
            <select
              id="plan"
              className="w-full rounded-2xl border border-gray-700 p-3"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              <option value="">{t('socket.ui.subscriptions.select_package')}</option>
              {plans.map((p) => {
                const name = toLocalized(p.name ?? p.title ?? p.slug);
                const priceLabel = toLocalized(p.priceLabel ?? p.duration ?? '');
                const label = [name, priceLabel].filter(Boolean).join(' — ');
                return (
                  <option key={p.slug} value={p.slug}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selected plan preview & action */}
          {selectedSlug && (
            <div className="border border-gray-700 rounded-2xl p-4 bg-gradient-to-br from-indigo-900/80 to-sky-800/80">
              {plans
                .filter((p) => p.slug === selectedSlug)
                .map((p) => {
                  const name = SafeString(toLocalized(p.name ?? p.title));
                  const desc = SafeString(toLocalized(p.description ?? ''));
                  const price = SafeString(toLocalized(p.priceLabel ?? p.duration ?? ''));
                  return (
                    <div key={p.slug}>
                      <div className="text-xl font-bold mb-1">{name}</div>
                      <div className="text-sm text-gray-800 mb-3">{desc}</div>
                      <div className="text-lg font-semibold mb-3">{price}</div>
                    </div>
                  );
                })}
              <button
                className="btn-secondary btn-glow w-1/2 mt-1"
                type="button"
                onClick={startPurchase}
              >
                {t('socket.ui.subscriptions.buy_now')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
