/**
 * ================== useCreateNotifications.js ===================
 * 🔔
 * Royal TV – Notification Creator Hook (Frontend)
 * - Triggers all core notification types in Royal TV.
 * - Always sends user and data separately.
 * - Backend merges and shapes the data for templates.
 * ================================================================
 */

import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

// 🏰 Royal TV: One source of truth for all notifications!
export function useCreateNotifications() {
  // 🎛️ Grab notification emitters from socket hub
  const { createNotificationForBoth, createNotificationForAdmin, createNotificationForUser } =
    useSocketHub();

  // 1️⃣ Free trial requested (both)
  const createFreeTrialRequestedNotification = useCallback(
    (user, freeTrial) => {
      // 📤 Backend merges user + freeTrial for templates!
      createNotificationForBoth('freeTrial', 'requested', user, freeTrial);
    },
    [createNotificationForBoth]
  );

  // 2️⃣ Free trial activated (both)
  const createFreeTrialActivatedNotification = useCallback(
    (user, freeTrial) => {
      createNotificationForBoth('freeTrial', 'activated', user, freeTrial);
    },
    [createNotificationForBoth]
  );

  // 3️⃣ Subscription created (both)
  const createSubscriptionCreatedNotification = useCallback(
    (user, subscription) => {
      createNotificationForBoth('subscription', 'created', user, subscription);
    },
    [createNotificationForBoth]
  );

  // 4️⃣ Subscription activated (both)
  const createSubscriptionActivatedNotification = useCallback(
    (user, subscription) => {
      createNotificationForBoth('subscription', 'activated', user, subscription);
    },
    [createNotificationForBoth]
  );

  // 5️⃣ Payment received (both)
  const createPaymentReceivedNotification = useCallback(
    (user, payment) => {
      createNotificationForBoth('payment', null, user, payment);
    },
    [createNotificationForBoth]
  );

  // 6️⃣ Live chat message (both: admin & user)
  const createLiveChatMessageNotification = useCallback(
    (user, message, conversation) => {
      createNotificationForBoth('liveChatMessage', null, user, {
        ...(message || {}),
        ...(conversation || {})
      });
    },
    [createNotificationForBoth]
  );

  // 7️⃣ Live chat message (admin only)
  const createLiveChatMessageNotificationForAdminOnly = useCallback(
    (user, message, conversation) => {
      // 💡 Always send user as separate param or inside payload (backend expects user, data)
      createNotificationForAdmin('liveChatMessage', null, user, {
        ...(message || {}),
        ...(conversation || {})
      });
    },
    [createNotificationForAdmin]
  );

  // 8️⃣ Live chat message (user only)
  const createLiveChatMessageNotificationForUserOnly = useCallback(
    (user, message, conversation) => {
      createNotificationForUser('liveChatMessage', null, user, {
        ...(message || {}),
        ...(conversation || {})
      });
    },
    [createNotificationForUser]
  );

  // 9️⃣ User registration (both)
  const createUserRegistrationNotification = useCallback(
    (user) => {
      createNotificationForBoth('newUserRegistration', null, user, {});
    },
    [createNotificationForBoth]
  );

  // 🛎️ Return all Royal TV notification creators
  return {
    createFreeTrialRequestedNotification,
    createFreeTrialActivatedNotification,
    createSubscriptionCreatedNotification,
    createSubscriptionActivatedNotification,
    createPaymentReceivedNotification,
    createLiveChatMessageNotification,
    createLiveChatMessageNotificationForAdminOnly,
    createLiveChatMessageNotificationForUserOnly,
    createUserRegistrationNotification
  };
}
