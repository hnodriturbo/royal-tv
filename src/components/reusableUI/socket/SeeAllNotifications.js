'use client';

/**
 * SeeAllNotifications.js
 * Full-page list of all notifications (socket-driven) with expand/delete/clear-all.
 * - Locale-aware routing for per-notification links
 * - Plays nicely with NotificationCenter styles
 */

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';

import RefreshNotifications from '@/components/reusableUI/socket/RefreshNotifications';
import useModal from '@/hooks/useModal';
import useNotifications from '@/hooks/socket/useNotifications';
import { SafeString } from '@/lib/ui/SafeString';

const cardClass = (notif) =>
  `w-full max-w-2xl mx-auto rounded-xl shadow transition-all mb-2
   ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}`;

export default function SeeAllNotifications() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'user';
  const userId = session?.user?.user_id;
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    markAsRead,
    resortNotifications,
    removeNotification,
    clearAllNotifications
    /* refreshNotifications */
  } = useNotifications(userId);

  const { openModal, hideModal } = useModal();

  const [expanded, setExpanded] = useState({});

  const total = notifications.length;
  const sorted = useMemo(() => notifications.slice(), [notifications]);

  const toggle = (id, notif) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
    if (!notif.is_read && !expanded[id]) markAsRead(id);
    if (notif.is_read && expanded[id]) setTimeout(resortNotifications, 600);
  };

  const handleDelete = (id) => {
    openModal('deleteNotification', {
      title: t('socket.ui.notifications.modals.delete.title'),
      description: t('socket.ui.notifications.modals.delete.description'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('socket.ui.notifications.modals.delete.confirm'),
      cancelButtonText: t('socket.ui.notifications.modals.common.cancel'),
      onConfirm: () => {
        removeNotification(id);
        hideModal();
      },
      onCancel: hideModal
    });
  };

  const handleClearAll = () => {
    openModal('clearAllNotifications', {
      title: t('socket.ui.notifications.modals.clear_all.title'),
      description: t('socket.ui.notifications.modals.clear_all.description'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('socket.ui.notifications.modals.clear_all.confirm'),
      cancelButtonText: t('socket.ui.notifications.modals.common.cancel'),
      onConfirm: () => {
        clearAllNotifications();
        hideModal();
      },
      onCancel: hideModal
    });
  };

  useEffect(() => {
    /* ensure sorted on mount */ resortNotifications();
  }, [resortNotifications]);

  const shouldShowButton = (notif) => {
    if (userRole === 'admin') return Boolean(notif.link);
    return Boolean(notif.link) && notif.type !== 'newUserRegistration';
  };

  return (
    <div className="container-style flex flex-col items-center w-full">
      <div className="w-full flex items-center justify-between max-w-2xl">
        <h1 className="text-2xl font-bold flex items-center">
          🔔 {t('socket.ui.notifications.title')}
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
              {unreadCount}
            </span>
          )}
        </h1>
        <RefreshNotifications user_id={userId} />
      </div>

      <hr className="border border-gray-700 w-full max-w-2xl my-4" />

      {total === 0 ? (
        <div className="text-gray-400 py-10">{t('socket.ui.notifications.empty')}</div>
      ) : (
        <div className="w-full">
          {sorted.map((notif) => (
            <div key={notif.notification_id} className={cardClass(notif)}>
              <button
                type="button"
                className="w-full text-left flex justify-between items-center px-5 py-3 cursor-pointer"
                onClick={() => toggle(notif.notification_id, notif)}
                aria-expanded={!!expanded[notif.notification_id]}
              >
                <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                  {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  <span className="text-md">
                    {SafeString(notif.title, 'SeeAllNotifications.title') ?? ''}
                  </span>
                </div>
                <span className="ml-2 text-lg">{expanded[notif.notification_id] ? '−' : '+'}</span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-700 ${expanded[notif.notification_id] ? 'max-h-96' : 'max-h-0'}`}
              >
                <div
                  className={
                    expanded[notif.notification_id]
                      ? 'px-5 pb-3 pt-1 border-t border-gray-700 max-h-56 overflow-y-auto custom-scrollbar'
                      : 'px-5 pb-3 pt-1 border-t border-gray-700'
                  }
                >
                  <div className="text-gray-300 mb-3 mt-2">
                    <p className="whitespace-pre-wrap">
                      {SafeString(notif.body, 'SeeAllNotifications.body')}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    {/* 🗑️ delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(notif.notification_id)}
                      className="btn btn-danger cursor-pointer px-3 py-1.5 rounded-md text-sm" // 👈 style + pointer
                      title={String(t('socket.ui.notifications.actions.delete') ?? '')} // 🏷️ a11y
                    >
                      🗑️ {t('socket.ui.notifications.actions.delete')} {/* ❌ */}
                    </button>

                    {/* 🔗 open (only if link is a non-empty string) */}
                    {shouldShowButton(notif) &&
                      typeof notif.link === 'string' &&
                      notif.link.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/${locale}${String(notif.link).startsWith('/') ? '' : '/'}${String(notif.link).replace(/^\//, '')}`
                            )
                          } // 🌍 locale-aware + safe leading slash
                          className="btn btn-primary cursor-pointer px-3 py-1.5 rounded-md text-sm"
                        >
                          {t('socket.ui.notifications.actions.open')} {/* 🔓 */}
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="w-full max-w-sm mx-auto border border-red-700 rounded-2xl bg-red-950/60 flex flex-col items-center p-6 shadow-lg mt-6">
          <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            {t('socket.ui.notifications.danger_zone')}
          </h3>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-5 py-2 rounded-lg bg-red-700 hover:bg-red-900 border border-red-500 text-white font-bold shadow transition"
          >
            🧨 {t('socket.ui.notifications.actions.clear_all')}
          </button>
        </div>
      )}
    </div>
  );
}
