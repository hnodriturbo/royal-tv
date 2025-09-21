/**
 * RefreshNotifications.js — loader button to refresh notifications for the current user.
 * - Fix: use the actual handler in onClick (was recursively calling the component).
 */
'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import useRefreshNotifications from '@/hooks/socket/useRefreshNotifications';

export default function RefreshNotifications({ user_id: userIdProp }) {
  const { data: session } = useSession();
  const user_id = userIdProp || session?.user?.user_id;
  const { refreshNotifications, loading } = useRefreshNotifications(user_id);
  const t = useTranslations();

  return (
    <button type="button" onClick={refreshNotifications} disabled={loading} aria-busy={loading}>
      {loading ? (
        <>
          <span className="animate-spin" aria-hidden>
            ⟳
          </span>{' '}
          {String(t('socket.ui.common.refreshing') ?? '')}
        </>
      ) : (
        <>⟳ {String(t('socket.ui.common.refresh') ?? '')}</>
      )}
    </button>
  );
}
