'use client';

/**
 * 🟢 IsAdminOnline.js
 * Shows compact admin online indicator & admin list for the *user* conversation page.
 * Renders the "Start conversation" button ONLY for non-admin users.
 */

import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';

import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import useIsAdminOnline from '@/hooks/socket/useIsAdminOnline';

const IsAdminOnline = ({ user_id }) => {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();

  // Viewer’s role (the person looking at the page)
  const role = session?.user?.role;
  const isViewerAdmin = role === 'admin';
  const showCreateForUser = !isViewerAdmin && !!user_id; // only show for non-admins with a user_id

  // Socket-derived admin presence
  const { isAdminOnline, adminInfo, singleAdmin } = useIsAdminOnline();

  const statusLabel = isAdminOnline ? (
    <span className="text-green-700 font-semibold">✅ {t('socket.ui.isAdminOnline.online')}</span>
  ) : (
    <span className="text-red-600 font-semibold">❌ {t('socket.ui.isAdminOnline.offline')}</span>
  );

  let adminLine = null;

  if (!isAdminOnline) {
    adminLine = <span className="text-lg">{t('socket.ui.isAdminOnline.no_admin_online')}</span>;
  } else if (singleAdmin) {
    adminLine = (
      <>
        <span className="text-lg">
          {t('socket.ui.isAdminOnline.online_admin')}&nbsp;
          <span className="text-green-700 ml-2">
            {singleAdmin.name || t('socket.ui.isAdminOnline.admin_support')}
          </span>
        </span>

        {/* Show action button ONLY to non-admin viewers */}
        {showCreateForUser ? (
          <ConversationActionButton action="create" user_id={user_id} buttonClass="btn-primary" />
        ) : null}
      </>
    );
  } else if (Array.isArray(adminInfo) && adminInfo.length > 1) {
    adminLine = (
      <>
        <span className="text-lg text-green-700 flex flex-wrap gap-1">
          {t('socket.ui.isAdminOnline.online_admins')}&nbsp;
          {adminInfo.map((admin, idx) => (
            <span key={admin.user_id}>
              {admin.name || t('socket.ui.isAdminOnline.admin_support')}
              {idx < adminInfo.length - 1 ? ',' : ''}
            </span>
          ))}
        </span>

        {/* Show action button ONLY to non-admin viewers */}
        {showCreateForUser ? (
          <ConversationActionButton action="create" user_id={user_id} buttonClass="btn-primary" />
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-bold text-lg underline">{t('socket.ui.isAdminOnline.admin_info')}</span>
      <span className="text-lg flex items-center gap-2">
        {t('socket.ui.isAdminOnline.is_admin_online_label')} {statusLabel}
      </span>
      {adminLine}
    </div>
  );
};

export default IsAdminOnline;
