/**
 * 🟢 IsAdminOnline.js
 * -------------------
 * Shows a compact admin online indicator & admin list for the user conversation page.
 * Usage: <IsAdminOnline />
 */

import useIsAdminOnline from '@/hooks/socket/useIsAdminOnline';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

const IsAdminOnline = ({ user_id }) => {
  // 1️⃣ Get status/info from hook
  const { isAdminOnline, adminInfo, singleAdmin } = useIsAdminOnline();

  // 2️⃣ Inline status label (with emoji)
  const statusLabel = isAdminOnline ? (
    <span className="text-green-700 font-semibold">✅ Online</span>
  ) : (
    <span className="text-red-600 font-semibold">❌ Offline</span>
  );

  // 3️⃣ What to show for admins online
  let adminLine = null;
  if (!isAdminOnline) {
    adminLine = <span className="text-lg">No admin currently online.</span>;
  } else if (singleAdmin) {
    adminLine = (
      <>
        <span className="text-lg">
          Online Admin:
          <span className="text-green-700 ml-2">{singleAdmin.name || 'Admin Support'}</span>
        </span>
        <ConversationActionButton buttonClass={'btn-primary'} action="create" user_id={user_id} />
      </>
    );
  } else if (adminInfo.length > 1) {
    adminLine = (
      <>
        <span className="text-lg text-green-700 flex flex-wrap gap-1">
          Online Admins:&nbsp;
          {adminInfo.map((admin, idx) => (
            <span key={admin.user_id}>
              {admin.name || 'Admin Support'}
              {idx < adminInfo.length - 1 ? ',' : ''}
            </span>
          ))}
        </span>
        <ConversationActionButton action="create" user_id={user_id} />
      </>
    );
  }

  // 4️⃣ Render everything, clean/compact
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-bold text-lg underline">Admin Info</span>
      <span className="text-lg flex items-center gap-2">Is Admin Online: {statusLabel}</span>
      {adminLine}
    </div>
  );
};

export default IsAdminOnline;
