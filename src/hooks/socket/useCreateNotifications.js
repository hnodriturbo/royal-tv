/**
 * ================== useCreateNotifications.js ===================
 * 🔔
 * Royal TV – Notification Creator Hook (Frontend)
 * - Triggers all core notification types in Royal TV.
 * - Always sends user and data separately.
 * - Backend merges and shapes the data for templates.
 * - Templates now only use "created" for subscription/trial as those are instantly active!
 * ================================================================
 */

import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

// 🏰 Royal TV: One source of truth for all notifications!
export function useCreateNotifications() {
  // 🎛️ Get socket notification emitters
  const { createNotificationForBoth, createNotificationForAdmin, createNotificationForUser } =
    useSocketHub();

  // 🎁 Free trial created & active (both)
  const createFreeTrialCreatedNotification = useCallback(
    (user, freeTrial) => {
      // 📤 Backend merges user + freeTrial for templates!
      createNotificationForBoth('freeTrial', 'created', user, freeTrial);
    },
    [createNotificationForBoth]
  );

  // 📦 Subscription created & active (both)
  const createSubscriptionCreatedNotification = useCallback(
    (user, subscription) => {
      createNotificationForBoth('subscription', 'created', user, subscription);
    },
    [createNotificationForBoth]
  );

  // 💸 Payment received (both)
  const createPaymentReceivedNotification = useCallback(
    (user, payment) => {
      createNotificationForBoth('payment', null, user, payment);
    },
    [createNotificationForBoth]
  );

  // 💬 Live chat message (both: admin & user)
  const createLiveChatMessageNotification = useCallback(
    (user, message, conversation) => {
      createNotificationForBoth('liveChatMessage', null, user, {
        ...(message || {}),
        ...(conversation || {})
      });
    },
    [createNotificationForBoth]
  );

  // 🛠️ Live chat message (admin only)
  const createLiveChatMessageNotificationForAdminOnly = useCallback(
    (user, message, conversation) => {
      createNotificationForAdmin('liveChatMessage', null, user, {
        ...(message || {}),
        ...(conversation || {})
      });
    },
    [createNotificationForAdmin]
  );

  // 🗣️ Live chat message (user only)
  const createLiveChatMessageNotificationForUserOnly = useCallback(
    (user, message, conversation) => {
      createNotificationForUser('liveChatMessage', null, user, {
        ...(message || {}),
        ...(conversation || {})
      });
    },
    [createNotificationForUser]
  );

  // 🧑 User registration (both)
  const createUserRegistrationNotification = useCallback(
    (user) => {
      createNotificationForBoth('newUserRegistration', null, user, {});
    },
    [createNotificationForBoth]
  );

  // ❌ Error Notification For Admin Only
  const createAdminErrorNotification = useCallback(
    (user, error) => {
      createNotificationForAdmin('error', null, user, error);
    },
    [createNotificationForAdmin]
  );
  // ❌ Error Notification For User Only
  const createUserErrorNotification = useCallback(
    (user, error) => {
      createNotificationForUser('error', null, user, error);
    },
    [createNotificationForUser]
  );

  // ❌ Error Notification For Both User & Admin
  const createErrorNotificationForBoth = useCallback(
    (user, error) => {
      createNotificationForBoth('error', null, user, error);
    },
    [createNotificationForBoth]
  );
  // 🛎️ Return all notification creators for Royal TV
  return {
    createFreeTrialCreatedNotification,
    createSubscriptionCreatedNotification,
    createPaymentReceivedNotification,
    createLiveChatMessageNotification,
    createLiveChatMessageNotificationForAdminOnly,
    createLiveChatMessageNotificationForUserOnly,
    createUserRegistrationNotification,
    createAdminErrorNotification,
    createUserErrorNotification,
    createErrorNotificationForBoth
  };
}
