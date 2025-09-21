// /lib/sorting.js

// 🟢 USER SORTING (Admin: users with conversations)
export const userWithConversationsSortOptions = [
  { value: 'unread_first', label: 'Unread Conversations First' },
  { value: 'read_first', label: 'Read Conversations First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'lastMessage_desc', label: 'Latest Message First' },
  { value: 'lastMessage_asc', label: 'Oldest Message First' }
];

export const getUserWithConversationsSortFunction = (order) => {
  switch (order) {
    case 'unread_first':
      return (a, b) => (b.unreadConvoCount || 0) - (a.unreadConvoCount || 0);
    case 'read_first':
      return (a, b) => (a.unreadConvoCount || 0) - (b.unreadConvoCount || 0);
    case 'name_asc':
      return (a, b) => (a.name || '').localeCompare(b.name || '');
    case 'name_desc':
      return (a, b) => (b.name || '').localeCompare(a.name || '');
    case 'lastMessage_desc':
      return (a, b) => new Date(b.lastMessage || 0) - new Date(a.lastMessage || 0);
    case 'lastMessage_asc':
      return (a, b) => new Date(a.lastMessage || 0) - new Date(b.lastMessage || 0);
    default:
      return () => 0;
  }
};

// 💬 CONVERSATION SORTING (Admin: conversations for one user)
export const conversationSortOptions = [
  { value: 'unread_first', label: 'Unread First' },
  { value: 'read_first', label: 'Read First' },
  { value: 'subject_asc', label: 'Subject (A-Z)' },
  { value: 'subject_desc', label: 'Subject (Z-A)' },
  { value: 'updatedAt_desc', label: 'Latest Updated First' },
  { value: 'updatedAt_asc', label: 'Oldest Updated First' }
];

export const getConversationSortFunction = (order) => {
  switch (order) {
    case 'unread_first':
      return (a, b) => (b.unreadCount || 0) - (a.unreadCount || 0);
    case 'read_first':
      return (a, b) => (a.unreadCount || 0) - (b.unreadCount || 0);
    case 'subject_asc':
      return (a, b) => (a.subject || '').localeCompare(b.subject || '');
    case 'subject_desc':
      return (a, b) => (b.subject || '').localeCompare(a.subject || '');
    case 'updatedAt_desc':
      return (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    case 'updatedAt_asc':
      return (a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
    default:
      return () => 0;
  }
};

// 🟠 Free Trials sorting
export const freeTrialSortOptions = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'status_pending_first', label: 'Pending First' },
  { value: 'status_active_first', label: 'Active First' }
];

export const getFreeTrialSortFunction = (order) => {
  switch (order) {
    case 'createdAt_asc':
      return (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    case 'createdAt_desc':
      return (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    case 'status_pending_first':
      return (a, b) => {
        // Pending first, then active, then others
        const priority = (status) => (status === 'pending' ? 0 : status === 'active' ? 1 : 2);
        return priority(a.status) - priority(b.status);
      };
    case 'status_active_first':
      return (a, b) => {
        const priority = (status) => (status === 'active' ? 0 : status === 'pending' ? 1 : 2);
        return priority(a.status) - priority(b.status);
      };
    default:
      return () => 0;
  }
};

// 🟣 ADMIN / USER SORT OPTIONS
export const adminUserSortOptions = [
  // Name
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },

  // Free Trials
  { value: 'freeTrial_pending', label: 'Free Trial: Pending First' },
  { value: 'freeTrial_active', label: 'Free Trial: Active First' },
  { value: 'freeTrial_disabled', label: 'Free Trial: Disabled First' },

  // Live Chats
  { value: 'livechat_unread_first', label: 'Live Chats: Unread First' },
  { value: 'livechat_read_first', label: 'Live Chats: Read First' },

  // Subscriptions
  { value: 'sub_pending', label: 'Subscription: Pending First' },
  { value: 'sub_active', label: 'Subscription: Active First' },
  { value: 'sub_expired', label: 'Subscription: Expired First' }
];

// 🟣 ADMIN USER SORT FUNCTION
export const getAdminUserSortFunction = (order) => {
  switch (order) {
    // Sort By Free Trials
    case 'freeTrial_pending':
      // Puts users with any pending free trial first
      return (a, b) =>
        (b.freeTrials?.some((ft) => ft.status === 'pending') ? 1 : 0) -
        (a.freeTrials?.some((ft) => ft.status === 'pending') ? 1 : 0);
    case 'freeTrial_active':
      return (a, b) =>
        (b.freeTrials?.some((ft) => ft.status === 'active') ? 1 : 0) -
        (a.freeTrials?.some((ft) => ft.status === 'active') ? 1 : 0);
    case 'freeTrial_disabled':
      return (a, b) =>
        (b.freeTrials?.some((ft) => ft.status === 'disabled') ? 1 : 0) -
        (a.freeTrials?.some((ft) => ft.status === 'disabled') ? 1 : 0);

    // Sort By Live Chats
    case 'livechat_unread_first':
      // Sort By Most unread live chats first
      return (a, b) => (b.unreadLiveChats || 0) - (a.unreadLiveChats || 0);
    case 'livechat_read_first':
      // Sort By read live chats first
      return (a, b) => (a.unreadLiveChats || 0) - (b.unreadLiveChats || 0);

    // Sort By Name
    case 'name_asc':
      return (a, b) => (a.name || '').localeCompare(b.name || '');
    case 'name_desc':
      return (a, b) => (b.name || '').localeCompare(a.name || '');

    // Sort By Subscriptions
    case 'sub_pending':
      return (a, b) =>
        (b.subscriptions?.some((s) => s.status === 'pending') ? 1 : 0) -
        (a.subscriptions?.some((s) => s.status === 'pending') ? 1 : 0);
    case 'sub_active':
      return (a, b) =>
        (b.subscriptions?.some((s) => s.status === 'active') ? 1 : 0) -
        (a.subscriptions?.some((s) => s.status === 'active') ? 1 : 0);
    case 'sub_expired':
      return (a, b) =>
        (b.subscriptions?.some((s) => s.status === 'expired') ? 1 : 0) -
        (a.subscriptions?.some((s) => s.status === 'expired') ? 1 : 0);

    default:
      return () => 0;
  }
};

// =========================
// 🟢 USER / ADMIN SUBSCRIPTION SORTING
// =========================
export const userSubscriptionSortOptions = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'status_active_first', label: 'Active First' },
  { value: 'status_pending_first', label: 'Pending First' },
  { value: 'status_expired_first', label: 'Expired First' }
];

export const getUserSubscriptionSortFunction = (order) => {
  switch (order) {
    case 'status_pending_first':
      // Pending first, then others
      return (a, b) => (b.status === 'pending' ? 1 : 0) - (a.status === 'pending' ? 1 : 0);
    case 'status_active_first':
      return (a, b) => (b.status === 'active' ? 1 : 0) - (a.status === 'active' ? 1 : 0);
    case 'status_expired_first':
      return (a, b) => (b.status === 'expired' ? 1 : 0) - (a.status === 'expired' ? 1 : 0);
    case 'created_desc':
      // Newest first
      return (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    case 'created_asc':
      // Oldest first
      return (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    default:
      return () => 0;
  }
};

// ==============================
// 📜 LOGS SORTING (Admin logs main page)
// ==============================
export const logSortOptions = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'event_asc', label: 'Event (A-Z)' },
  { value: 'event_desc', label: 'Event (Z-A)' },
  { value: 'page_asc', label: 'Page (A-Z)' },
  { value: 'page_desc', label: 'Page (Z-A)' },
  { value: 'ip_address_asc', label: 'IP Address (A-Z)' },
  { value: 'ip_address_desc', label: 'IP Address (Z-A)' },
  { value: 'user_asc', label: 'User (A-Z)' },
  { value: 'user_desc', label: 'User (Z-A)' }
];

export const getLogSortFunction = (order) => {
  switch (order) {
    case 'createdAt_asc':
      return (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
    case 'createdAt_desc':
      return (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
    case 'event_asc':
      return (a, b) => (a.event || '').localeCompare(b.event || '');
    case 'event_desc':
      return (a, b) => (b.event || '').localeCompare(a.event || '');
    case 'page_asc':
      return (a, b) => (a.page || '').localeCompare(b.page || '');
    case 'page_desc':
      return (a, b) => (b.page || '').localeCompare(a.page || '');
    case 'ip_address_asc':
      return (a, b) => (a.ip_address || '').localeCompare(b.ip_address || '');
    case 'ip_address_desc':
      return (a, b) => (b.ip_address || '').localeCompare(a.ip_address || '');
    case 'user_asc':
      return (a, b) => (a.user?.name || '').localeCompare(b.user?.name || '');
    case 'user_desc':
      return (a, b) => (b.user?.name || '').localeCompare(a.user?.name || '');
    default:
      return () => 0;
  }
};
