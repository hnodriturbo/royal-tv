'use client';

/**
 * UserSubscriptionPanel.jsx
 * ------------------------------------------------------------
 * • Socket-driven read-only panel (no create flows here)
 * • If user has a subscription ⇒ show status + button to view list
 * • If no subscription ⇒ show localized dropdown + purchase flow
 * • Locale-aware, compact layout via container-style-sm
 * • Redirects to /{locale}/packages/{slug}/buyNow
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
  const hub = useSocketHub();

  // ✅ Resolve identity & role (props override session)
  const userId = user_id ?? userIdProp ?? session?.user?.user_id ?? null;
  const role = roleProp ?? session?.user?.role ?? (userId ? 'user' : 'guest');
  const isGuest = role === 'guest' || !userId;

  // ──────────────────────────────────────────────────────────
  // Packages (exclude trials) — label localized where possible
  // ──────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────
  // Subscriptions — socket list + REST fallback
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hub) return;

    // Ask server for the list (for current user bound to socket)
    hub.fetchSubscriptions?.(); // emits 'fetch_subscriptions' → 'subscriptions_list' reply

    const offList = hub.onSubscriptionsList?.((payload) => {
      const list = Array.isArray(payload) ? payload : payload?.subscriptions;
      if (Array.isArray(list)) setSubscriptions(list);
      setLoading(false);
    });

    // We intentionally DO NOT listen to onSubscriptionCreated here
    // per requirement: this panel is read-only and should not handle creation events.

    return () => {
      if (typeof offList === 'function') offList();
    };
  }, [hub]);

  // REST fallback (authoritative GET /api/user/subscriptions)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/user/subscriptions');
        const list = res?.data?.subscriptions;
        if (alive && Array.isArray(list)) setSubscriptions(list);
      } catch {
        // silent — socket may still succeed
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

  const startPurchase = useCallback(async () => {
    if (!selectedSlug) {
      displayMessage(t('socket.ui.subscriptions.select_package'), 'warning');
      return;
    }
    try {
      showLoader({ text: t('socket.ui.subscriptions.loading') });
      router.push(`/${locale}/packages/${selectedSlug}/buyNow`);
    } catch {
      displayMessage(t('socket.ui.subscriptions.checkout_failed'), 'error');
    } finally {
      hideLoader();
    }
  }, [selectedSlug, router, locale, showLoader, hideLoader, displayMessage, t]);

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="container-style-sm flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold mb-2">{t('socket.ui.subscriptions.none_title')}</h2>
        <p className="text-sm text-gray-300 mb-4">{t('socket.ui.subscriptions.none_blurb')}</p>
        <Link href={`/${locale}/auth/signup`} className="btn-primary">
          {t('socket.ui.subscription.create_account', { default: 'Create Account' })}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-style-sm flex flex-col items-center">
      {/* Title depends on having a subscription */}
      <h2 className="text-2xl font-bold mb-2">
        {current ? t('socket.ui.subscriptions.have_one') : t('socket.ui.subscriptions.none_title')}
      </h2>

      {loading ? (
        <div className="text-sm text-gray-300 mb-4">{t('socket.ui.subscriptions.loading')}</div>
      ) : current ? (
        // ✅ Has at least one subscription → show status + CTA to list page
        <div className="w-full max-w-xl text-center">
          <div className="text-sm text-gray-300 mb-3">
            {t('socket.ui.subscriptions.status_label')}{' '}
            <b>
              {(() => {
                const key = String(current.status || 'unknown').toLowerCase();
                const known = ['active', 'pending', 'expired', 'disabled'];
                const i18nKey = known.includes(key) ? key : 'unknown';
                return t(`socket.ui.subscriptions.status.${i18nKey}`);
              })()}
            </b>
          </div>
          <Link href={`/${locale}/user/subscriptions`} className="btn-primary inline-block">
            {t('socket.ui.subscriptions.view_yours')}
          </Link>
        </div>
      ) : (
        // ❌ No subscription → render purchase panel
        <div className="w-full max-w-xl">
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
            <div className="border border-gray-700 rounded-2xl p-4 bg-gray-300/60">
              {plans
                .filter((p) => p.slug === selectedSlug)
                .map((p) => (
                  <div key={p.slug}>
                    <div className="text-xl font-bold mb-1">
                      {SafeString(toLocalized(p.name ?? p.title))}
                    </div>
                    <div className="text-sm text-gray-300 mb-3">
                      {SafeString(toLocalized(p.description ?? ''))}
                    </div>
                    <div className="text-lg font-semibold mb-3">
                      {SafeString(toLocalized(p.priceLabel ?? p.duration ?? ''))}
                    </div>
                  </div>
                ))}
              <button className="btn-primary mt-1" type="button" onClick={startPurchase}>
                {t('socket.ui.subscriptions.buy_additional')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
